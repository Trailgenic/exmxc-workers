import assert from "node:assert/strict";
import vm from "node:vm";
import { EXMXC_WEBMCP_POWER_LENS } from "../lib/webmcp-power-lens.js";

const plain = (value) => JSON.parse(JSON.stringify(value));
const registeredTools = [];
let currentResult = null;

const fixture = {
  product: "exmxc Power Lens",
  version: "2.0-pilot",
  release: { release_id: "ai-power-v2.0-pilot-staging", status: "staging", evidence_cutoff_at: null },
  found: true,
  match: { entity_id: "company-nvidia", canonical_entity: "NVIDIA", matched_on: "alias_or_ticker" },
  profile: {
    mechanism: { title: "AI accelerator platform and software ecosystem", primary_force: "compute", stage: "unverified" },
    collection: { status: "not_started" },
    assessment: { summary_state: "insufficient_evidence", summary_label: "Insufficient evidence", criteria: [] }
  },
  evidence: [],
  methodology: { aggregation_policy: "No composite." },
  coverage: { composite_score_available: false, universal_rank_available: false },
  suggestions: [],
  disclaimer: "Experimental evidence-backed analytical profile."
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
  version: "2.0",
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
assert.equal(completed.structuredContent.profile.assessment.summary_state, "insufficient_evidence");
assert.equal(completed.structuredContent.coverage.composite_score_available, false);

const reread = await readTool.execute({});
assert.deepEqual(
  plain(reread.structuredContent),
  plain(completed.structuredContent)
);

console.log("exmxc Power Lens WebMCP verification passed.");
