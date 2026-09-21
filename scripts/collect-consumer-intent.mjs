import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { collectConsumerIntent, CONSUMER_COLLECTION_PLAN } from "../lib/consumer-intent-collector.js";
import { deduplicateConsumerObservations } from "../lib/consumer-intent.js";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function priorRuns(directory, currentFile) {
  let files = [];
  try { files = await readdir(directory); } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const observations = [];
  for (const file of files.filter((value) => value.endsWith(".json") && value !== basename(currentFile)).sort()) {
    const run = JSON.parse(await readFile(join(directory, file), "utf8"));
    if (!Array.isArray(run.accepted)) throw new Error(`${file} does not contain an accepted observation array.`);
    observations.push(...run.accepted);
  }
  return observations;
}

const collectionDate = argument("--date") || new Date().toISOString().slice(0, 10);
const model = process.env.CONSUMER_INTENT_MODEL || "gpt-5.6-luna";
const reasoningEffort = process.env.CONSUMER_INTENT_REASONING_EFFORT || "medium";
const observationsDir = resolve(argument("--observations-dir") || "data/consumer_intent_v1/observations");
const output = resolve(argument("--output") || join(observationsDir, `${collectionDate}.json`));
const mergedOutput = resolve(argument("--merged-output") || "artifacts/consumer-intent-observations.json");
const summaryOutput = resolve(argument("--summary-output") || "artifacts/consumer-intent-collection-summary.json");
const dryRun = process.argv.includes("--dry-run");
const skipExisting = process.argv.includes("--skip-existing");

async function writeArtifacts(merged, summary) {
  await mkdir(resolve(mergedOutput, ".."), { recursive: true });
  await mkdir(resolve(summaryOutput, ".."), { recursive: true });
  await writeFile(mergedOutput, `${JSON.stringify(merged, null, 2)}\n`);
  await writeFile(summaryOutput, `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (dryRun) {
  process.stdout.write(`${JSON.stringify({
    status: "dry_run",
    writes_repository: false,
    collection_date: collectionDate,
    model,
    reasoning_effort: reasoningEffort,
    plan: CONSUMER_COLLECTION_PLAN
  }, null, 2)}\n`);
  process.exit(0);
}

await mkdir(observationsDir, { recursive: true });
try {
  const existing = JSON.parse(await readFile(output, "utf8"));
  if (skipExisting) {
    const merged = deduplicateConsumerObservations(await priorRuns(observationsDir, "__include_all_runs__"));
    await writeArtifacts(merged, {
      status: "collection_already_exists",
      collection_date: collectionDate,
      run_id: existing.run_id,
      model: existing.model_version || model,
      previous_observations: merged.length,
      discovered_accepted: 0,
      new_accepted: 0,
      cumulative_unique_observations: merged.length,
      rejected: 0
    });
    process.exit(0);
  }
  throw new Error(`Observation run ${output} already exists; dated collection runs are immutable.`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required for Consumer Intent collection.");

const previous = await priorRuns(observationsDir, output);
const priorIds = new Set(previous.map((row) => row.observation_id));
const priorClusters = new Set(previous.map((row) => row.duplicate_cluster_id).filter(Boolean));
const priorUrls = new Set(previous.map((row) => row.source_url).filter(Boolean));
const run = await collectConsumerIntent({
  collectionDate,
  model,
  reasoningEffort,
  apiKey: process.env.OPENAI_API_KEY
});
const discoveredAccepted = run.accepted.length;
run.accepted = run.accepted.filter((row) => !priorIds.has(row.observation_id) && !priorClusters.has(row.duplicate_cluster_id) && !priorUrls.has(row.source_url));
const historicalDuplicates = discoveredAccepted - run.accepted.length;
if (historicalDuplicates) {
  run.rejected_summary.count += historicalDuplicates;
  run.rejected_summary.reasons.historical_duplicate = historicalDuplicates;
}
run.new_accepted_count = run.accepted.length;

const merged = deduplicateConsumerObservations([...previous, ...run.accepted]);
await writeFile(output, `${JSON.stringify(run, null, 2)}\n`);
const summary = {
  status: "collection_complete",
  collection_date: collectionDate,
  run_id: run.run_id,
  model,
  previous_observations: previous.length,
  discovered_accepted: discoveredAccepted,
  new_accepted: run.accepted.length,
  cumulative_unique_observations: merged.length,
  rejected: run.rejected_summary.count
};
await writeArtifacts(merged, summary);
