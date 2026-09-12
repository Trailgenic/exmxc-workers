import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import { buildRepeatConsensus } from "../lib/ai-power-consensus.js";
import { validateAiPowerReleaseSemantics } from "../lib/ai-power-v2.js";
import profileSchema from "../schema/ai_power_profile_v2.schema.json" with { type: "json" };

const paths = process.argv.slice(2);
if (paths.length !== 2) throw new Error("Usage: reconcile-ai-power-v2.mjs first-candidate.json second-candidate.json");
const wrappers = await Promise.all(paths.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const releases = wrappers.map((value) => value.release || value);
const release = buildRepeatConsensus(releases[0], releases[1]);
const validateSchema = new Ajv2020({ allErrors: true, strict: false, validateFormats: false }).compile(profileSchema);
if (!validateSchema(release)) throw new Error(`Consensus schema failed: ${JSON.stringify(validateSchema.errors)}`);
const semantic = validateAiPowerReleaseSemantics(release);
if (!semantic.ok) throw new Error(`Consensus semantics failed: ${semantic.errors.join(" | ")}`);

const usage = wrappers.flatMap((wrapper) => wrapper.run_log || []).reduce((totals, item) => {
  for (const pass of ["extraction", "verification"]) {
    const passUsage = item.model_usage?.[pass]?.usage;
    totals.input_tokens += passUsage?.input_tokens || 0;
    totals.output_tokens += passUsage?.output_tokens || 0;
    totals.total_tokens += passUsage?.total_tokens || 0;
  }
  return totals;
}, { input_tokens: 0, output_tokens: 0, total_tokens: 0 });
const diagnostics = release.profiles.filter((profile) => profile.collection.attempted).map((profile) => ({
  entity_id: profile.entity.id,
  status: profile.assessment.status,
  repeated_evidence_records: profile.evidence_refs.length,
  consensus_grades: Object.fromEntries(profile.assessment.criteria.map((criterion) => [criterion.id, criterion.grade]))
}));
process.stdout.write(`${JSON.stringify({
  status: "consensus_candidate",
  writes_repository: false,
  repeat_policy: "retain repeated verified evidence; publish a grade only when both attempts and deterministic gates agree",
  usage,
  diagnostics,
  release
}, null, 2)}\n`);
