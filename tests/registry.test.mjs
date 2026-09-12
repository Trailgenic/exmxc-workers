import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import { DATASETS, DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
import strategicConsequenceSchema from '../schema/strategic_consequence.schema.json' with { type: 'json' };
import {
  calculateRealityGapScores,
  getStrategicConsequence,
  realityGapClassification,
  strategicConsequenceClassification
} from '../lib/queries.js';
import { AI_POWER_V2_RELEASE, deriveAiPowerSummaryState, validateAiPowerReleaseSemantics } from '../lib/ai-power-v2.js';
import { assembleVerifiedProfile, callOpenAIJson, recordFailedProfileAttempt, validateSourceManifest } from '../lib/ai-power-pipeline.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.get'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.v2.get'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.ai_power.profiles.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/ai_power_profiles_v2'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/ai_power_methodology_v2'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/ai_power_profile_v2'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/ai_power_source_manifest_v2'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/power_lens'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.reality_gap.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/reality_gap_index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/reality_gap_index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.strategic_consequence.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/strategic_consequence_scenarios'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/strategic_consequence'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_registry'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_series'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_snapshot'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_changes'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/entity_clarity_latest_release'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/entity_registry'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/eci_observation'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/eci_release'));
assert.equal(DATASETS.entity_registry.data.entity_count, 745);
assert.equal(DATASETS.entity_clarity_latest_snapshot.data.observation_count, 744);
assert.equal(DATASETS.entity_clarity_latest_changes.data.matched_panel_count, 744);
assert.equal(DATASETS.entity_clarity_latest_release.data.source_qa.duplicate_rows_removed, 3);
assert.equal(DATASETS.entity_clarity_latest_release.data.current_observation_count, 744);
assert.equal(DATASETS.entity_clarity_latest_release.data.registry_entity_count, 745);
assert.equal(DATASETS.speg.data.metadata.as_of_date, '2026-07-16');
assert.equal(DATASETS.speg.data.metadata.snapshot_type, 'forward_fiscal_eps_proxy');
assert.equal(DATASETS.speg.data.rows.length, 25);
assert.equal(AI_POWER_V2_RELEASE.profiles.length, 20);
assert.deepEqual(validateAiPowerReleaseSemantics(AI_POWER_V2_RELEASE), { ok: true, errors: [] });
assert.equal(deriveAiPowerSummaryState(AI_POWER_V2_RELEASE.profiles[0]), 'insufficient_evidence');
const syntheticCriteria = [
  ['control', 2],
  ['substitution_constraint', 2],
  ['realized_leverage', 2],
  ['durability', 2]
].map(([id, grade]) => ({ id, grade, anchor_label: 'Fixture anchor', confidence: 'moderate', rationale: 'Fixture rationale.', evidence_refs: ['evidence-fixture-a', 'evidence-fixture-b'], inference: null, counterevidence: [], unknown_reason: null }));
const syntheticProfile = {
  ...AI_POWER_V2_RELEASE.profiles[0],
  mechanism: { ...AI_POWER_V2_RELEASE.profiles[0].mechanism, stage: 'operational' },
  assessment: { status: 'complete', summary_state: 'durable_demonstrated_leverage', prospective: false, criteria: syntheticCriteria, strongest_dependency: 'Fixture dependency.', invalidation_condition: 'Fixture invalidation.', overall_confidence: 'moderate' }
};
assert.equal(deriveAiPowerSummaryState(syntheticProfile), 'durable_demonstrated_leverage');
assert.equal(deriveAiPowerSummaryState({ ...syntheticProfile, mechanism: { ...syntheticProfile.mechanism, stage: 'announced' } }), 'structural_potential');
assert.equal(deriveAiPowerSummaryState({ ...syntheticProfile, assessment: { ...syntheticProfile.assessment, criteria: syntheticCriteria.map((criterion) => criterion.id === 'control' ? { ...criterion, grade: 1 } : criterion) } }), 'power_not_established');
const invalidLimitedGrade = structuredClone(AI_POWER_V2_RELEASE);
invalidLimitedGrade.profiles[0].assessment = {
  status: 'partial',
  summary_state: 'insufficient_evidence',
  prospective: true,
  criteria: syntheticCriteria.map((criterion) => ({ ...criterion, grade: criterion.id === 'control' ? 2 : null, confidence: 'limited', anchor_label: criterion.id === 'control' ? 'Fixture anchor' : null, evidence_refs: [], unknown_reason: criterion.id === 'control' ? null : 'Fixture unknown.' })),
  strongest_dependency: null,
  invalidation_condition: null,
  overall_confidence: 'limited'
};
assert.ok(validateAiPowerReleaseSemantics(invalidLimitedGrade).errors.some((error) => error.includes('limited confidence requires an unknown grade')));
const pipelineProfile = AI_POWER_V2_RELEASE.profiles[0];
const sourceManifest = {
  entity_id: pipelineProfile.entity.id,
  sources: [
    { id: 'source-a', url: 'https://example.com/a', publisher: 'Example issuer', source_type: 'company_statement', document_title: 'Issuer disclosure', published_at: '2026-09-01T00:00:00Z', origin_id: 'issuer-a' },
    { id: 'source-b', url: 'https://example.org/b', publisher: 'Example researcher', source_type: 'independent_research', document_title: 'Independent corroboration', published_at: '2026-09-02T00:00:00Z', origin_id: 'research-b' }
  ]
};
assert.deepEqual(validateSourceManifest(pipelineProfile, sourceManifest), { ok: true, errors: [] });
let openAiRequest;
const openAiTelemetry = {};
const parsedOpenAi = await callOpenAIJson('Return a fixture object.', 'test-key', 'gpt-5.6-luna', async (url, options) => {
  openAiRequest = { url, options, body: JSON.parse(options.body) };
  return new Response(JSON.stringify({
    id: 'resp_fixture',
    usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
    output: [{ type: 'message', content: [{ type: 'output_text', text: '```json\n{"fixture":true}\n```' }] }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}, 'medium', openAiTelemetry);
assert.deepEqual(parsedOpenAi, { fixture: true });
assert.equal(openAiRequest.url, 'https://api.openai.com/v1/responses');
assert.equal(openAiRequest.options.headers.authorization, 'Bearer test-key');
assert.equal(openAiRequest.body.model, 'gpt-5.6-luna');
assert.equal(openAiRequest.body.reasoning.effort, 'medium');
assert.equal(openAiRequest.body.store, false);
assert.deepEqual(openAiTelemetry, {
  response_id: 'resp_fixture',
  usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 }
});
const pipelineDocuments = sourceManifest.sources.map((source, index) => ({
  ...source,
  final_url: source.url,
  content_type: 'text/html',
  sha256: String(index + 1).repeat(64),
  text: index === 0 ? 'Issuer evidence supports the scoped control mechanism.' : 'Independent evidence corroborates the substitution constraint.',
  truncated: false,
  collection_status: 'delivered',
  collection_error: null,
  retrieved_at: '2026-09-11T12:00:00Z'
}));
const pipelineVerified = {
  mechanism: { relationship: 'controls', stage: 'operational', scope: 'Fixture market and period.' },
  claims: [
    { id: 'claim-a', source_id: 'source-a', assertion: 'Fixture issuer claim.', locator: 'fixture-a', extract: 'Issuer evidence supports the scoped control mechanism.', valid_from: '2026-09-01T00:00:00Z', valid_through: null, last_substantive_verification_at: '2026-09-11T12:00:00Z', claim_type: 'fact', criterion_ids: ['control', 'realized_leverage'], supports_anchor: true, counterevidence: [], freshness: 'current', verification: { status: 'verified', entity_match: true, scope_match: true, date_checked: true, contradiction_status: 'none_found' } },
    { id: 'claim-b', source_id: 'source-b', assertion: 'Fixture corroborating claim.', locator: 'fixture-b', extract: 'Independent evidence corroborates the substitution constraint.', valid_from: '2026-09-02T00:00:00Z', valid_through: null, last_substantive_verification_at: '2026-09-11T12:00:00Z', claim_type: 'fact', criterion_ids: ['substitution_constraint', 'durability'], supports_anchor: true, counterevidence: [], freshness: 'current', verification: { status: 'verified', entity_match: true, scope_match: true, date_checked: true, contradiction_status: 'none_found' } }
  ],
  proposed_criteria: syntheticCriteria.map((criterion) => ({
    ...criterion,
    claim_ids: ['control', 'realized_leverage'].includes(criterion.id) ? ['claim-a'] : ['claim-b']
  })),
  strongest_dependency: 'Fixture dependency.',
  invalidation_condition: 'A viable substitute becomes available.'
};
const assembledPipelineRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, pipelineVerified, '2026-09-11T12:00:00Z');
assert.equal(assembledPipelineRelease.profiles[0].assessment.summary_state, 'durable_demonstrated_leverage');
assert.equal(assembledPipelineRelease.coverage.attempted, 1);
assert.equal(assembledPipelineRelease.coverage.complete, 1);
assert.equal(assembledPipelineRelease.coverage.not_started, 19);
assert.deepEqual(validateAiPowerReleaseSemantics(assembledPipelineRelease), { ok: true, errors: [] });
const malformedShapeFixture = structuredClone(pipelineVerified);
malformedShapeFixture.claims.push({
  ...malformedShapeFixture.claims[0],
  id: 'claim-malformed',
  claim_type: 'direct_fact',
  criterion_ids: [],
  counterevidence: 'Malformed model string.'
});
malformedShapeFixture.claims[1].counterevidence = 'A normalized counterpoint.';
malformedShapeFixture.proposed_criteria[0].counterevidence = 'A normalized criterion counterpoint.';
const shapeHardenedRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, malformedShapeFixture, '2026-09-11T12:00:00Z');
assert.equal(shapeHardenedRelease.evidence.length, 2);
assert.deepEqual(shapeHardenedRelease.evidence[1].counterevidence, ['A normalized counterpoint.']);
assert.deepEqual(shapeHardenedRelease.profiles[0].assessment.criteria[0].counterevidence, ['A normalized criterion counterpoint.']);
assert.deepEqual(validateAiPowerReleaseSemantics(shapeHardenedRelease), { ok: true, errors: [] });
const failedPipelineRelease = recordFailedProfileAttempt(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, 2, '2026-09-11T12:00:00Z', 'Automated fixture abstention.', 'partial');
assert.equal(failedPipelineRelease.profiles[0].collection.attempted, true);
assert.equal(failedPipelineRelease.profiles[0].collection.status, 'partial');
assert.equal(failedPipelineRelease.profiles[0].assessment.status, 'insufficient_evidence');
assert.equal(failedPipelineRelease.coverage.attempted, 1);
assert.equal(failedPipelineRelease.coverage.unassessed, 19);
assert.deepEqual(validateAiPowerReleaseSemantics(failedPipelineRelease), { ok: true, errors: [] });
for (const row of DATASETS.speg.data.rows) {
  const y1 = row.forward_eps_year_1.midpoint * (row.normalization_factor_native_per_usd ?? 1);
  const expectedPe = row.price / y1;
  const expectedSpeg = expectedPe / (row.forward_eps_growth_pct * row.scarcity_multiplier);
  assert.ok(Math.abs(expectedPe - row.forward_pe) < 0.02, `${row.ticker} forward P/E drift`);
  assert.ok(Math.abs(expectedSpeg - row.speg) < 0.02, `${row.ticker} sPEG drift`);
}
assert.equal(DATASETS.reality_gap_index.data.metadata.as_of_date, '2026-07-21');
assert.equal(DATASETS.reality_gap_index.data.rows.length, 10);
assert.equal(DATASETS.reality_gap_index.data.metadata.scoring_anchors.narrative_components.length, 5);
assert.equal(DATASETS.reality_gap_index.data.metadata.scoring_anchors.capability_components.length, 5);
assert.deepEqual(Object.keys(DATASETS.reality_gap_index.data.metadata.confidence_policy).sort(), ['high', 'low', 'medium']);
assert.equal(Object.values(DATASETS.reality_gap_index.data.metadata.narrative_weights).reduce((sum, value) => sum + value, 0), 1);
assert.equal(Object.values(DATASETS.reality_gap_index.data.metadata.capability_weights).reduce((sum, value) => sum + value, 0), 1);
for (const anchors of Object.values(DATASETS.reality_gap_index.data.metadata.scoring_anchors)) {
  assert.deepEqual(anchors.map(({ score }) => score), [0, 2.5, 5, 7.5, 10]);
}
for (let gap = -1000; gap <= 1000; gap += 1) {
  assert.ok(realityGapClassification(gap / 10), `Reality Gap ${(gap / 10).toFixed(1)} must map to a classification`);
}
for (const row of DATASETS.reality_gap_index.data.rows) {
  const calculated = calculateRealityGapScores(row);
  assert.deepEqual(calculated, {
    ai_narrative_score: row.ai_narrative_score,
    ai_capability_score: row.ai_capability_score,
    reality_gap: row.reality_gap
  }, `${row.ticker} Reality Gap formula drift`);
  const band = realityGapClassification(row.reality_gap);
  assert.equal(band?.id, row.classification, `${row.ticker} Reality Gap classification drift`);
  assert.equal(band?.label, row.classification_label, `${row.ticker} Reality Gap label drift`);
  assert.ok(row.evidence.length > 0, `${row.ticker} must expose dated evidence`);
}

const consequenceData = DATASETS.strategic_consequence_scenarios.data;
assert.equal(consequenceData.metadata.as_of_date, '2026-07-29');
assert.equal(consequenceData.scenarios.length, 6);
assert.equal(new Set(consequenceData.scenarios.map(({ id }) => id)).size, consequenceData.scenarios.length);
assert.equal(Object.values(consequenceData.metadata.force_weights).reduce((sum, value) => sum + value, 0), 1);
const validateConsequence = new Ajv2020({ allErrors: true, strict: false, validateFormats: false })
  .compile(strategicConsequenceSchema);
for (const scenario of consequenceData.scenarios) {
  assert.deepEqual(Object.keys(scenario.force_deltas).sort(), ['alignment', 'compute', 'energy', 'interface']);
  assert.ok(scenario.first_order_logic.length >= 3, `${scenario.id} must expose first-order logic`);
  assert.ok(scenario.second_order_consequences.length >= 3, `${scenario.id} must expose second-order consequences`);
  assert.ok(scenario.bottlenecks.length >= 3, `${scenario.id} must expose bottlenecks`);
  assert.ok(scenario.assumptions.length >= 3, `${scenario.id} must expose assumptions`);
  assert.ok(scenario.confirming_signals.length >= 3, `${scenario.id} must expose confirming signals`);
  assert.ok(scenario.invalidating_signals.length >= 3, `${scenario.id} must expose invalidating signals`);

  const one = getStrategicConsequence({ scenario: scenario.id, query: 'NVDA', limit: 5 });
  const two = getStrategicConsequence({ scenario: scenario.id, query: 'NVDA', limit: 5 });
  assert.deepEqual(one, two, `${scenario.id} output must be deterministic`);
  assert.equal(one.universe_size, DATASETS.ai_power_index.data.scores.length);
  assert.equal(one.first_order.most_advantaged.length, 5);
  assert.equal(one.first_order.most_pressured.length, 5);
  assert.equal(one.first_order.most_advantaged[0].scenario_advantage_score, 100);
  assert.equal(one.first_order.most_pressured[0].scenario_advantage_score, 0);
  assert.equal(one.entity_result.entity_name, 'NVIDIA');
  assert.ok(strategicConsequenceClassification(one.entity_result.scenario_advantage_score));
  assert.ok(validateConsequence(one), `${scenario.id} response schema drift: ${JSON.stringify(validateConsequence.errors)}`);
}
const missingConsequenceEntity = getStrategicConsequence({
  scenario: 'power_binding_constraint',
  query: 'NVIDA'
});
assert.equal(missingConsequenceEntity.found, false);
assert.ok(missingConsequenceEntity.suggestions.includes('NVIDIA'));
console.log('registry invariants pass');
