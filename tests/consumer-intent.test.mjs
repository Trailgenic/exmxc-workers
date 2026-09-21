import assert from 'node:assert/strict';
import {
  aggregateConsumerFactor,
  deduplicateConsumerObservations,
  normalizeConsumerObservation,
  resolveConsumerEntity
} from '../lib/consumer-intent.js';

assert.equal(resolveConsumerEntity('TJ Maxx').parent_company_id, 'company-tjx');
assert.equal(resolveConsumerEntity('NKE').id, 'company-nike');
assert.equal(resolveConsumerEntity('Hoka One One').ticker, 'DECK');

const normalized = normalizeConsumerObservation({
  observation_id: 'obs-1',
  timestamp: '2026-09-20T18:30:00Z',
  source: 'fixture-community',
  source_type: 'public_forum',
  category: 'athletic-footwear',
  entity: 'Nike',
  substitute_entity: 'HOKA',
  consumer_action: 'BRAND_SUBSTITUTION',
  direction: 'negative',
  economic_driver: 'fit',
  time_horizon: 'completed',
  intensity: 0.9,
  confidence: 0.92,
  model_version: 'fixture-v1'
});
assert.equal(normalized.success, true);
assert.equal(normalized.observation.entity_id, 'brand-nike');
assert.equal(normalized.observation.parent_company_id, 'company-nike');
assert.equal(normalized.observation.substitute_entity_id, 'brand-hoka');

const duplicates = [
  { ...normalized.observation, observation_id: 'a', duplicate_cluster_id: 'cluster-1' },
  { ...normalized.observation, observation_id: 'b', duplicate_cluster_id: 'cluster-1' }
];
assert.equal(deduplicateConsumerObservations(duplicates).length, 1);

const fixture = [];
for (let index = 0; index < 30; index += 1) {
  fixture.push({
    ...normalized.observation,
    observation_id: `purchase-${index}`,
    duplicate_cluster_id: `cluster-${index}`,
    consumer_action: index < 21 ? 'PURCHASE_INTENT' : 'PURCHASE_DELAY',
    collection_date: `2026-09-${String(1 + (index % 10)).padStart(2, '0')}`,
    source: `source-${index % 3}`,
    confidence: 0.8,
    intensity: 0.75
  });
}
const reading = aggregateConsumerFactor(fixture, 'purchase_intent');
assert.equal(reading.status, 'measured');
assert.equal(reading.observation_count, 30);
assert.equal(reading.source_count, 3);
assert.equal(reading.balance, 40);
assert.equal(reading.direction, 'positive');

const thin = aggregateConsumerFactor(fixture.slice(0, 10), 'purchase_intent');
assert.equal(thin.status, 'insufficient_evidence');
assert.equal(thin.balance, null);

console.log('consumer intent tests passed');
