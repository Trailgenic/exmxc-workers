import { readdir, readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateAiPowerReleaseSemantics } from '../lib/ai-power-v2.js';
import { SPEG_INDEX_RELEASE, validateSpegIndexReleaseSemantics } from '../lib/speg-index-v1.js';

async function jsonFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await jsonFiles(path));
    else if (entry.name.endsWith('.json')) files.push(path);
  }
  return files;
}
for (const dir of ['data', 'schema', 'registry']) for (const file of await jsonFiles(dir)) JSON.parse(await readFile(file, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const methodology = JSON.parse(await readFile('data/ai_power_v2/methodology.json', 'utf8'));
const release = JSON.parse(await readFile('data/ai_power_v2/releases/2026-09-11-pilot.json', 'utf8'));
const methodologySchema = JSON.parse(await readFile('schema/ai_power_methodology_v2.schema.json', 'utf8'));
const profileSchema = JSON.parse(await readFile('schema/ai_power_profile_v2.schema.json', 'utf8'));
const sourceManifestSchema = JSON.parse(await readFile('schema/ai_power_source_manifest_v2.schema.json', 'utf8'));
const spegIndexSchema = JSON.parse(await readFile('schema/speg_index_profile_v1.schema.json', 'utf8'));
const consumerIntentObservationSchema = JSON.parse(await readFile('schema/consumer_intent_observation_v1.schema.json', 'utf8'));
const consumerIntentReleaseSchema = JSON.parse(await readFile('schema/consumer_intent_release_v1.schema.json', 'utf8'));
const consumerIntentRelease = JSON.parse(await readFile('data/consumer_intent_v1/releases/2026-09-21-foundation.json', 'utf8'));
ajv.compile(sourceManifestSchema);
ajv.compile(consumerIntentObservationSchema);
const validateMethodology = ajv.compile(methodologySchema);
if (!validateMethodology(methodology)) throw new Error(`AI Power methodology schema failed: ${JSON.stringify(validateMethodology.errors)}`);
const validateRelease = ajv.compile(profileSchema);
if (!validateRelease(release)) throw new Error(`AI Power profile schema failed: ${JSON.stringify(validateRelease.errors)}`);
const semantic = validateAiPowerReleaseSemantics(release);
if (!semantic.ok) throw new Error(`AI Power semantic validation failed: ${semantic.errors.join(' | ')}`);
const validateSpegIndex = ajv.compile(spegIndexSchema);
if (!validateSpegIndex(SPEG_INDEX_RELEASE)) throw new Error(`sPEG Index schema failed: ${JSON.stringify(validateSpegIndex.errors)}`);
const spegIndexSemantic = validateSpegIndexReleaseSemantics(SPEG_INDEX_RELEASE);
if (!spegIndexSemantic.ok) throw new Error(`sPEG Index semantic validation failed: ${spegIndexSemantic.errors.join(' | ')}`);
const validateConsumerIntentRelease = ajv.compile(consumerIntentReleaseSchema);
if (!validateConsumerIntentRelease(consumerIntentRelease)) throw new Error(`Consumer Intent release schema failed: ${JSON.stringify(validateConsumerIntentRelease.errors)}`);
if (consumerIntentRelease.composite !== null) throw new Error('Consumer Intent v1 must not publish a composite.');
if (consumerIntentRelease.coverage.observation_count === 0 && consumerIntentRelease.factor_readings.some(reading => reading.status !== 'insufficient_evidence')) {
  throw new Error('Consumer Intent foundation release cannot publish measured factors without observations.');
}

const forbiddenV2Keys = new Set(['ai_power_index', 'rank', 'percentile', 'weighted_contribution']);
function assertNoCompositeFields(value, path = 'release') {
  if (Array.isArray(value)) return value.forEach((child, index) => assertNoCompositeFields(child, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenV2Keys.has(key)) throw new Error(`Forbidden v2 composite field at ${path}.${key}`);
    assertNoCompositeFields(child, `${path}.${key}`);
  }
}
assertNoCompositeFields(release);
console.log('json, AI Power v2, sPEG Index v1, and Consumer Intent v1 contracts valid');
