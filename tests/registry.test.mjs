import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import { DATASETS, DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
import strategicConsequenceSchema from '../schema/strategic_consequence.schema.json' with { type: 'json' };
import spegIndexProfileV1Schema from '../schema/speg_index_profile_v1.schema.json' with { type: 'json' };
import {
  calculateRealityGapScores,
  getStrategicConsequence,
  realityGapClassification,
  strategicConsequenceClassification
} from '../lib/queries.js';
import { AI_POWER_V2_METHODOLOGY, AI_POWER_V2_RELEASE, deriveAiPowerSummaryState, validateAiPowerReleaseSemantics } from '../lib/ai-power-v2.js';
import { assembleVerifiedProfile, buildDeterministicPassages, callOpenAIJson, extractionPrompt, recordFailedProfileAttempt, validateEvidenceDocumentSnapshot, validateSourceManifest, verificationPrompt } from '../lib/ai-power-pipeline.js';
import { buildRepeatConsensus } from '../lib/ai-power-consensus.js';
import {
  SPEG_INDEX_RELEASE,
  SPEG_INDEX_DRAFT_RELEASE,
  calculateSpegIndexScore,
  evaluateSpegIndexEligibility,
  validateSpegIndexReleaseSemantics
} from '../lib/speg-index-v1.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.power_lens.get'));
assert.ok(DATA_TOOLS.some(t=>t.id === 'ex.speg.index.get'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/speg-index/v1'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://schemas/speg-index-profile/v1'));
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
assert.equal(DATASETS.speg_index_v1.data.release_id, 'speg-index-2026-09-17-v1');
assert.equal(SPEG_INDEX_RELEASE.profiles.length, 10);
assert.equal(SPEG_INDEX_RELEASE.coverage.include_recommendations, 5);
assert.equal(SPEG_INDEX_RELEASE.coverage.watchlist, 5);
assert.equal(SPEG_INDEX_RELEASE.coverage.released_members, 5);
assert.equal(SPEG_INDEX_RELEASE.coverage.qualified_member_count, 5);
assert.equal(SPEG_INDEX_RELEASE.membership_mutated, true);
assert.equal(SPEG_INDEX_DRAFT_RELEASE.coverage.released_members, 0);
assert.equal(SPEG_INDEX_DRAFT_RELEASE.membership_mutated, false);
assert.deepEqual(validateSpegIndexReleaseSemantics(SPEG_INDEX_RELEASE), { ok: true, errors: [] });
const validateSpegIndex = new Ajv2020({ strict: false, validateFormats: false }).compile(spegIndexProfileV1Schema);
assert.equal(validateSpegIndex(SPEG_INDEX_RELEASE), true, JSON.stringify(validateSpegIndex.errors));

const admissionConfidence = Object.fromEntries(['constraint', 'substitution_resistance', 'economic_capture', 'persistence', 'cost_of_defense'].map((key) => [key, 'Moderate']));
const adiFixture = { constraint: 2, substitution_resistance: 3, economic_capture: 3, persistence: 3, cost_of_defense: 3 };
assert.equal(calculateSpegIndexScore(adiFixture), 14);
assert.equal(evaluateSpegIndexEligibility({ dimensions: adiFixture, dimensionConfidence: admissionConfidence, materialityStatus: 'adequate', sourcePacketPass: true, currentReviewPass: true, materialEventPass: true }).eligible_for_inclusion, false);
const snpsFixture = { constraint: 3, substitution_resistance: 3, economic_capture: 3, persistence: 3, cost_of_defense: 2 };
assert.equal(calculateSpegIndexScore(snpsFixture), 14);
assert.equal(evaluateSpegIndexEligibility({ dimensions: snpsFixture, dimensionConfidence: admissionConfidence, materialityStatus: 'adequate', sourcePacketPass: true, currentReviewPass: true, materialEventPass: true }).eligible_for_inclusion, true);
assert.equal(calculateSpegIndexScore({ ...snpsFixture, persistence: null }), null);
assert.equal(evaluateSpegIndexEligibility({ dimensions: { constraint: 4, substitution_resistance: 4, economic_capture: 4, persistence: 4, cost_of_defense: 4 }, dimensionConfidence: { ...admissionConfidence, constraint: 'Low' }, materialityStatus: 'adequate', sourcePacketPass: true, currentReviewPass: true, materialEventPass: true }).eligible_for_inclusion, false);
assert.ok(SPEG_INDEX_RELEASE.profiles.every(profile => profile.valuation.sds_used_as_valuation_input === false));
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
const deterministicPassages = buildDeterministicPassages(pipelineDocuments);
assert.deepEqual(deterministicPassages, buildDeterministicPassages(structuredClone(pipelineDocuments)));
assert.equal(deterministicPassages.length, 2);
assert.match(deterministicPassages[0].passage_id, /^source-a::p0001::[a-f0-9]{12}$/);
assert.ok(extractionPrompt(pipelineProfile, pipelineDocuments).includes(deterministicPassages[0].passage_id));
assert.ok(extractionPrompt(pipelineProfile, pipelineDocuments).includes('passage_id'));
assert.ok(!extractionPrompt(pipelineProfile, pipelineDocuments).includes('source_text'));
assert.ok(verificationPrompt(pipelineProfile, pipelineDocuments, { claims: [] }).includes(deterministicPassages[1].passage_id));
const longPassageDocument = { ...pipelineDocuments[0], text: Array.from({ length: 240 }, (_, index) => `word${index}`).join(' ') };
assert.ok(buildDeterministicPassages([longPassageDocument]).every((passage) => passage.text.length <= 900));
const unbrokenPassageDocument = { ...pipelineDocuments[0], text: 'x'.repeat(1900) };
assert.ok(buildDeterministicPassages([unbrokenPassageDocument]).every((passage) => passage.text.length <= 900));
const snapshotDocuments = pipelineDocuments.map((document) => ({
  ...document,
  passages: buildDeterministicPassages([document])
}));
const sourceSnapshotFixture = {
  snapshot_version: 'ai-power-source-snapshot-v2',
  entity_id: pipelineProfile.entity.id,
  captured_at: '2026-09-11T12:00:00Z',
  manifest_sha256: 'f'.repeat(64),
  documents: snapshotDocuments
};
assert.deepEqual(validateEvidenceDocumentSnapshot(pipelineProfile, sourceManifest, sourceSnapshotFixture), { ok: true, errors: [] });
const tamperedSourceSnapshot = structuredClone(sourceSnapshotFixture);
tamperedSourceSnapshot.documents[0].origin_id = 'undeclared-origin';
assert.ok(validateEvidenceDocumentSnapshot(pipelineProfile, sourceManifest, tamperedSourceSnapshot).errors.some((error) => error.includes('origin_id differs')));
const tamperedPassageSnapshot = structuredClone(sourceSnapshotFixture);
tamperedPassageSnapshot.documents[0].passages[0].text = 'Tampered passage text.';
assert.ok(validateEvidenceDocumentSnapshot(pipelineProfile, sourceManifest, tamperedPassageSnapshot).errors.some((error) => error.includes('passage catalog')));
const pipelineVerified = {
  mechanism: { relationship: 'controls', stage: 'operational', scope: 'Fixture market and period.' },
  claims: [
    { id: 'claim-a', source_id: 'source-a', passage_id: deterministicPassages.find((passage) => passage.source_id === 'source-a').passage_id, assertion: 'Fixture issuer claim.', locator: 'model-locator-is-ignored', extract: 'Model extract is ignored.', valid_from: '2026-09-01T00:00:00Z', valid_through: null, last_substantive_verification_at: '2026-09-11T12:00:00Z', claim_type: 'fact', criterion_ids: ['control', 'realized_leverage'], supports_anchor: true, counterevidence: [], freshness: 'current', verification: { status: 'verified', entity_match: true, scope_match: true, date_checked: true, contradiction_status: 'none_found' } },
    { id: 'claim-b', source_id: 'source-b', passage_id: deterministicPassages.find((passage) => passage.source_id === 'source-b').passage_id, assertion: 'Fixture corroborating claim.', locator: 'model-locator-is-ignored', extract: 'Model extract is ignored.', valid_from: '2026-09-02T00:00:00Z', valid_through: null, last_substantive_verification_at: '2026-09-11T12:00:00Z', claim_type: 'fact', criterion_ids: ['substitution_constraint', 'durability'], supports_anchor: true, counterevidence: [], freshness: 'current', verification: { status: 'verified', entity_match: true, scope_match: true, date_checked: true, contradiction_status: 'none_found' } }
  ],
  proposed_criteria: syntheticCriteria.map((criterion) => ({
    ...criterion,
    claim_ids: ['control', 'realized_leverage'].includes(criterion.id) ? ['claim-a'] : ['claim-b']
  })),
  strongest_dependency: 'Fixture dependency.',
  invalidation_condition: 'A viable substitute becomes available.'
};
const assembledPipelineRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, pipelineVerified, '2026-09-11T12:00:00Z');
assert.equal(assembledPipelineRelease.evidence[0].locator, pipelineVerified.claims[0].passage_id);
assert.equal(assembledPipelineRelease.evidence[0].extract, pipelineDocuments[0].text);
assert.equal(assembledPipelineRelease.profiles[0].assessment.summary_state, 'durable_demonstrated_leverage');
assert.equal(assembledPipelineRelease.coverage.attempted, 1);
assert.equal(assembledPipelineRelease.coverage.complete, 1);
assert.equal(assembledPipelineRelease.coverage.not_started, 19);
assert.deepEqual(validateAiPowerReleaseSemantics(assembledPipelineRelease), { ok: true, errors: [] });
const repeatedConsensusRelease = buildRepeatConsensus(assembledPipelineRelease, structuredClone(assembledPipelineRelease), '2026-09-11T13:00:00Z');
assert.equal(repeatedConsensusRelease.pipeline.pipeline_version, 'ai-power-pipeline-v2.2.0-deterministic-passage-consensus');
assert.equal(repeatedConsensusRelease.profiles[0].assessment.status, 'complete');
assert.equal(repeatedConsensusRelease.evidence.length, 2);
assert.deepEqual(validateAiPowerReleaseSemantics(repeatedConsensusRelease), { ok: true, errors: [] });
const underSupportedFixture = structuredClone(pipelineVerified);
underSupportedFixture.proposed_criteria = underSupportedFixture.proposed_criteria.map((criterion) => ({ ...criterion, claim_ids: ['claim-a'] }));
const underSupportedRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, underSupportedFixture, '2026-09-11T12:00:00Z');
assert.equal(underSupportedRelease.evidence.length, 2);
assert.equal(underSupportedRelease.profiles[0].assessment.status, 'insufficient_evidence');
assert.ok(underSupportedRelease.profiles[0].assessment.criteria.every((criterion) => criterion.grade === null));
assert.ok(underSupportedRelease.profiles[0].assessment.criteria.some((criterion) => criterion.unknown_reason.includes('source diversity')));
assert.deepEqual(validateAiPowerReleaseSemantics(underSupportedRelease), { ok: true, errors: [] });
const criterionScopeMismatchFixture = structuredClone(pipelineVerified);
criterionScopeMismatchFixture.proposed_criteria.find((criterion) => criterion.id === 'control').claim_ids = ['claim-b'];
const criterionScopeMismatchRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, criterionScopeMismatchFixture, '2026-09-11T12:00:00Z');
assert.equal(criterionScopeMismatchRelease.evidence.length, 2);
assert.equal(criterionScopeMismatchRelease.profiles[0].assessment.status, 'partial');
assert.equal(criterionScopeMismatchRelease.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'control').grade, null);
assert.equal(criterionScopeMismatchRelease.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'realized_leverage').grade, 2);
assert.deepEqual(validateAiPowerReleaseSemantics(criterionScopeMismatchRelease), { ok: true, errors: [] });
const alternateModelShape = structuredClone(pipelineVerified);
alternateModelShape.claims[0].id = 'alternate-claim-a';
alternateModelShape.claims[0].locator = 'a different generated locator';
alternateModelShape.claims[0].extract = 'a different generated extract';
alternateModelShape.proposed_criteria = alternateModelShape.proposed_criteria.map((criterion) => ({
  ...criterion,
  claim_ids: criterion.claim_ids.map((id) => id === 'claim-a' ? 'alternate-claim-a' : id)
}));
const alternatePassageRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, alternateModelShape, '2026-09-11T12:05:00Z');
assert.deepEqual(alternatePassageRelease.evidence.map((item) => item.id), assembledPipelineRelease.evidence.map((item) => item.id));
assert.deepEqual(alternatePassageRelease.evidence.map((item) => item.extract), assembledPipelineRelease.evidence.map((item) => item.extract));
const deterministicPassageConsensus = buildRepeatConsensus(assembledPipelineRelease, alternatePassageRelease, '2026-09-11T13:00:00Z');
assert.equal(deterministicPassageConsensus.evidence.length, 2);
assert.equal(deterministicPassageConsensus.profiles[0].assessment.status, 'complete');
assert.deepEqual(validateAiPowerReleaseSemantics(deterministicPassageConsensus), { ok: true, errors: [] });
const invalidPassageFixture = structuredClone(pipelineVerified);
invalidPassageFixture.claims[0].passage_id = 'source-a::p9999::000000000000';
const invalidPassageRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, invalidPassageFixture, '2026-09-11T12:10:00Z');
assert.equal(invalidPassageRelease.evidence.length, 1);
assert.equal(invalidPassageRelease.profiles[0].assessment.status, 'insufficient_evidence');
const differentClaimRelease = structuredClone(alternatePassageRelease);
const differentEvidence = differentClaimRelease.evidence.find((item) => item.source.origin_id === 'issuer-a');
const priorDifferentId = differentEvidence.id;
differentEvidence.id = 'evidence-fixture-different-claim';
differentEvidence.extract = 'A distinct statement from the same source cannot establish repeat-run agreement.';
differentClaimRelease.profiles[0].evidence_refs = differentClaimRelease.profiles[0].evidence_refs.map((ref) => ref === priorDifferentId ? differentEvidence.id : ref);
for (const criterion of differentClaimRelease.profiles[0].assessment.criteria) {
  criterion.evidence_refs = criterion.evidence_refs.map((ref) => ref === priorDifferentId ? differentEvidence.id : ref);
}
assert.deepEqual(validateAiPowerReleaseSemantics(differentClaimRelease), { ok: true, errors: [] });
const differentClaimConsensus = buildRepeatConsensus(assembledPipelineRelease, differentClaimRelease, '2026-09-11T13:00:00Z');
assert.equal(differentClaimConsensus.evidence.length, 1);
assert.equal(differentClaimConsensus.profiles[0].assessment.status, 'insufficient_evidence');
assert.ok(differentClaimConsensus.profiles[0].assessment.criteria.every((criterion) => criterion.grade === null));
const disagreementRelease = structuredClone(assembledPipelineRelease);
disagreementRelease.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'realized_leverage').grade = 1;
disagreementRelease.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'realized_leverage').anchor_label = AI_POWER_V2_METHODOLOGY.criteria.find((criterion) => criterion.id === 'realized_leverage').anchors.find((anchor) => anchor.grade === 1).label;
disagreementRelease.profiles[0].assessment.summary_state = deriveAiPowerSummaryState(disagreementRelease.profiles[0]);
const disagreementConsensus = buildRepeatConsensus(assembledPipelineRelease, disagreementRelease, '2026-09-11T13:00:00Z');
assert.equal(disagreementConsensus.profiles[0].assessment.status, 'partial');
assert.equal(disagreementConsensus.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'realized_leverage').grade, null);
assert.match(disagreementConsensus.profiles[0].assessment.criteria.find((criterion) => criterion.id === 'realized_leverage').unknown_reason, /did not agree/);
const malformedShapeFixture = structuredClone(pipelineVerified);
malformedShapeFixture.claims.push({
  ...malformedShapeFixture.claims[0],
  id: 'claim-malformed',
  claim_type: 'direct_fact',
  criterion_ids: [],
  counterevidence: 'Malformed model string.'
});
malformedShapeFixture.claims[1].counterevidence = 'A normalized counterpoint.';
malformedShapeFixture.claims[1].valid_from = '2026-09-02';
malformedShapeFixture.claims[1].valid_through = 'not-a-date';
malformedShapeFixture.proposed_criteria[0].counterevidence = 'A normalized criterion counterpoint.';
const shapeHardenedRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, malformedShapeFixture, '2026-09-11T12:00:00Z');
assert.equal(shapeHardenedRelease.evidence.length, 2);
assert.deepEqual(shapeHardenedRelease.evidence[1].counterevidence, ['A normalized counterpoint.']);
assert.equal(shapeHardenedRelease.evidence[1].observation.valid_from, '2026-09-02T00:00:00.000Z');
assert.equal(shapeHardenedRelease.evidence[1].observation.valid_through, null);
assert.deepEqual(shapeHardenedRelease.profiles[0].assessment.criteria[0].counterevidence, ['A normalized criterion counterpoint.']);
assert.deepEqual(validateAiPowerReleaseSemantics(shapeHardenedRelease), { ok: true, errors: [] });
const contextualOnlyFixture = structuredClone(pipelineVerified);
contextualOnlyFixture.claims = contextualOnlyFixture.claims.map((claim) => ({ ...claim, supports_anchor: false }));
const contextualOnlyRelease = assembleVerifiedProfile(AI_POWER_V2_RELEASE, pipelineProfile.entity.id, pipelineDocuments, contextualOnlyFixture, '2026-09-11T12:00:00Z');
assert.equal(contextualOnlyRelease.evidence.length, 2);
assert.equal(contextualOnlyRelease.profiles[0].assessment.status, 'insufficient_evidence');
assert.ok(contextualOnlyRelease.profiles[0].assessment.criteria.every((criterion) => criterion.grade === null));
assert.deepEqual(validateAiPowerReleaseSemantics(contextualOnlyRelease), { ok: true, errors: [] });
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
