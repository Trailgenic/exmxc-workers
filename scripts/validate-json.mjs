import { readdir, readFile } from 'node:fs/promises';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateAiPowerReleaseSemantics } from '../lib/ai-power-v2.js';
for (const dir of ['data','schema','registry']) for (const f of await readdir(dir)) if (f.endsWith('.json')) JSON.parse(await readFile(`${dir}/${f}`,'utf8'));

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const methodology = JSON.parse(await readFile('data/ai_power_v2/methodology.json', 'utf8'));
const release = JSON.parse(await readFile('data/ai_power_v2/releases/2026-09-11-pilot.json', 'utf8'));
const methodologySchema = JSON.parse(await readFile('schema/ai_power_methodology_v2.schema.json', 'utf8'));
const profileSchema = JSON.parse(await readFile('schema/ai_power_profile_v2.schema.json', 'utf8'));
const sourceManifestSchema = JSON.parse(await readFile('schema/ai_power_source_manifest_v2.schema.json', 'utf8'));
ajv.compile(sourceManifestSchema);
const validateMethodology = ajv.compile(methodologySchema);
if (!validateMethodology(methodology)) throw new Error(`AI Power methodology schema failed: ${JSON.stringify(validateMethodology.errors)}`);
const validateRelease = ajv.compile(profileSchema);
if (!validateRelease(release)) throw new Error(`AI Power profile schema failed: ${JSON.stringify(validateRelease.errors)}`);
const semantic = validateAiPowerReleaseSemantics(release);
if (!semantic.ok) throw new Error(`AI Power semantic validation failed: ${semantic.errors.join(' | ')}`);

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
console.log('json and AI Power v2 contracts valid');
