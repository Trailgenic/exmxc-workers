import { AI_POWER_CRITERION_IDS, AI_POWER_V2_METHODOLOGY, deriveAiPowerSummaryState, validateAiPowerReleaseSemantics } from "./ai-power-v2.js";

const PRIMARY_SOURCE_TYPES = new Set(["filing", "executed_agreement", "regulator", "procurement", "operating_disclosure", "technical_documentation", "company_statement", "counterparty_statement"]);

function laterDate(...values) {
  return values.filter(Boolean).sort((a, b) => Date.parse(b) - Date.parse(a))[0] || null;
}

function sameValue(first, second) {
  return first === second ? first : null;
}

function unionStrings(...values) {
  return [...new Set(values.flat().filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim()))];
}

function evidenceSignature(item) {
  return JSON.stringify([item.entity_id, item.source_snapshot_sha256, item.source.url, item.source.origin_id, item.extract.replace(/\s+/g, " ").trim().toLowerCase()]);
}

function mergeRepeatedEvidence(first, second) {
  if (!first || !second || evidenceSignature(first) !== evidenceSignature(second)) return null;
  const criterionIds = first.criterion_ids.filter((id) => second.criterion_ids.includes(id));
  if (!criterionIds.length) return null;
  return {
    ...first,
    assertion: first.assertion === second.assertion ? first.assertion : "The cited source extract was independently retained by both automated verification attempts.",
    source: { ...first.source, retrieved_at: laterDate(first.source.retrieved_at, second.source.retrieved_at) },
    observation: {
      valid_from: sameValue(first.observation.valid_from, second.observation.valid_from),
      valid_through: sameValue(first.observation.valid_through, second.observation.valid_through),
      last_substantive_verification_at: laterDate(first.observation.last_substantive_verification_at, second.observation.last_substantive_verification_at)
    },
    locator: first.locator === second.locator ? first.locator : "Repeated source extract; automated locators differed.",
    claim_type: first.claim_type === "fact" && second.claim_type === "fact" ? "fact" : "analytical_inference",
    criterion_ids: criterionIds,
    supports_anchor: first.supports_anchor === true && second.supports_anchor === true,
    counterevidence: unionStrings(first.counterevidence, second.counterevidence),
    freshness: first.freshness === second.freshness ? first.freshness : "unknown",
    verification: {
      status: "verified",
      entity_match: true,
      scope_match: true,
      date_checked: true,
      contradiction_status: first.verification.contradiction_status === "resolved" || second.verification.contradiction_status === "resolved" ? "resolved" : "none_found"
    }
  };
}

function unknownCriterion(id, first, second, reason) {
  return {
    id,
    grade: null,
    anchor_label: null,
    confidence: "limited",
    rationale: "The repeat-run consensus does not support an anchored judgment.",
    evidence_refs: [],
    inference: null,
    counterevidence: unionStrings(first?.counterevidence || [], second?.counterevidence || []),
    unknown_reason: reason
  };
}

function reconcileCriterion(id, first, second, consensusEvidence) {
  if (!first || !second || first.grade === null || second.grade === null || first.grade !== second.grade) {
    return unknownCriterion(id, first, second, first?.grade !== second?.grade
      ? `Repeat automated attempts did not agree on the ${id} grade.`
      : `Both repeat attempts left ${id} unknown.`);
  }
  const evidenceById = new Map(consensusEvidence.map((item) => [item.id, item]));
  const evidenceRefs = first.evidence_refs
    .filter((ref) => second.evidence_refs.includes(ref))
    .filter((ref) => evidenceById.get(ref)?.supports_anchor === true && evidenceById.get(ref)?.criterion_ids.includes(id));
  const anchor = AI_POWER_V2_METHODOLOGY.criteria.find((criterion) => criterion.id === id)?.anchors.find((candidate) => candidate.grade === first.grade);
  if (!anchor || !evidenceRefs.length || !evidenceRefs.some((ref) => evidenceById.get(ref)?.freshness === "current")) {
    return unknownCriterion(id, first, second, `Repeated evidence did not satisfy the deterministic support and freshness gates for ${id}.`);
  }
  return {
    id,
    grade: first.grade,
    anchor_label: anchor.label,
    confidence: first.confidence === "high" && second.confidence === "high" ? "high" : "moderate",
    rationale: `Both automated attempts selected the ${anchor.label} anchor from repeated verified evidence.`,
    evidence_refs: evidenceRefs,
    inference: first.inference === second.inference ? first.inference : null,
    counterevidence: unionStrings(first.counterevidence, second.counterevidence),
    unknown_reason: null
  };
}

function suppressUnderSupportedGrades(criteria, evidence) {
  const gradedRefs = new Set(criteria.flatMap((criterion) => criterion.grade === null ? [] : criterion.evidence_refs));
  if (!gradedRefs.size) return criteria;
  const evidenceById = new Map(evidence.map((item) => [item.id, item]));
  const origins = new Set([...gradedRefs].map((ref) => evidenceById.get(ref)?.source.origin_id).filter(Boolean));
  const hasPrimary = [...gradedRefs].some((ref) => PRIMARY_SOURCE_TYPES.has(evidenceById.get(ref)?.source.source_type));
  if (origins.size >= AI_POWER_V2_METHODOLOGY.evidence_policy.minimum_distinct_documents_for_graded_profile && hasPrimary) return criteria;
  return criteria.map((criterion) => criterion.grade === null ? criterion : unknownCriterion(
    criterion.id,
    criterion,
    criterion,
    "Repeat-consensus evidence did not meet the profile-wide source diversity and primary-evidence gates."
  ));
}

function reconcileProfile(first, second, consensusEvidence) {
  if (first.entity.id !== second.entity.id || first.mechanism.id !== second.mechanism.id) throw new Error("Repeat releases do not contain the same scoped entity mechanisms.");
  if (!first.collection.attempted || !second.collection.attempted) return structuredClone(first.collection.attempted ? second : first);
  let criteria = AI_POWER_CRITERION_IDS.map((id) => reconcileCriterion(
    id,
    first.assessment?.criteria.find((criterion) => criterion.id === id),
    second.assessment?.criteria.find((criterion) => criterion.id === id),
    consensusEvidence
  ));
  criteria = suppressUnderSupportedGrades(criteria, consensusEvidence);
  const stage = first.mechanism.stage === second.mechanism.stage ? first.mechanism.stage : "unverified";
  const profile = {
    ...first,
    mechanism: {
      ...first.mechanism,
      relationship: first.mechanism.relationship === second.mechanism.relationship ? first.mechanism.relationship : "unknown",
      stage,
      scope: first.mechanism.scope === second.mechanism.scope ? first.mechanism.scope : "Repeat automated attempts did not agree on the exact mechanism scope."
    },
    collection: {
      attempted: true,
      status: first.collection.status === "complete" && second.collection.status === "complete" ? "complete" : first.collection.status === "failed" || second.collection.status === "failed" ? "failed" : "partial",
      attempted_at: laterDate(first.collection.attempted_at, second.collection.attempted_at),
      source_documents: Math.min(first.collection.source_documents, second.collection.source_documents),
      targeted_followups: Math.max(first.collection.targeted_followups, second.collection.targeted_followups),
      reason: "Two automated attempts were reconciled conservatively; disagreements remain unknown."
    },
    assessment: {
      status: criteria.every((criterion) => criterion.grade !== null) ? "complete" : criteria.some((criterion) => criterion.grade !== null) ? "partial" : "insufficient_evidence",
      summary_state: "insufficient_evidence",
      prospective: stage !== "operational",
      criteria,
      strongest_dependency: sameValue(first.assessment?.strongest_dependency, second.assessment?.strongest_dependency),
      invalidation_condition: sameValue(first.assessment?.invalidation_condition, second.assessment?.invalidation_condition),
      overall_confidence: criteria.every((criterion) => criterion.grade !== null)
        ? criteria.every((criterion) => criterion.confidence === "high") ? "high" : "moderate"
        : "limited"
    },
    evidence_refs: consensusEvidence.map((item) => item.id)
  };
  profile.assessment.summary_state = deriveAiPowerSummaryState(profile);
  return profile;
}

export function buildRepeatConsensus(firstRelease, secondRelease, assessedAt = new Date().toISOString()) {
  const firstValidation = validateAiPowerReleaseSemantics(firstRelease);
  const secondValidation = validateAiPowerReleaseSemantics(secondRelease);
  if (!firstValidation.ok || !secondValidation.ok) throw new Error("Both repeat candidates must pass semantic validation before reconciliation.");
  if (firstRelease.framework_version !== secondRelease.framework_version || firstRelease.methodology_version !== secondRelease.methodology_version || firstRelease.schema_version !== secondRelease.schema_version) {
    throw new Error("Repeat candidates must use the same framework, methodology, and schema versions.");
  }
  const secondEvidenceById = new Map(secondRelease.evidence.map((item) => [item.id, item]));
  const evidence = firstRelease.evidence.map((item) => mergeRepeatedEvidence(item, secondEvidenceById.get(item.id))).filter(Boolean);
  const evidenceByEntity = new Map();
  for (const item of evidence) evidenceByEntity.set(item.entity_id, [...(evidenceByEntity.get(item.entity_id) || []), item]);
  const secondProfiles = new Map(secondRelease.profiles.map((profile) => [profile.entity.id, profile]));
  const profiles = firstRelease.profiles.map((profile) => reconcileProfile(profile, secondProfiles.get(profile.entity.id), evidenceByEntity.get(profile.entity.id) || []));
  const release = {
    ...structuredClone(firstRelease),
    release_id: `ai-power-v2.0-pilot-consensus-${assessedAt.slice(0, 10)}`,
    release_status: "staging",
    evidence_cutoff_at: laterDate(firstRelease.evidence_cutoff_at, secondRelease.evidence_cutoff_at),
    assessed_at: assessedAt,
    published_at: null,
    pipeline: { ...firstRelease.pipeline, pipeline_version: "ai-power-pipeline-v2.1.0-repeat-consensus" },
    profiles,
    evidence,
    coverage: {
      ...firstRelease.coverage,
      attempted: profiles.filter((profile) => profile.collection.attempted).length,
      complete: profiles.filter((profile) => profile.assessment?.status === "complete").length,
      partial: profiles.filter((profile) => profile.assessment?.status === "partial").length,
      not_started: profiles.filter((profile) => profile.collection.status === "not_started").length,
      unassessed: profiles.filter((profile) => !profile.assessment).length
    }
  };
  const validation = validateAiPowerReleaseSemantics(release);
  if (!validation.ok) throw new Error(`Repeat consensus failed semantic validation: ${validation.errors.join(" | ")}`);
  return release;
}
