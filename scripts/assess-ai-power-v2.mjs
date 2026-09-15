import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { AI_POWER_V2_RELEASE, validateAiPowerReleaseSemantics } from "../lib/ai-power-v2.js";
import {
  assembleVerifiedProfile,
  callOpenAIJson,
  collectEvidenceDocuments,
  extractionPrompt,
  recordFailedProfileAttempt,
  validateEvidenceDocumentSnapshot,
  validateSourceManifest,
  verificationPrompt
} from "../lib/ai-power-pipeline.js";
import profileSchema from "../schema/ai_power_profile_v2.schema.json" with { type: "json" };
import manifestSchema from "../schema/ai_power_source_manifest_v2.schema.json" with { type: "json" };

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function entityListArgument() {
  const raw = argument("--entities");
  if (!raw) return null;
  const ids = raw.split(",").map((value) => value.trim()).filter(Boolean);
  if (!ids.length || ids.some((id) => !/^company-[a-z0-9-]+$/.test(id))) {
    throw new Error("--entities must be a comma-separated list of stable company ids.");
  }
  if (new Set(ids).size !== ids.length) throw new Error("--entities cannot contain duplicate company ids.");
  return ids;
}

const entityId = argument("--entity");
const entityIds = entityListArgument();
const manifestPath = argument("--manifest");
const manifestDir = argument("--manifest-dir");
const documentsDir = argument("--documents-dir");
const allMode = process.argv.includes("--all");
const subsetMode = Boolean(entityIds);
const dryRun = process.argv.includes("--dry-run");
const selectedModes = Number(allMode) + Number(subsetMode) + Number(Boolean(entityId || manifestPath));
const singleModeValid = !allMode && !subsetMode && Boolean(entityId) && Boolean(manifestPath) && !manifestDir;
const cohortModeValid = allMode && !subsetMode && !entityId && !manifestPath && Boolean(manifestDir);
const subsetModeValid = subsetMode && !allMode && !entityId && !manifestPath && Boolean(manifestDir);
if (selectedModes !== 1 || (!singleModeValid && !cohortModeValid && !subsetModeValid)) {
  throw new Error("Usage: --entity company-id --manifest source-manifest.json OR --entities company-a,company-b --manifest-dir manifests OR --all --manifest-dir manifests [--documents-dir snapshots] [--dry-run]");
}

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validateManifestSchema = ajv.compile(manifestSchema);
const validateRelease = ajv.compile(profileSchema);

async function loadAssessmentSpec(profile, path) {
  const manifestText = await readFile(path, "utf8");
  const manifest = JSON.parse(manifestText);
  if (!validateManifestSchema(manifest)) throw new Error(`${profile.entity.id}: source manifest schema failed: ${JSON.stringify(validateManifestSchema.errors)}`);
  const semantics = validateSourceManifest(profile, manifest);
  if (!semantics.ok) throw new Error(`${profile.entity.id}: source manifest semantics failed: ${semantics.errors.join(" | ")}`);
  return { profile, manifest, manifestSha256: createHash("sha256").update(manifestText).digest("hex"), path };
}

let specs;
if (allMode) {
  specs = await Promise.all(AI_POWER_V2_RELEASE.profiles.map((profile) =>
    loadAssessmentSpec(profile, join(manifestDir, `${profile.entity.id}.json`))
  ));
} else if (subsetMode) {
  specs = await Promise.all(entityIds.map((id) => {
    const profile = AI_POWER_V2_RELEASE.profiles.find((candidate) => candidate.entity.id === id);
    if (!profile) throw new Error(`Unknown pilot entity: ${id}`);
    return loadAssessmentSpec(profile, join(manifestDir, `${id}.json`));
  }));
} else {
  const profile = AI_POWER_V2_RELEASE.profiles.find((candidate) => candidate.entity.id === entityId);
  if (!profile) throw new Error(`Unknown pilot entity: ${entityId}`);
  specs = [await loadAssessmentSpec(profile, manifestPath)];
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify({
    mode: allMode ? "cohort" : subsetMode ? "cohort_subset" : "single_entity",
    entities: specs.map(({ profile, manifest, path }) => ({ entity_id: profile.entity.id, name: profile.entity.name, manifest: path, requested_sources: manifest.sources.length })),
    pilot_candidates: AI_POWER_V2_RELEASE.profiles.length,
    document_limit_per_entity: 8,
    followup_limit_per_entity: 2,
    model_calls_per_attempt: 2,
    source_snapshot_mode: documentsDir ? "immutable_cache" : "live_collection",
    writes_repository: false
  }, null, 2)}\n`);
  process.exit(0);
}

const model = process.env.AI_POWER_MODEL;
if (!model) throw new Error("AI_POWER_MODEL is required so every assessment run records an explicit model version.");
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) throw new Error("OPENAI_API_KEY is required to run evidence extraction and verification.");
const reasoningEffort = process.env.AI_POWER_REASONING_EFFORT || "medium";
const assessedAt = new Date().toISOString();
let candidateRelease = structuredClone(AI_POWER_V2_RELEASE);
candidateRelease.release_id = `ai-power-v2.0-pilot-candidate-${assessedAt.slice(0, 10)}`;
const runLog = [];

for (const { profile, manifest, manifestSha256 } of specs) {
  let documents = [];
  let verifiedClaimsReturned = 0;
  const modelUsage = { extraction: {}, verification: {} };
  try {
    if (documentsDir) {
      const snapshot = JSON.parse(await readFile(join(documentsDir, `${profile.entity.id}.json`), "utf8"));
      const snapshotValidation = validateEvidenceDocumentSnapshot(profile, manifest, snapshot);
      if (!snapshotValidation.ok) throw new Error(`Source snapshot failed validation: ${snapshotValidation.errors.join(" | ")}`);
      if (snapshot.manifest_sha256 !== manifestSha256) throw new Error("Source snapshot manifest hash does not match the current declared source manifest.");
      documents = structuredClone(snapshot.documents);
    } else {
      documents = (await collectEvidenceDocuments(profile, manifest)).map((document) => ({ ...document, retrieved_at: new Date().toISOString() }));
    }
    const delivered = documents.filter((document) => document.collection_status === "delivered");
    const distinctOrigins = new Set(delivered.map((document) => document.origin_id));
    if (delivered.length === 0) throw new Error("No declared source could be collected.");
    if (distinctOrigins.size < 2) throw new Error("Fewer than two distinct evidentiary origins were collected.");
    const extracted = await callOpenAIJson(extractionPrompt(profile, documents), apiKey, model, fetch, reasoningEffort, modelUsage.extraction);
    const verified = await callOpenAIJson(verificationPrompt(profile, documents, extracted), apiKey, model, fetch, reasoningEffort, modelUsage.verification);
    verifiedClaimsReturned = Array.isArray(verified?.claims) ? verified.claims.length : 0;
    candidateRelease = assembleVerifiedProfile(candidateRelease, profile.entity.id, documents, verified, assessedAt);
    const assessedProfile = candidateRelease.profiles.find((item) => item.entity.id === profile.entity.id);
    runLog.push({
      entity_id: profile.entity.id,
      status: assessedProfile.assessment.status,
      error: null,
      quality: {
        source_documents_requested: manifest.sources.length,
        source_documents_delivered: documents.filter((document) => document.collection_status === "delivered").length,
        verified_claims_returned: verifiedClaimsReturned,
        accepted_evidence_records: assessedProfile.evidence_refs.length,
        graded_criteria: assessedProfile.assessment.criteria.filter((criterion) => criterion.grade !== null).length
      },
      model_usage: modelUsage
    });
  } catch (error) {
    if (/HTTP (401|403)\b/.test(String(error?.message || error))) throw error;
    const delivered = documents.filter((document) => document.collection_status === "delivered").length;
    const collectionStatus = documents.length === 0 || delivered === 0 ? "failed" : delivered === documents.length ? "complete" : "partial";
    const reason = `Automated assessment abstained: ${String(error?.message || error)}`;
    candidateRelease = recordFailedProfileAttempt(candidateRelease, profile.entity.id, manifest.sources.length, assessedAt, reason, collectionStatus);
    runLog.push({
      entity_id: profile.entity.id,
      status: "insufficient_evidence",
      error: reason,
      quality: {
        source_documents_requested: manifest.sources.length,
        source_documents_delivered: delivered,
        verified_claims_returned: verifiedClaimsReturned,
        accepted_evidence_records: 0,
        graded_criteria: 0
      },
      model_usage: modelUsage
    });
  }
}

candidateRelease.pipeline.model_extraction_version = model;
candidateRelease.pipeline.model_verification_version = model;
candidateRelease.pipeline.pipeline_version = "ai-power-pipeline-v2.2.0-deterministic-passages";
candidateRelease.evidence_cutoff_at = new Date().toISOString();
candidateRelease.assessed_at = candidateRelease.evidence_cutoff_at;
const schemaValid = validateRelease(candidateRelease);
const semantic = schemaValid ? validateAiPowerReleaseSemantics(candidateRelease) : { ok: false, errors: [] };
const validationErrors = [
  ...(schemaValid ? [] : (validateRelease.errors || []).map((error) => `${error.instancePath || "/"}: ${error.message}`)),
  ...(semantic.ok ? [] : semantic.errors)
];
process.stdout.write(`${JSON.stringify({
  status: schemaValid && semantic.ok ? "candidate_release" : "invalid_candidate",
  mode: allMode ? "cohort" : subsetMode ? "cohort_subset" : "single_entity",
  writes_repository: false,
  model,
  reasoning_effort: reasoningEffort,
  source_snapshot_mode: documentsDir ? "immutable_cache" : "live_collection",
  run_log: runLog,
  validation_errors: validationErrors,
  release: candidateRelease
}, null, 2)}\n`);
if (validationErrors.length) process.exitCode = 1;
