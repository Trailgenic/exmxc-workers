import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import episodeSchema from '../schema/ai_commerce_episode_v1.schema.json' with { type: 'json' };
import releaseSchema from '../schema/ai_commerce_release_v1.schema.json' with { type: 'json' };
import { AI_COMMERCE_LATEST, buildAiCommerceRelease, getAiCommerceSignal, validateAiCommerceEpisode } from '../lib/ai-commerce.js';
import { parseAiCommerceTrendsCsv } from '../lib/ai-commerce-trends.js';
import { readFileSync } from 'node:fs';

const ajv = new Ajv2020({ strict: false, validateFormats: false });
assert.equal(ajv.compile(releaseSchema)(AI_COMMERCE_LATEST), true);
assert.equal(AI_COMMERCE_LATEST.coverage.verified_episode_count, 0);
assert.equal(AI_COMMERCE_LATEST.benchmarks.length, 4);
assert.ok(AI_COMMERCE_LATEST.benchmarks.every(row => row.denominator && row.source_url && row.interpretation));
assert.equal(AI_COMMERCE_LATEST.search_interest.last_complete_week, '2026-09-13');
assert.deepEqual(AI_COMMERCE_LATEST.search_interest.excluded_incomplete_weeks, ['2026-09-20']);
const csv = readFileSync('data/ai_commerce_v1/search_interest/google-trends-us-ai-shopping-2026-09-25.csv', 'utf8');
assert.deepEqual(parseAiCommerceTrendsCsv(csv, { asOf: '2026-09-25', rawFile: AI_COMMERCE_LATEST.search_interest.raw_file }), AI_COMMERCE_LATEST.search_interest);
assert.equal(AI_COMMERCE_LATEST.search_interest.series[0].points.at(-1).index, 13);
assert.equal(AI_COMMERCE_LATEST.search_interest.series[1].points.at(-1).index, 5);
assert.throws(() => parseAiCommerceTrendsCsv(csv.replace('2026-09-13,13,5', '2026-09-13,113,5'), { asOf: '2026-09-25', rawFile: 'test.csv' }), /0–100/);
assert.equal(getAiCommerceSignal({ release: 'missing' }).found, false);

const episode = {
  episode_id: 'episode-a', observed_at: '2026-09-20T12:00:00Z',
  source_url: 'https://example.com/post/a', source_origin: 'example.com',
  access_basis: 'permitted_public', evidence_type: 'first_person_report',
  evidence_excerpt: 'I asked an AI assistant to compare backpacks. It helped me choose one.',
  ai_tool: 'AI assistant', shopping_task: 'Compare backpacks', category: 'backpacks',
  product: null, merchant: null, stage: 'comparison', delegation: 'ai_assisted',
  outcome: 'considered', purchase_evidence: null, delegated_checkout_evidence: null,
  experience: { target: 'usefulness', sentiment: 'positive' }, classification_confidence: .8
};
assert.equal(ajv.compile(episodeSchema)(episode), true);
assert.deepEqual(validateAiCommerceEpisode(episode), { ok: true, errors: [] });
assert.ok(validateAiCommerceEpisode({ ...episode, outcome: 'purchased' }).errors.some(row => row.includes('purchase outcome')));
assert.ok(validateAiCommerceEpisode({ ...episode, delegation: 'agent_executed' }).errors.some(row => row.includes('Agent execution')));
assert.ok(validateAiCommerceEpisode({ ...episode, experience: { target: null, sentiment: 'positive' } }).errors.some(row => row.includes('experience target')));
assert.ok(validateAiCommerceEpisode({ ...episode, source_origin: 'elsewhere.com' }).errors.some(row => row.includes('hostname')));

const single = buildAiCommerceRelease([episode, { ...episode, episode_id: 'repost' }], { releaseId: 'ai-commerce-2026-09-25-test', asOf: '2026-09-25' });
assert.equal(single.coverage.verified_episode_count, 1);
assert.equal(single.experience_readings.find(row => row.target === 'usefulness').status, 'insufficient_evidence');
assert.equal(single.experience_readings.find(row => row.target === 'usefulness').sentiment_share, null);
const balanced = Array.from({ length: 30 }, (_, index) => ({
  ...episode, episode_id: `episode-${index}`, source_origin: `source${index % 3}.example`,
  source_url: `https://source${index % 3}.example/post/${index}`,
  observed_at: `2026-09-${String(15 + index % 5).padStart(2, '0')}T12:00:00Z`,
  experience: { target: 'usefulness', sentiment: index % 2 ? 'positive' : 'negative' }
}));
const measured = buildAiCommerceRelease(balanced, { releaseId: 'ai-commerce-2026-09-25-test', asOf: '2026-09-25' });
const reading = measured.experience_readings.find(row => row.target === 'usefulness');
assert.equal(reading.status, 'measured');
assert.deepEqual(reading.sentiment_share, { positive: .5, negative: .5, mixed: 0, neutral: 0 });
assert.equal(ajv.compile(releaseSchema)(measured), true);
console.log('AI commerce semantics valid');
