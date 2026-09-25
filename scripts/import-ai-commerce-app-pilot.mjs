import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// The private archive remains outside Git. This importer emits only reviewed, non-personal labels.
const expectedArchiveSha = '1e898f5d3e678304dc114fb76ad4618abe678668f4e14668b3c9f962f34ee93f';
const panel = {
  'e-family-sofa': { category: 'home_goods', label: 'Family sofa under 90 inches' },
  'e-twins-stroller': { category: 'baby_gear', label: 'Travel stroller for two children' },
  'e-dry-foundation': { category: 'beauty', label: 'Medium-coverage foundation for dry skin' },
  'e-work-laptop': { category: 'everyday_electronics', label: '15-inch-plus work laptop' }
};
const labels = {
  'run-01-chatgpt-e-family-sofa': ['single', 'Room & Board', 'André 89-inch sofa with reversible chaise', 'variant', 'Deep-seat requirement is weakened by the listed regular seat depth; exact offer unresolved.'],
  'run-02-gemini-e-family-sofa': ['technical_failure', null, null, null, 'First turn stopped; second turn not sent.'],
  'run-03-chatgpt-e-twins-stroller': ['single', 'Zoe', 'Twin V3', 'model', 'Precise infant car-seat adapter pairing and total offer unresolved.'],
  'run-04-gemini-e-twins-stroller': ['technical_failure', null, null, null, 'First turn error; second turn not sent.'],
  'run-05-chatgpt-e-dry-foundation': ['single', 'Maybelline', 'Fit Me Dewy + Smooth', 'model', 'No exact neutral-to-cool shade or merchant offer selected.'],
  'run-06-gemini-e-dry-foundation': ['contradictory', null, null, null, 'Named L’Oréal True Match Nude Hyaluronic Tinted Serum, then stated it could not choose. Candidate is not a primary selection; its light coverage weakens the requested medium-coverage fit.'],
  'run-07-chatgpt-e-work-laptop': ['single', 'Lenovo', 'ThinkPad E16 Gen 3 Intel, conditional 400-nit/64Wh configuration', 'conditional_configuration', 'No verified exact SKU, merchant offer, or relevant six-hour battery result.'],
  'run-08-gemini-e-work-laptop': ['single', 'Lenovo', 'ThinkPad E16 Gen 2/3 AMD family', 'model_family', 'No pinned generation or offer. AMD Gen 3 specification does not show the suggested 400-nit panel.'],
  'retry-01-gemini-e-family-sofa': ['technical_failure', null, null, null, 'No visible first answer; second turn not sent.'],
  'retry-02-gemini-e-family-sofa': ['technical_failure', null, null, null, 'First turn error and empty regeneration; second turn not sent.'],
  'retry-03-gemini-e-twins-stroller': ['single', 'Zoe', 'Twin V3', 'model', 'Answer gave 19–21 lb; manufacturer specifies 25 lb. Adapter pairing and offer unresolved.']
};

const sourcePath = process.argv[2], outputPath = resolve(process.argv[3] || 'data/ai_commerce_v1/selection/2026-09-23-signed-in-app-pilot.json');
if (!sourcePath) throw new Error('Usage: node scripts/import-ai-commerce-app-pilot.mjs PRIVATE_ARCHIVE.zip [output.json]');
const archive = await readFile(resolve(sourcePath));
const sha = data => createHash('sha256').update(data).digest('hex');
if (sha(archive) !== expectedArchiveSha) throw new Error('Private source archive digest does not match reviewed pilot.');
const extract = name => execFileSync('unzip', ['-p', resolve(sourcePath), name], { maxBuffer: 1024 * 1024 });
const manifest = JSON.parse(extract('manifest.json').toString('utf8'));
const records = manifest.records.filter(row => row.record_id !== 'later-sofa-run-not-available');
if (records.length !== 11 || records.some(row => !Object.hasOwn(labels, row.record_id))) throw new Error('Source records differ from the adjudicated set.');
const attempts = records.map(row => {
  if (!/^(run|retry)-\d{2}-(chatgpt|gemini)-e-[a-z-]+$/.test(row.record_id)) throw new Error('Unexpected source ID.');
  const [status, brand, product, granularity, evidence_limit] = labels[row.record_id];
  const attempt_number = row.record_id.startsWith('run-') ? 1 : row.record_id === 'retry-03-gemini-e-twins-stroller' ? 2 : row.record_id === 'retry-01-gemini-e-family-sofa' ? 2 : 3;
  const raw = extract(`${row.record_id}.txt`);
  return {
    attempt_id: row.record_id, intent_id: row.intent_id, surface: row.app, displayed_mode: row.displayed_model_or_mode,
    observed_on: row.date, attempt_number, outcome: status, turns_completed: status === 'technical_failure' ? 0 : 2,
    selection: status === 'single' ? { brand, product, granularity } : null,
    evidence_limit, raw_capture_sha256: sha(raw)
  };
});
const output = {
  panel_id: 'aci-signed-in-app-four-intent-2026-09-23',
  status: 'method_validation', geography: 'US', representative: false,
  protocol_version: 'ass-v0.1-two-turn', protocol_sha: manifest.protocol_sha,
  intent_panel_version: 'everyday-forum-v1-2026-09-23', intent_panel_sha: manifest.panel_sha,
  observed_on: '2026-09-23', adjudicated_on: '2026-09-24',
  source_archive_name: 'aci-signed-in-app-raw-records-2026-09-23.zip', source_archive_sha256: expectedArchiveSha,
  source_access: 'private_operator_supplied_captures',
  intents: Object.entries(panel).map(([intent_id, detail]) => ({ intent_id, ...detail })),
  attempts,
  supplemental_observations: [{ intent_id: 'e-family-sofa', surface: 'Gemini', provenance: 'operator_pasted_without_browser_capture', outcome: 'single', product: 'Lovesac Sactional', included_in_counts: false, limitation: 'Conversation URL, date, and original raw capture unavailable; cannot replace the archived failed attempts.' }],
  notes: 'Eight original app-intent cells, three saved retries. A clean final selection is observed model output; exact offer and product fit require independent checks. No purchases occurred in these captures. Raw personal app transcripts and URLs remain private.'
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Imported ${attempts.length} reviewed public labels from private archive.`);
