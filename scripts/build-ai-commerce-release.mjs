import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildAiCommerceRelease } from '../lib/ai-commerce.js';
import { summarizeSelectionPilot } from '../lib/ai-commerce-selection.js';
import { parseAiCommerceTrendsCsv } from '../lib/ai-commerce-trends.js';
import episodeSchema from '../schema/ai_commerce_episode_v1.schema.json' with { type: 'json' };
import releaseSchema from '../schema/ai_commerce_release_v1.schema.json' with { type: 'json' };

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, arg, index, all) => arg.startsWith('--') ? [...pairs, [arg.slice(2), all[index + 1]]] : pairs, []));
if ((!args.input && !args['search-csv'] && !args['selection-panel']) || !args['as-of'] || !args['release-id']) throw new Error('Usage: node scripts/build-ai-commerce-release.mjs [--input episodes.json] [--search-csv export.csv] [--selection-panel panel.json] --as-of YYYY-MM-DD --release-id ai-commerce-YYYY-MM-DD-pilot [--promote true]');
const episodes = args.input ? JSON.parse(await readFile(resolve(args.input), 'utf8')) : [];
if (!Array.isArray(episodes)) throw new Error('Input must be an array of AI commerce episodes.');
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validateEpisode = ajv.compile(episodeSchema);
for (const episode of episodes) if (!validateEpisode(episode)) throw new Error(`Episode schema failed: ${JSON.stringify(validateEpisode.errors)}`);
const archivePath = resolve('data/ai_commerce_v1/release-archive.json');
const archive = JSON.parse(await readFile(archivePath, 'utf8'));
const latest = archive.releases.find(row => row.release_id === archive.latest);
const searchInterest = args['search-csv'] ? parseAiCommerceTrendsCsv(await readFile(resolve(args['search-csv']), 'utf8'), { asOf: args['as-of'], rawFile: args['search-csv'] }) : latest?.search_interest;
const selectionPanel = args['selection-panel'] ? summarizeSelectionPilot(JSON.parse(await readFile(resolve(args['selection-panel']), 'utf8'))) : latest?.selection_panel;
const apiMethodCheck = args['selection-panel'] ? JSON.parse(await readFile('data/ai_commerce_v1/selection/2026-09-23-api-method-check.json', 'utf8')) : latest?.api_method_check;
const release = buildAiCommerceRelease(episodes, {
  releaseId: args['release-id'], asOf: args['as-of'],
  benchmarks: latest?.benchmarks || [],
  searchInterest, selectionPanel, apiMethodCheck,
  selectionRunCount: selectionPanel?.summary.completed_two_turn_attempts || 0,
  notes: 'The signed-in app panel is a nonrepresentative method check, with all failures and contradictions retained. API method checks, surveys, and search interest are separate. No observed purchases or representative Agent Selection Share.'
});
const validateRelease = ajv.compile(releaseSchema);
if (!validateRelease(release)) throw new Error(`Release schema failed: ${JSON.stringify(validateRelease.errors)}`);
if (archive.releases.some(row => row.release_id === release.release_id)) throw new Error('Immutable release ID already exists.');
const output = resolve(`data/ai_commerce_v1/releases/${release.release_id.replace(/^ai-commerce-/, '')}.json`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(release, null, 2)}\n`, { flag: 'wx' });
if (args.promote === 'true') {
  archive.releases.push(release);
  archive.latest = release.release_id;
  await writeFile(archivePath, `${JSON.stringify(archive, null, 2)}\n`);
}
console.log(`AI commerce release written: ${output} (${release.coverage.verified_episode_count} episodes)`);
