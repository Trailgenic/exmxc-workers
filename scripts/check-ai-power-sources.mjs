import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { AI_POWER_V2_RELEASE } from "../lib/ai-power-v2.js";
import { collectEvidenceDocuments } from "../lib/ai-power-pipeline.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const manifestDir = argument("--manifest-dir") || "data/ai_power_v2/manifests";
const concurrency = Math.max(1, Math.min(Number(argument("--concurrency")) || 4, 8));
const pending = [...AI_POWER_V2_RELEASE.profiles];
const results = [];

async function check(profile) {
  const manifestPath = join(manifestDir, `${profile.entity.id}.json`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const documents = await collectEvidenceDocuments(profile, manifest);
  const delivered = documents.filter((document) => document.collection_status === "delivered");
  const deliveredOrigins = new Set(delivered.map((document) => document.origin_id));
  return {
    entity_id: profile.entity.id,
    requested: documents.length,
    delivered: delivered.length,
    distinct_origins: deliveredOrigins.size,
    eligible_for_model_attempt: delivered.length >= 2 && deliveredOrigins.size >= 2,
    sources: documents.map((document) => ({
      id: document.id,
      status: document.collection_status,
      final_url: document.final_url,
      content_type: document.content_type,
      bytes_retained: Buffer.byteLength(document.text || "", "utf8"),
      truncated: document.truncated,
      error: document.collection_error
    }))
  };
}

async function worker() {
  while (pending.length) {
    const profile = pending.shift();
    results.push(await check(profile));
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
results.sort((left, right) => left.entity_id.localeCompare(right.entity_id));
const failures = results.filter((result) => !result.eligible_for_model_attempt);
process.stdout.write(`${JSON.stringify({
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
