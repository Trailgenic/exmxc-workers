import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildConsumerIntentRelease } from '../lib/consumer-intent-release.js';

const args = Object.fromEntries(process.argv.slice(2).map((value, index, values) => value.startsWith('--') ? [value.slice(2), values[index + 1]] : null).filter(Boolean));
if (!args.input || !args['as-of'] || !args['release-id']) {
  throw new Error('Usage: node scripts/build-consumer-intent-release.mjs --input observations.json --as-of YYYY-MM-DD --release-id ID');
}

const input = JSON.parse(await readFile(resolve(args.input), 'utf8'));
const release = buildConsumerIntentRelease(input, {
  asOf: args['as-of'],
  releaseId: args['release-id'],
  status: args.status,
  modelVersion: args['model-version'],
  note: args.note
});
const output = resolve(args.output || `data/consumer_intent_v1/releases/${args['release-id'].replace(/^consumer-intent-/, '')}.json`);
await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, `${JSON.stringify(release, null, 2)}\n`);
if (args.promote === 'true') {
  const archivePath = resolve(args.archive || 'data/consumer_intent_v1/release-archive.json');
  const archive = JSON.parse(await readFile(archivePath, 'utf8'));
  if (archive.releases.some((candidate) => candidate.release_id === release.release_id)) {
    throw new Error(`Release ${release.release_id} already exists; immutable releases cannot be overwritten.`);
  }
  archive.latest = release.release_id;
  archive.releases.push(release);
  await writeFile(archivePath, `${JSON.stringify(archive, null, 2)}\n`);
}
console.log(`consumer intent release written: ${output} (${release.coverage.unique_observation_count} unique observations)`);
