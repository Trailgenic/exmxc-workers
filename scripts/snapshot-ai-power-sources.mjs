import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AI_POWER_V2_RELEASE } from "../lib/ai-power-v2.js";
import { buildDeterministicPassages, collectEvidenceDocuments, validateEvidenceDocumentSnapshot, validateSourceManifest } from "../lib/ai-power-pipeline.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function selectedProfiles() {
  const raw = argument("--entities");
  if (!raw) return AI_POWER_V2_RELEASE.profiles;
  const ids = raw.split(",").map((value) => value.trim()).filter(Boolean);
  if (!ids.length || ids.some((id) => !/^company-[a-z0-9-]+$/.test(id))) {
    throw new Error("--entities must be a comma-separated list of stable company ids.");
  }
  if (new Set(ids).size !== ids.length) throw new Error("--entities cannot contain duplicate company ids.");
  return ids.map((id) => {
    const profile = AI_POWER_V2_RELEASE.profiles.find((candidate) => candidate.entity.id === id);
    if (!profile) throw new Error(`Unknown pilot entity: ${id}`);
    return profile;
  });
}

const manifestDir = argument("--manifest-dir") || "data/ai_power_v2/manifests";
const outputDir = argument("--output-dir");
const concurrency = Math.max(1, Math.min(Number(argument("--concurrency")) || 4, 8));
if (!outputDir) throw new Error("Usage: --manifest-dir manifests --output-dir snapshot-directory [--entities company-a,company-b] [--concurrency 4]");

await mkdir(outputDir, { recursive: true });
const pending = [...selectedProfiles()];
const results = [];

async function capture(profile) {
  const manifestPath = join(manifestDir, `${profile.entity.id}.json`);
  const manifestText = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  const manifestValidation = validateSourceManifest(profile, manifest);
  if (!manifestValidation.ok) throw new Error(`${profile.entity.id}: ${manifestValidation.errors.join(" | ")}`);
  const capturedAt = new Date().toISOString();
  const documents = (await collectEvidenceDocuments(profile, manifest)).map((document) => {
    const captured = { ...document, retrieved_at: capturedAt };
    return {
      ...captured,
      passages: captured.collection_status === "delivered" ? buildDeterministicPassages([captured]) : []
    };
  });
  const snapshot = {
    snapshot_version: "ai-power-source-snapshot-v2",
    entity_id: profile.entity.id,
    captured_at: capturedAt,
    manifest_sha256: createHash("sha256").update(manifestText).digest("hex"),
    documents
  };
  const snapshotValidation = validateEvidenceDocumentSnapshot(profile, manifest, snapshot);
  if (!snapshotValidation.ok) throw new Error(`${profile.entity.id}: ${snapshotValidation.errors.join(" | ")}`);
  await writeFile(join(outputDir, `${profile.entity.id}.json`), `${JSON.stringify(snapshot, null, 2)}\n`);
  const delivered = documents.filter((document) => document.collection_status === "delivered");
  const deliveredOrigins = new Set(delivered.map((document) => document.origin_id));
  return {
    entity_id: profile.entity.id,
    requested: documents.length,
    delivered: delivered.length,
    distinct_origins: deliveredOrigins.size,
    eligible_for_model_attempt: delivered.length >= 2 && deliveredOrigins.size >= 2,
    snapshot_file: `${profile.entity.id}.json`,
    sources: documents.map((document) => ({
      id: document.id,
      status: document.collection_status,
      final_url: document.final_url,
      content_type: document.content_type,
      source_snapshot_sha256: document.sha256,
      bytes_retained: Buffer.byteLength(document.text || "", "utf8"),
      passage_count: document.passages.length,
      truncated: document.truncated,
      error: document.collection_error
    }))
  };
}

async function worker() {
  while (pending.length) {
    const profile = pending.shift();
    results.push(await capture(profile));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
results.sort((left, right) => left.entity_id.localeCompare(right.entity_id));
const failures = results.filter((result) => !result.eligible_for_model_attempt);
process.stdout.write(`${JSON.stringify({
  snapshot_version: "ai-power-source-snapshot-v2",
  checked_at: new Date().toISOString(),
  manifests: results.length,
  requested_sources: results.reduce((sum, result) => sum + result.requested, 0),
  delivered_sources: results.reduce((sum, result) => sum + result.delivered, 0),
  eligible_entities: results.length - failures.length,
  failed_entities: failures.map((result) => result.entity_id),
  writes_repository: false,
  uses_model_api: false,
  results
}, null, 2)}\n`);
if (failures.length) process.exitCode = 1;
