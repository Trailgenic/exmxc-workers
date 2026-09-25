import { readdir, readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateAiPowerReleaseSemantics } from '../lib/ai-power-v2.js';
import { SPEG_INDEX_RELEASE, validateSpegIndexReleaseSemantics } from '../lib/speg-index-v1.js';
import { validateAiCommerceEpisode } from '../lib/ai-commerce.js';
import { parseAiCommerceTrendsCsv } from '../lib/ai-commerce-trends.js';
import { summarizeSelectionPilot } from '../lib/ai-commerce-selection.js';

async function jsonFiles(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await jsonFiles(path));
    else if (entry.name.endsWith('.json')) files.push(path);
  }
  return files;
}
for (const dir of ['data', 'schema', 'registry']) for (const file of await jsonFiles(dir)) JSON.parse(await readFile(file, 'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const methodology = JSON.parse(await readFile('data/ai_power_v2/methodology.json', 'utf8'));
const release = JSON.parse(await readFile('data/ai_power_v2/releases/2026-09-11-pilot.json', 'utf8'));
const methodologySchema = JSON.parse(await readFile('schema/ai_power_methodology_v2.schema.json', 'utf8'));
const profileSchema = JSON.parse(await readFile('schema/ai_power_profile_v2.schema.json', 'utf8'));
const sourceManifestSchema = JSON.parse(await readFile('schema/ai_power_source_manifest_v2.schema.json', 'utf8'));
const spegIndexSchema = JSON.parse(await readFile('schema/speg_index_profile_v1.schema.json', 'utf8'));
const aiCommerceEpisodeSchema = JSON.parse(await readFile('schema/ai_commerce_episode_v1.schema.json', 'utf8'));
const aiCommerceReleaseSchema = JSON.parse(await readFile('schema/ai_commerce_release_v1.schema.json', 'utf8'));
const aiCommerceArchive = JSON.parse(await readFile('data/ai_commerce_v1/release-archive.json', 'utf8'));
ajv.compile(sourceManifestSchema);
const validateAiCommerceEpisodeSchema = ajv.compile(aiCommerceEpisodeSchema);
const validateMethodology = ajv.compile(methodologySchema);
if (!validateMethodology(methodology)) throw new Error(`AI Power methodology schema failed: ${JSON.stringify(validateMethodology.errors)}`);
const validateRelease = ajv.compile(profileSchema);
if (!validateRelease(release)) throw new Error(`AI Power profile schema failed: ${JSON.stringify(validateRelease.errors)}`);
const semantic = validateAiPowerReleaseSemantics(release);
if (!semantic.ok) throw new Error(`AI Power semantic validation failed: ${semantic.errors.join(' | ')}`);
const validateSpegIndex = ajv.compile(spegIndexSchema);
if (!validateSpegIndex(SPEG_INDEX_RELEASE)) throw new Error(`sPEG Index schema failed: ${JSON.stringify(validateSpegIndex.errors)}`);
const spegIndexSemantic = validateSpegIndexReleaseSemantics(SPEG_INDEX_RELEASE);
if (!spegIndexSemantic.ok) throw new Error(`sPEG Index semantic validation failed: ${spegIndexSemantic.errors.join(' | ')}`);
const validateAiCommerceRelease = ajv.compile(aiCommerceReleaseSchema);
if (!Array.isArray(aiCommerceArchive.releases) || !aiCommerceArchive.releases.length) throw new Error('AI commerce release archive is empty.');
if (!aiCommerceArchive.releases.some(candidate => candidate.release_id === aiCommerceArchive.latest)) throw new Error('AI commerce latest release is missing.');
for (const release of aiCommerceArchive.releases) {
  if (!validateAiCommerceRelease(release)) throw new Error(`AI commerce release ${release.release_id} schema failed: ${JSON.stringify(validateAiCommerceRelease.errors)}`);
  if (release.coverage.verified_episode_count === 0 && release.experience_readings.some(reading => reading.status === 'measured')) throw new Error('Cannot publish measured experience without episodes.');
  for (const metric of release.benchmarks) if (!metric.denominator || !metric.source_url || !metric.interpretation) throw new Error('Benchmark lacks provenance.');
  if (release.search_interest) {
    const csv = await readFile(release.search_interest.raw_file, 'utf8');
    const parsed = parseAiCommerceTrendsCsv(csv, { asOf: release.search_interest.exported_on, rawFile: release.search_interest.raw_file });
    if (JSON.stringify(parsed) !== JSON.stringify(release.search_interest)) throw new Error('Search interest differs from its archived raw export.');
    if (release.search_interest.exported_on > release.as_of) throw new Error('Search export is later than release.');
  }
  if (release.selection_panel) {
    const source = JSON.parse(await readFile('data/ai_commerce_v1/selection/2026-09-23-signed-in-app-pilot.json', 'utf8'));
    const summarized = summarizeSelectionPilot(source);
    if (JSON.stringify(summarized) !== JSON.stringify(release.selection_panel)) throw new Error('Selection panel differs from reviewed public labels.');
    if (release.coverage.selection_run_count !== summarized.summary.completed_two_turn_attempts) throw new Error('Selection run count must mean completed two-turn app attempts.');
    if (!release.api_method_check || release.api_method_check.surface !== 'provider_api') throw new Error('API method check must stay on its own surface.');
    const apiSource = JSON.parse(await readFile('data/ai_commerce_v1/selection/2026-09-23-api-method-check.json', 'utf8'));
    if (JSON.stringify(apiSource) !== JSON.stringify(release.api_method_check)) throw new Error('API method check differs from source summary.');
  }
}
for (const file of await jsonFiles('data/ai_commerce_v1/episodes')) {
  const episodes = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(episodes)) throw new Error(`AI commerce episodes in ${file} must be an array.`);
  for (const episode of episodes) {
    if (!validateAiCommerceEpisodeSchema(episode)) throw new Error(`Episode ${episode.episode_id || 'unknown'} schema failed: ${JSON.stringify(validateAiCommerceEpisodeSchema.errors)}`);
    const result = validateAiCommerceEpisode(episode);
    if (!result.ok) throw new Error(`Episode ${episode.episode_id} semantic validation failed: ${result.errors.join(' ')}`);
  }
}

const forbiddenV2Keys = new Set(['ai_power_index', 'rank', 'percentile', 'weighted_contribution']);
function assertNoCompositeFields(value, path = 'release') {
  if (Array.isArray(value)) return value.forEach((child, index) => assertNoCompositeFields(child, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenV2Keys.has(key)) throw new Error(`Forbidden v2 composite field at ${path}.${key}`);
    assertNoCompositeFields(child, `${path}.${key}`);
  }
}
assertNoCompositeFields(release);
console.log('json, AI Power v2, sPEG Index v1, and AI Commerce v1 contracts valid');
