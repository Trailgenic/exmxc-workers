import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { AI_POWER_V2_RELEASE, validateAiPowerReleaseSemantics } from "../lib/ai-power-v2.js";
import {
  assembleVerifiedProfile,
  callAnthropicJson,
  collectEvidenceDocuments,
  extractionPrompt,
  recordFailedProfileAttempt,
  validateSourceManifest,
  verificationPrompt
} from "../lib/ai-power-pipeline.js";
import profileSchema from "../schema/ai_power_profile_v2.schema.json" with { type: "json" };
import manifestSchema from "../schema/ai_power_source_manifest_v2.schema.json" with { type: "json" };

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const entityId = argument("--entity");
const manifestPath = argument("--manifest");
const manifestDir = argument("--manifest-dir");
const allMode = process.argv.includes("--all");
const dryRun = process.argv.includes("--dry-run");
if (allMode ? (entityId || manifestPath || !manifestDir) : (!entityId || !manifestPath || manifestDir)) {
  throw new Error("Usage: --entity company-id --manifest source-manifest.json OR --all --manifest-dir manifests [--dry-run]");
}

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validateManifestSchema = ajv.compile(manifestSchema);
const validateRelease = ajv.compile(profileSchema);

async function loadAssessmentSpec(profile, path) {
  const manifest = JSON.parse(await readFile(path, "utf8"));
  if (!validateManifestSchema(manifest)) throw new Error(`${profile.entity.id}: source manifest schema failed: ${JSON.stringify(validateManifestSchema.errors)}`);
  const semantics = validateSourceManifest(profile, manifest);
  if (!semantics.ok) throw new Error(`${profile.entity.id}: source manifest semantics failed: ${semantics.errors.join(" | ")}`);
  return { profile, manifest, path };
}

let specs;
if (allMode) {
  specs = await Promise.all(AI_POWER_V2_RELEASE.profiles.map((profile) =>
    loadAssessmentSpec(profile, join(manifestDir, `${profile.entity.id}.json`))
  ));
} else {
  const profile = AI_POWER_V2_RELEASE.profiles.find((candidate) => candidate.entity.id === entityId);
  if (!profile) throw new Error(`Unknown pilot entity: ${entityId}`);
  specs = [await loadAssessmentSpec(profile, manifestPath)];
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify({
    mode: allMode ? "cohort" : "single_entity",
    entities: specs.map(({ profile, manifest, path }) => ({ entity_id: profile.entity.id, name: profile.entity.name, manifest: path, requested_sources: manifest.sources.length })),
    pilot_candidates: AI_POWER_V2_RELEASE.profiles.length,
    document_limit_per_entity: 8,
    followup_limit_per_entity: 2,
    model_calls_per_attempt: 2,
    writes_repository: false
  }, null, 2)}\n`);
  process.exit(0);
}

const model = process.env.AI_POWER_MODEL;
if (!model) throw new Error("AI_POWER_MODEL is required so every assessment run records an explicit model version.");
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required to run evidence extraction and verification.");
const assessedAt = new Date().toISOString();
let candidateRelease = structuredClone(AI_POWER_V2_RELEASE);
candidateRelease.release_id = `ai-power-v2.0-pilot-candidate-${assessedAt.slice(0, 10)}`;
const runLog = [];

for (const { profile, manifest } of specs) {
  let documents = [];
  try {
    documents = (await collectEvidenceDocuments(profile, manifest)).map((document) => ({ ...document, retrieved_at: new Date().toISOString() }));
    const delivered = documents.filter((document) => document.collection_status === "delivered");
    const distinctOrigins = new Set(delivered.map((document) => document.origin_id));
    if (delivered.length === 0) throw new Error("No declared source could be collected.");
    if (distinctOrigins.size < 2) throw new Error("Fewer than two distinct evidentiary origins were collected.");
    const extracted = await callAnthropicJson(extractionPrompt(profile, documents), apiKey, model);
    const verified = await callAnthropicJson(verificationPrompt(profile, documents, extracted), apiKey, model);
    candidateRelease = assembleVerifiedProfile(candidateRelease, profile.entity.id, documents, verified, assessedAt);
    runLog.push({ entity_id: profile.entity.id, status: candidateRelease.profiles.find((item) => item.entity.id === profile.entity.id).assessment.status, error: null });
  } catch (error) {
    if (/HTTP (401|403)\b/.test(String(error?.message || error))) throw error;
    const delivered = documents.filter((document) => document.collection_status === "delivered").length;
    const collectionStatus = documents.length === 0 || delivered === 0 ? "failed" : delivered === documents.length ? "complete" : "partial";
    const reason = `Automated assessment abstained: ${String(error?.message || error)}`;
    candidateRelease = recordFailedProfileAttempt(candidateRelease, profile.entity.id, manifest.sources.length, assessedAt, reason, collectionStatus);
    runLog.push({ entity_id: profile.entity.id, status: "insufficient_evidence", error: reason });
  }
}

candidateRelease.pipeline.model_extraction_version = model;
candidateRelease.pipeline.model_verification_version = model;
candidateRelease.evidence_cutoff_at = new Date().toISOString();
candidateRelease.assessed_at = candidateRelease.evidence_cutoff_at;
if (!validateRelease(candidateRelease)) throw new Error(`Candidate release schema failed: ${JSON.stringify(validateRelease.errors)}`);
const semantic = validateAiPowerReleaseSemantics(candidateRelease);
if (!semantic.ok) throw new Error(`Candidate release semantic validation failed: ${semantic.errors.join(" | ")}`);
process.stdout.write(`${JSON.stringify({
  status: "candidate_release",
  mode: allMode ? "cohort" : "single_entity",
  writes_repository: false,
  model,
  run_log: runLog,
  release: candidateRelease
}, null, 2)}\n`);
