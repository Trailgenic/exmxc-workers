import assert from 'node:assert/strict';
import { DATASETS, DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/power_lens'));
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
console.log('registry invariants pass');
