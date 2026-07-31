import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import { DATASETS, DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
import strategicConsequenceSchema from '../schema/strategic_consequence.schema.json' with { type: 'json' };
import {
  calculateRealityGapScores,
  getStrategicConsequence,
  realityGapClassification,
  strategicConsequenceClassification
} from '../lib/queries.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/power_lens'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.reality_gap.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/reality_gap_index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/reality_gap_index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.strategic_consequence.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/strategic_consequence_scenarios'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/strategic_consequence'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_registry'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_series'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_snapshot'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_changes'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_release'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/entity_registry'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/eci_observation'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/eci_release'));
assert.equal(DATASETS.entity_registry.data.entity_count, 745);
assert.equal(DATASETS.entity_clarity_latest_snapshot.data.observation_count, 744);
assert.equal(DATASETS.entity_clarity_latest_changes.data.matched_panel_count, 744);
assert.equal(DATASETS.entity_clarity_latest_release.data.source_qa.duplicate_rows_removed, 3);
assert.equal(DATASETS.entity_clarity_latest_release.data.current_observation_count, 744);
assert.equal(DATASETS.entity_clarity_latest_release.data.registry_entity_count, 745);
assert.equal(DATASETS.speg.data.metadata.as_of_date, '2026-07-16');
assert.equal(DATASETS.speg.data.metadata.snapshot_type, 'forward_fiscal_eps_proxy');
assert.equal(DATASETS.speg.data.rows.length, 25);
for (const row of DATASETS.speg.data.rows) {
  const y1 = row.forward_eps_year_1.midpoint * (row.normalization_factor_native_per_usd ?? 1);
  const expectedPe = row.price / y1;
  const expectedSpeg = expectedPe / (row.forward_eps_growth_pct * row.scarcity_multiplier);
  assert.ok(Math.abs(expectedPe - row.forward_pe) < 0.02, `${row.ticker} forward P/E drift`);
  assert.ok(Math.abs(expectedSpeg - row.speg) < 0.02, `${row.ticker} sPEG drift`);
}
assert.equal(DATASETS.reality_gap_index.data.metadata.as_of_date, '2026-07-21');
assert.equal(DATASETS.reality_gap_index.data.rows.length, 10);
assert.equal(DATASETS.reality_gap_index.data.metadata.scoring_anchors.narrative_components.length, 5);
assert.equal(DATASETS.reality_gap_index.data.metadata.scoring_anchors.capability_components.length, 5);
assert.deepEqual(Object.keys(DATASETS.reality_gap_index.data.metadata.confidence_policy).sort(), ['high', 'low', 'medium']);
assert.equal(Object.values(DATASETS.reality_gap_index.data.metadata.narrative_weights).reduce((sum, value) => sum + value, 0), 1);
assert.equal(Object.values(DATASETS.reality_gap_index.data.metadata.capability_weights).reduce((sum, value) => sum + value, 0), 1);
for (const anchors of Object.values(DATASETS.reality_gap_index.data.metadata.scoring_anchors)) {
  assert.deepEqual(anchors.map(({ score }) => score), [0, 2.5, 5, 7.5, 10]);
}
for (let gap = -1000; gap <= 1000; gap += 1) {
  assert.ok(realityGapClassification(gap / 10), `Reality Gap ${(gap / 10).toFixed(1)} must map to a classification`);
}
for (const row of DATASETS.reality_gap_index.data.rows) {
  const calculated = calculateRealityGapScores(row);
  assert.deepEqual(calculated, {
    ai_narrative_score: row.ai_narrative_score,
    ai_capability_score: row.ai_capability_score,
    reality_gap: row.reality_gap
  }, `${row.ticker} Reality Gap formula drift`);
  const band = realityGapClassification(row.reality_gap);
  assert.equal(band?.id, row.classification, `${row.ticker} Reality Gap classification drift`);
  assert.equal(band?.label, row.classification_label, `${row.ticker} Reality Gap label drift`);
  assert.ok(row.evidence.length > 0, `${row.ticker} must expose dated evidence`);
}

const consequenceData = DATASETS.strategic_consequence_scenarios.data;
assert.equal(consequenceData.metadata.as_of_date, '2026-07-29');
assert.equal(consequenceData.scenarios.length, 6);
assert.equal(new Set(consequenceData.scenarios.map(({ id }) => id)).size, consequenceData.scenarios.length);
assert.equal(Object.values(consequenceData.metadata.force_weights).reduce((sum, value) => sum + value, 0), 1);
const validateConsequence = new Ajv2020({ allErrors: true, strict: false, validateFormats: false })
  .compile(strategicConsequenceSchema);
for (const scenario of consequenceData.scenarios) {
  assert.deepEqual(Object.keys(scenario.force_deltas).sort(), ['alignment', 'compute', 'energy', 'interface']);
  assert.ok(scenario.first_order_logic.length >= 3, `${scenario.id} must expose first-order logic`);
  assert.ok(scenario.second_order_consequences.length >= 3, `${scenario.id} must expose second-order consequences`);
  assert.ok(scenario.bottlenecks.length >= 3, `${scenario.id} must expose bottlenecks`);
  assert.ok(scenario.assumptions.length >= 3, `${scenario.id} must expose assumptions`);
  assert.ok(scenario.confirming_signals.length >= 3, `${scenario.id} must expose confirming signals`);
  assert.ok(scenario.invalidating_signals.length >= 3, `${scenario.id} must expose invalidating signals`);

  const one = getStrategicConsequence({ scenario: scenario.id, query: 'NVDA', limit: 5 });
  const two = getStrategicConsequence({ scenario: scenario.id, query: 'NVDA', limit: 5 });
  assert.deepEqual(one, two, `${scenario.id} output must be deterministic`);
  assert.equal(one.universe_size, DATASETS.ai_power_index.data.scores.length);
  assert.equal(one.first_order.most_advantaged.length, 5);
  assert.equal(one.first_order.most_pressured.length, 5);
  assert.equal(one.first_order.most_advantaged[0].scenario_advantage_score, 100);
  assert.equal(one.first_order.most_pressured[0].scenario_advantage_score, 0);
  assert.equal(one.entity_result.entity_name, 'NVIDIA');
  assert.ok(strategicConsequenceClassification(one.entity_result.scenario_advantage_score));
  assert.ok(validateConsequence(one), `${scenario.id} response schema drift: ${JSON.stringify(validateConsequence.errors)}`);
}
const missingConsequenceEntity = getStrategicConsequence({
  scenario: 'power_binding_constraint',
  query: 'NVIDA'
});
assert.equal(missingConsequenceEntity.found, false);
assert.ok(missingConsequenceEntity.suggestions.includes('NVIDIA'));
console.log('registry invariants pass');
