import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CONSUMER_INTENT_CATEGORIES,
  CONSUMER_INTENT_LATEST,
  CONSUMER_INTENT_METHODOLOGY,
  aggregateConsumerPulse,
  deduplicateConsumerObservations,
  normalizeConsumerObservation,
  resolveConsumerEntity
} from '../lib/consumer-intent.js';

const args = Object.fromEntries(process.argv.slice(2).map((value, index, values) => value.startsWith('--') ? [value.slice(2), values[index + 1]] : null).filter(Boolean));
if (!args.input || !args['as-of'] || !args['release-id']) {
  throw new Error('Usage: node scripts/build-consumer-intent-release.mjs --input observations.json --as-of YYYY-MM-DD --release-id ID');
}

const input = JSON.parse(await readFile(resolve(args.input), 'utf8'));
if (!Array.isArray(input)) throw new Error('Input must be a JSON array of structured observation candidates.');
const normalized = input.map(normalizeConsumerObservation);
const failures = normalized.filter(result => !result.success);
if (failures.length) throw new Error(`Rejected ${failures.length} observations: ${JSON.stringify(failures.slice(0, 5))}`);
const observations = deduplicateConsumerObservations(normalized.map(result => result.observation));
const asOf = new Date(`${args['as-of']}T23:59:59.999Z`);
if (Number.isNaN(asOf.valueOf())) throw new Error('--as-of must be YYYY-MM-DD.');
const within = days => observations.filter(row => {
  const timestamp = new Date(row.timestamp);
  const difference = (asOf - timestamp) / 86400000;
  return difference >= 0 && difference < days;
});
const factorReadings = aggregateConsumerPulse(within(30), { window: '30d' });
const observedCategoryIds = [...new Set(observations.map(row => row.category))];
const categoryReadings = observedCategoryIds.map(categoryId => ({
  category_id: categoryId,
  label: CONSUMER_INTENT_CATEGORIES.categories.find(row => row.id === categoryId)?.label || categoryId,
  status: aggregateConsumerPulse(within(30), { window: '30d', category: categoryId }).some(row => row.status === 'measured') ? 'measured' : 'insufficient_evidence',
  factors: aggregateConsumerPulse(within(30), { window: '30d', category: categoryId })
}));
const companyInputs = ['NKE', 'TJX'];
const entityReadings = companyInputs.map(ticker => {
  const company = resolveConsumerEntity(ticker);
  const factors30 = aggregateConsumerPulse(within(30), { window: '30d', entity: ticker });
  const status = factors30.some(row => row.status === 'measured') ? 'measured' : 'insufficient_evidence';
  const windows = Object.fromEntries([[7, '7d'], [30, '30d'], [90, '90d']].map(([days, label]) => {
    const readings = aggregateConsumerPulse(within(days), { window: label, entity: ticker });
    return [label, readings.some(row => row.status === 'measured') ? readings : null];
  }));
  return {
    entity_id: company.id,
    company: company.display_name,
    ticker,
    status,
    windows,
    factors: factors30,
    substitutions: [],
    major_reasons: [...new Set(factors30.flatMap(row => row.dominant_drivers))].slice(0, 5)
  };
});
const substitutions = observations.filter(row => row.substitute_entity_id).reduce((map, row) => {
  const id = `${row.entity_id || 'unknown'}:${row.substitute_entity_id}`;
  const existing = map.get(id) || { from_entity_id: row.entity_id, to_entity_id: row.substitute_entity_id, observation_count: 0, confidence_mass: 0 };
  existing.observation_count += 1;
  existing.confidence_mass = Number((existing.confidence_mass + row.confidence).toFixed(3));
  map.set(id, existing);
  return map;
}, new Map());
const sources = new Set(observations.map(row => `${row.source_type}:${row.source}`));
const collectionDays = new Set(observations.map(row => row.collection_date));
const release = {
  ...structuredClone(CONSUMER_INTENT_LATEST),
  release_id: args['release-id'],
  release_status: args.status || 'pilot',
  as_of: args['as-of'],
  model_version: args['model-version'] || observations[0]?.model_version || null,
  coverage: {
    collection_started: observations.length > 0,
    observation_count: input.length,
    unique_observation_count: observations.length,
    independent_source_count: sources.size,
    collection_days: collectionDays.size,
    categories_observed: observedCategoryIds.length,
    entities_observed: new Set(observations.map(row => row.entity_id).filter(Boolean)).size
  },
  factor_readings: factorReadings,
  category_readings: categoryReadings,
  entity_readings: entityReadings,
  substitutions: [...substitutions.values()].sort((a, b) => b.confidence_mass - a.confidence_mass),
  change_note: args.note || 'Generated from normalized Consumer Intent Graph observations.',
  interpretation_boundary: CONSUMER_INTENT_METHODOLOGY.construct_boundary.positioning
};
const output = resolve(args.output || `data/consumer_intent_v1/releases/${args['release-id'].replace(/^consumer-intent-/, '')}.json`);
await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, `${JSON.stringify(release, null, 2)}\n`);
console.log(`consumer intent release written: ${output} (${observations.length} unique observations)`);
