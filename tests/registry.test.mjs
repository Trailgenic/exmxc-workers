import assert from 'node:assert/strict';
import { DATASETS, DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
import { calculateRealityGapScores, realityGapClassification } from '../lib/queries.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/power_lens'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.reality_gap.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/reality_gap_index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/reality_gap_index'));
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
console.log('registry invariants pass');
