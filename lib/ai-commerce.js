import methodology from '../data/ai_commerce_v1/methodology.json' with { type: 'json' };
import archive from '../data/ai_commerce_v1/release-archive.json' with { type: 'json' };

export const AI_COMMERCE_METHODOLOGY = methodology;
const releaseMap = new Map(archive.releases.map(release => [release.release_id, release]));
export const AI_COMMERCE_LATEST = releaseMap.get(archive.latest);
if (!AI_COMMERCE_LATEST) throw new Error('AI commerce latest release is missing.');
export const AI_COMMERCE_RELEASES = {
  series_id: archive.series_id,
  latest: archive.latest,
  releases: archive.releases.map(release => {
    return { release_id: release.release_id, as_of: release.as_of, status: release.status, methodology_id: release.methodology_id };
  })
};

export function getAiCommerceSignal({ release } = {}) {
  const result = release ? releaseMap.get(release) : AI_COMMERCE_LATEST;
  return result || { found: false, error: 'Unknown AI commerce release.' };
}

export function validateAiCommerceEpisode(row) {
  const errors = [];
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { ok: false, errors: ['Episode must be an object.'] };
  const required = ['episode_id', 'observed_at', 'source_url', 'source_origin', 'access_basis', 'evidence_type', 'evidence_excerpt', 'ai_tool', 'shopping_task', 'category', 'stage', 'delegation', 'outcome', 'classification_confidence'];
  for (const field of required) if (row[field] === undefined || row[field] === null || row[field] === '') errors.push(`${field} is required.`);
  let origin;
  try {
    const url = new URL(row.source_url);
    if (url.protocol !== 'https:') errors.push('Source URL must use HTTPS.');
    origin = url.hostname.toLowerCase();
  } catch { errors.push('Source URL is invalid.'); }
  if (origin && row.source_origin?.toLowerCase() !== origin) errors.push('Source origin must match source URL hostname.');
  if (!Number.isFinite(Date.parse(row.observed_at))) errors.push('Observed date is invalid.');
  if (!['permitted_public', 'licensed', 'consented'].includes(row.access_basis)) errors.push('Access basis is invalid.');
  if (!['first_person_report', 'instrumented_event'].includes(row.evidence_type)) errors.push('Evidence type is invalid.');
  if (!methodology.stages.includes(row.stage)) errors.push('Stage is invalid.');
  if (!methodology.delegation_levels.includes(row.delegation)) errors.push('Delegation is invalid.');
  if (!methodology.outcomes.includes(row.outcome)) errors.push('Outcome is invalid.');
  if (!['positive', 'negative', 'mixed', 'neutral', 'unknown'].includes(row.experience?.sentiment)) errors.push('Experience sentiment is invalid.');
  if (row.experience?.target !== null && !methodology.experience_targets.includes(row.experience?.target)) errors.push('Experience target is invalid.');
  if (row.experience?.sentiment !== 'unknown' && !row.experience?.target) errors.push('A sentiment reading requires an AI experience target.');
  if (row.outcome === 'purchased' || row.outcome === 'returned') {
    if (!row.purchase_evidence || !row.evidence_excerpt?.includes(row.purchase_evidence)) errors.push('A purchase outcome requires an exact supporting excerpt.');
  }
  if (row.delegation === 'agent_executed') {
    if (!row.delegated_checkout_evidence || !row.evidence_excerpt?.includes(row.delegated_checkout_evidence)) errors.push('Agent execution requires an exact delegated-action excerpt.');
    if (!['checkout', 'post_purchase'].includes(row.stage)) errors.push('Agent execution must concern checkout or post-purchase action.');
  }
  if (typeof row.classification_confidence !== 'number' || row.classification_confidence < 0 || row.classification_confidence > 1) errors.push('Classification confidence must be 0–1.');
  return { ok: errors.length === 0, errors };
}

export function buildAiCommerceRelease(episodes, { releaseId, asOf, benchmarks = [], selectionRunCount = 0, notes = '' }) {
  if (!/^ai-commerce-\d{4}-\d{2}-\d{2}-[a-z0-9-]+$/.test(releaseId) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('A dated AI commerce release ID and asOf date are required.');
  const seen = new Set();
  const unique = [];
  for (const row of episodes) {
    const validation = validateAiCommerceEpisode(row);
    if (!validation.ok) throw new Error(`${row?.episode_id || 'Episode'}: ${validation.errors.join(' ')}`);
    if (row.observed_at.slice(0, 10) > asOf) throw new Error('Episode is later than release date.');
    const key = `${row.source_url}|${row.shopping_task.toLowerCase()}|${row.category.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); unique.push(row); }
  }
  const count = field => Object.fromEntries([...new Set(unique.map(row => row[field]))].sort().map(value => [value, unique.filter(row => row[field] === value).length]));
  const gates = methodology.publication_policy;
  const experienceReadings = methodology.experience_targets.map(target => {
    const rows = unique.filter(row => row.experience.target === target && row.experience.sentiment !== 'unknown');
    const origins = new Set(rows.map(row => row.source_origin));
    const days = new Set(rows.map(row => row.observed_at.slice(0, 10)));
    const largest = rows.length ? Math.max(...[...origins].map(origin => rows.filter(row => row.source_origin === origin).length)) / rows.length : 1;
    const measured = rows.length >= gates.minimum_unique_episodes_for_experience_reading && origins.size >= gates.minimum_independent_origins && days.size >= gates.minimum_collection_days && largest <= gates.maximum_single_origin_share;
    const sentimentShare = measured ? Object.fromEntries(['positive', 'negative', 'mixed', 'neutral'].map(sentiment => [sentiment, Number((rows.filter(row => row.experience.sentiment === sentiment).length / rows.length).toFixed(4))])) : null;
    return { target, status: measured ? 'measured' : 'insufficient_evidence', episode_count: rows.length, sentiment_share: sentimentShare };
  });
  return {
    release_id: releaseId, series_id: 'ai-commerce-signal-v1', as_of: asOf,
    methodology_id: methodology.methodology_id, status: 'pilot',
    coverage: { verified_episode_count: unique.length, selection_run_count: selectionRunCount, transaction_event_count: unique.filter(row => row.evidence_type === 'instrumented_event' && row.outcome === 'purchased').length },
    experience_readings: experienceReadings,
    episode_count_by_stage: count('stage'), episode_count_by_category: count('category'),
    benchmarks, notes
  };
}
