import assert from "node:assert/strict";
import vm from "node:vm";
import { EXMXC_WEBMCP_POWER_LENS } from "../lib/webmcp-power-lens.js";

const plain = (value) => JSON.parse(JSON.stringify(value));
const registeredTools = [];
let currentResult = null;

const fixture = {
  product: "exmxc Power Lens",
  version: "1.1",
  generated_at: "2026-09-02",
  found: true,
  match: { canonical_entity: "NVIDIA", matched_on: "alias_or_ticker" },
  power: {
    ai_power_index: 8.6,
    rank: 3,
    universe_size: 84,
    tier: "System-Shaping"
  },
  four_forces: [
    { id: "compute", label: "Compute", score: 10, weight: 0.3, weighted_contribution: 3 },
    { id: "interface", label: "Interface", score: 9, weight: 0.25, weighted_contribution: 2.25 },
    { id: "alignment", label: "Alignment", score: 7, weight: 0.25, weighted_contribution: 1.75 },
    { id: "energy", label: "Energy", score: 8, weight: 0.2, weighted_contribution: 1.6 }
  ],
  entity_clarity: { ecc: 100, posture: "Open", capability: "High" },
  scarcity: { ticker: "NVDA", speg: 0.27, snapshot_date: "2026-07-16" },
  reality_gap: { reality_gap: -3, classification: "narrative_capability_aligned" },
  interpretation: { summary: "NVIDIA ranks #3 of 84." },
  coverage: { ai_power_index: true, four_forces: true },
  provenance: {
    methodology: "Four Forces weights: Compute 30%, Interface 25%, Alignment 25%, Energy 20%."
  },
  disclaimer: "Derived reference layer; not live market data or investment advice."
};

const document = {
  modelContext: {
    async registerTool(tool) {
      registeredTools.push(tool);
    }
  }
};

const window = {
  exmxcPowerLens: {
    async run(query) {
      assert.equal(query, "NVDA");
      currentResult = fixture;
      return currentResult;
    },
    read() {
      return currentResult;
    }
  }
};

await vm.runInNewContext(EXMXC_WEBMCP_POWER_LENS, {
  console,
  document,
  window,
  Set,
  TypeError,
  Error,
  Object,
  Array,
  String,
  JSON,
  Promise
});

assert.deepEqual(
  registeredTools.map((tool) => tool.name),
  ["run_exmxc_power_lens", "get_exmxc_power_lens_result"]
);
assert.equal(registeredTools[0].annotations.readOnlyHint, false);
assert.equal(registeredTools[1].annotations.readOnlyHint, true);
assert.deepEqual(plain(window.__exmxcWebMCP), {
  version: "1.0",
  surface: "power-lens",
  tools: ["run_exmxc_power_lens", "get_exmxc_power_lens_result"]
});

const readTool = registeredTools[1];
const empty = await readTool.execute({});
assert.equal(empty.structuredContent.completed, false);

const runTool = registeredTools[0];
await assert.rejects(
  () => runTool.execute({ query: "NVDA", extra: true }),
  /accepts exactly one field/
);

const completed = await runTool.execute({ query: "NVDA" });
assert.equal(completed.structuredContent.completed, true);
assert.equal(completed.structuredContent.match.canonical_entity, "NVIDIA");
assert.equal(completed.structuredContent.power.ai_power_index, 8.6);
assert.equal(completed.structuredContent.four_forces.length, 4);

const reread = await readTool.execute({});
assert.deepEqual(
  plain(reread.structuredContent),
  plain(completed.structuredContent)
);

console.log("exmxc Power Lens WebMCP verification passed.");
