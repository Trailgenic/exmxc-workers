import methodology from "../data/ai_power_v2/methodology.json" with { type: "json" };
import release from "../data/ai_power_v2/releases/2026-09-11-pilot.json" with { type: "json" };

export const AI_POWER_V2_METHODOLOGY = methodology;
export const AI_POWER_V2_RELEASE = release;

export const AI_POWER_CRITERION_IDS = Object.freeze([
  "control",
  "substitution_constraint",
  "realized_leverage",
  "durability"
]);

const PRIMARY_SOURCE_TYPES = new Set([
  "filing",
  "executed_agreement",
  "regulator",
  "procurement",
  "operating_disclosure",
  "technical_documentation",
  "company_statement",
  "counterparty_statement"
]);

function normalize(value) {
  return String(value ?? "").normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function profileNames(profile) {
  return [profile.entity.name, profile.entity.ticker, ...(profile.entity.aliases || [])].filter(Boolean);
}

function editDistance(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

function findProfile(query, profiles = release.profiles) {
  const needle = normalize(query);
  return profiles.find((profile) => profileNames(profile).some((name) => normalize(name) === needle));
}

function suggestionsFor(query, profiles = release.profiles, limit = 5) {
  const needle = normalize(query);
  if (!needle) return [];
  return profiles
    .map((profile) => {
      const names = profileNames(profile).map(normalize);
      const prefix = names.some((name) => name.startsWith(needle) || needle.startsWith(name));
      const contains = names.some((name) => name.includes(needle) || needle.includes(name));
      const distance = Math.min(...names.map((name) => editDistance(needle, name)));
      return { name: profile.entity.name, score: prefix ? 3 : contains ? 2 : distance <= 2 ? 1 : 0, distance };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.distance - b.distance || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((candidate) => candidate.name);
}

function unknownCriteria(reason) {
  return methodology.criteria.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    grade: null,
    anchor_label: null,
    confidence: "limited",
    rationale: "No verified evidence-backed judgment is available.",
    evidence_refs: [],
    inference: null,
    counterevidence: [],
    unknown_reason: reason
  }));
}

export function deriveAiPowerSummaryState(profile) {
  const assessment = profile?.assessment;
  if (!assessment) return "insufficient_evidence";
  const byId = Object.fromEntries((assessment.criteria || []).map((criterion) => [criterion.id, criterion]));
  const control = byId.control;
  const substitution = byId.substitution_constraint;
  if (!control || !substitution || control.grade === null || substitution.grade === null
    || control.confidence === "limited" || substitution.confidence === "limited") {
    return "insufficient_evidence";
  }
  if (control.grade < 2 || substitution.grade < 2) return "power_not_established";
  const realized = byId.realized_leverage;
  if (!realized || realized.grade === null || realized.confidence === "limited" || realized.grade < 2) {
    return "structural_potential";
  }
  if (profile.mechanism.stage !== "operational") return "structural_potential";
  const durability = byId.durability;
  if (durability && durability.grade !== null && durability.confidence !== "limited" && durability.grade >= 2) {
    return "durable_demonstrated_leverage";
  }
  return "demonstrated_leverage";
}

export function presentAiPowerProfile(profile) {
  const assessment = profile.assessment ?? {
    status: "insufficient_evidence",
    summary_state: "insufficient_evidence",
    prospective: profile.mechanism.stage !== "operational",
    criteria: unknownCriteria(profile.collection.reason || "No verified evidence packet is available."),
    strongest_dependency: null,
    invalidation_condition: null,
    overall_confidence: "limited"
  };
  const stateId = deriveAiPowerSummaryState({ ...profile, assessment });
  const state = methodology.summary_states.find((candidate) => candidate.id === stateId);
  return {
    ...profile,
    assessment: {
      ...assessment,
      summary_state: stateId,
      summary_label: state?.label ?? stateId
    }
  };
}

export function getAiPowerMethodologyV2() {
  return methodology;
}

export function getAiPowerProfilesV2(args = {}) {
  const query = String(args.query ?? "").trim();
  const group = String(args.group ?? "").trim();
  const status = String(args.status ?? "").trim();
  let profiles = release.profiles;
  if (query) {
    const found = findProfile(query, profiles);
    profiles = found ? [found] : [];
  }
  if (group) profiles = profiles.filter((profile) => profile.entity.coverage_group === group);
  if (status) profiles = profiles.filter((profile) => (profile.assessment?.status ?? "not_started") === status);
  return {
    dataset: release.dataset,
    release_id: release.release_id,
    release_status: release.release_status,
    framework_version: release.framework_version,
    methodology_version: release.methodology_version,
    schema_version: release.schema_version,
    evidence_cutoff_at: release.evidence_cutoff_at,
    assessed_at: release.assessed_at,
    published_at: release.published_at,
    aggregation_policy: methodology.aggregation_policy,
    total_profiles: release.profiles.length,
    returned_profiles: profiles.length,
    filters: { query: query || null, group: group || null, status: status || null },
    coverage: release.coverage,
    profiles: profiles.map(presentAiPowerProfile),
    evidence: query && profiles.length === 1
      ? release.evidence.filter((item) => profiles[0].evidence_refs.includes(item.id))
      : [],
    limitations: release.limitations
  };
}

export function getPowerLensV2(args = {}) {
  const query = String(args.query ?? "").trim();
  const profile = findProfile(query);
  const releaseInfo = {
    release_id: release.release_id,
    status: release.release_status,
    framework_version: release.framework_version,
    methodology_version: release.methodology_version,
    schema_version: release.schema_version,
    evidence_cutoff_at: release.evidence_cutoff_at,
    assessed_at: release.assessed_at,
    published_at: release.published_at
  };
  if (!profile) {
    return {
      product: "exmxc Power Lens",
      version: "2.0-pilot",
      query,
      found: false,
      release: releaseInfo,
      match: null,
      profile: null,
      evidence: [],
      methodology: null,
      coverage: { pilot_candidates: release.profiles.length, scope: "AI Power Index v2 company pilot" },
      suggestions: suggestionsFor(query),
      disclaimer: "No assessment was generated. Power Lens v2 resolves only entities in the declared pilot cohort."
    };
  }
  const matchedValue = profileNames(profile).find((name) => normalize(name) === normalize(query));
  return {
    product: "exmxc Power Lens",
    version: "2.0-pilot",
    query,
    found: true,
    release: releaseInfo,
    match: {
      entity_id: profile.entity.id,
      canonical_entity: profile.entity.name,
      matched_on: normalize(profile.entity.name) === normalize(query) ? "canonical_name" : "alias_or_ticker",
      matched_value: matchedValue,
      entity_type: profile.entity.type,
      parent_id: profile.entity.parent_id
    },
    profile: presentAiPowerProfile(profile),
    evidence: release.evidence.filter((item) => profile.evidence_refs.includes(item.id)),
    methodology: {
      definition: methodology.definition,
      unit_of_analysis: methodology.unit_of_analysis,
      horizon_months: methodology.horizon_months,
      aggregation_policy: methodology.aggregation_policy,
      missing_evidence_policy: methodology.missing_evidence_policy,
      methodology_url: methodology.methodology_url
    },
    coverage: {
      pilot_candidates: release.profiles.length,
      collection_status: profile.collection.status,
      assessment_status: profile.assessment?.status ?? "not_started",
      evidence_count: profile.evidence_refs.length,
      composite_score_available: false,
      universal_rank_available: false
    },
    suggestions: [],
    disclaimer: "Experimental evidence-backed analytical profile. It is not a composite score, universal rank, probability, valuation conclusion, or investment recommendation."
  };
}

export function validateAiPowerV2Query(raw, cap = 120) {
  const query = String(raw ?? "").trim();
  if (!query) return { ok: false, status: 400, error: "Missing required query parameter." };
  if (query.length > cap) return { ok: false, status: 414, error: "AI Power query is too long." };
  return { ok: true, query };
}

export function validateAiPowerReleaseSemantics(candidate = release) {
  const errors = [];
  const ids = candidate.profiles.map((profile) => profile.entity.id);
  if (new Set(ids).size !== ids.length) errors.push("Entity ids must be unique.");
  const names = candidate.profiles.map((profile) => normalize(profile.entity.name));
  if (new Set(names).size !== names.length) errors.push("Canonical entity names must be unique.");
  if (candidate.coverage.pilot_candidates !== candidate.profiles.length) errors.push("Pilot coverage count does not match profile count.");
  if (candidate.release_id.includes("v2.0-pilot") && candidate.profiles.length !== 20) errors.push("The v2.0 pilot cohort must contain exactly 20 profiles.");
  const evidenceById = new Map(candidate.evidence.map((item) => [item.id, item]));
  if (evidenceById.size !== candidate.evidence.length) errors.push("Evidence ids must be unique.");
  for (const item of candidate.evidence) {
    if (!ids.includes(item.entity_id)) errors.push(`${item.id}: evidence entity is not in the release cohort.`);
    if (candidate.evidence_cutoff_at && Date.parse(item.source.retrieved_at) > Date.parse(candidate.evidence_cutoff_at)) errors.push(`${item.id}: retrieval time is after the evidence cutoff.`);
  }

  for (const profile of candidate.profiles) {
    const path = profile.entity.id;
    if (profile.mechanism.secondary_forces.includes(profile.mechanism.primary_force)) {
      errors.push(`${path}: primary force cannot also be secondary.`);
    }
    if (profile.collection.attempted !== Boolean(profile.collection.attempted_at)) {
      errors.push(`${path}: attempted and attempted_at must agree.`);
    }
    if (!profile.collection.attempted && profile.collection.status !== "not_started") {
      errors.push(`${path}: an unattempted profile must be not_started.`);
    }
    if (!profile.collection.attempted && (profile.mechanism.relationship !== "unknown" || profile.mechanism.stage !== "unverified")) {
      errors.push(`${path}: an unattempted profile cannot assert a relationship or operating stage.`);
    }
    if (profile.collection.source_documents > methodology.evidence_policy.maximum_documents_per_entity) {
      errors.push(`${path}: source-document budget exceeded.`);
    }
    if (profile.collection.targeted_followups > methodology.evidence_policy.maximum_targeted_followups_per_entity) {
      errors.push(`${path}: follow-up budget exceeded.`);
    }
    const entityEvidenceRefs = candidate.evidence.filter((item) => item.entity_id === profile.entity.id).map((item) => item.id).sort();
    if (JSON.stringify([...profile.evidence_refs].sort()) !== JSON.stringify(entityEvidenceRefs)) {
      errors.push(`${path}: profile evidence refs must exactly match its release evidence records.`);
    }
    for (const ref of profile.evidence_refs) if (!evidenceById.has(ref)) errors.push(`${path}: unknown evidence ref ${ref}.`);
    if (!profile.assessment) continue;
    if (!profile.collection.attempted) errors.push(`${path}: an assessment requires an attempted evidence collection.`);
    const criteria = profile.assessment.criteria || [];
    const criterionIds = criteria.map((criterion) => criterion.id).sort();
    if (JSON.stringify(criterionIds) !== JSON.stringify([...AI_POWER_CRITERION_IDS].sort())) {
      errors.push(`${path}: assessment must contain each criterion exactly once.`);
    }
    for (const criterion of criteria) {
      if (criterion.grade === null) {
        if (!criterion.unknown_reason) errors.push(`${path}/${criterion.id}: unknown grade requires a reason.`);
        if (criterion.anchor_label !== null) errors.push(`${path}/${criterion.id}: unknown grade cannot have an anchor label.`);
      } else {
        if (criterion.confidence === "limited") errors.push(`${path}/${criterion.id}: limited confidence requires an unknown grade.`);
        if (!criterion.anchor_label) errors.push(`${path}/${criterion.id}: graded criterion requires an anchor label.`);
        if (!criterion.evidence_refs.length) errors.push(`${path}/${criterion.id}: graded criterion requires evidence.`);
        const expectedAnchor = methodology.criteria
          .find((candidateCriterion) => candidateCriterion.id === criterion.id)
          ?.anchors.find((anchor) => anchor.grade === criterion.grade)?.label;
        if (criterion.anchor_label !== expectedAnchor) errors.push(`${path}/${criterion.id}: anchor label must match the methodology anchor for grade ${criterion.grade}.`);
      }
      for (const ref of criterion.evidence_refs) {
        const item = evidenceById.get(ref);
        if (!item) errors.push(`${path}/${criterion.id}: unknown evidence ref ${ref}.`);
        else if (item.entity_id !== profile.entity.id || item.verification.status !== "verified" || !item.supports_anchor) {
          errors.push(`${path}/${criterion.id}: evidence ${ref} is not verified support for this entity.`);
        } else if (!item.criterion_ids.includes(criterion.id)) {
          errors.push(`${path}/${criterion.id}: evidence ${ref} is not scoped to this criterion.`);
        }
      }
    }
    const gradedRefs = new Set(criteria.flatMap((criterion) => criterion.grade === null ? [] : criterion.evidence_refs));
    const origins = new Set([...gradedRefs].map((ref) => evidenceById.get(ref)?.source.origin_id).filter(Boolean));
    const hasPrimary = [...gradedRefs].some((ref) => PRIMARY_SOURCE_TYPES.has(evidenceById.get(ref)?.source.source_type));
    if (criteria.some((criterion) => criterion.grade !== null) && origins.size < methodology.evidence_policy.minimum_distinct_documents_for_graded_profile) {
      errors.push(`${path}: a graded profile needs at least two distinct evidentiary origins.`);
    }
    if (criteria.some((criterion) => criterion.grade !== null) && !hasPrimary) errors.push(`${path}: a graded profile needs primary evidence.`);
    for (const criterion of criteria.filter((item) => item.grade !== null)) {
      if (!criterion.evidence_refs.some((ref) => evidenceById.get(ref)?.freshness === "current")) {
        errors.push(`${path}/${criterion.id}: a graded criterion needs at least one current supporting claim.`);
      }
    }
    const gradedCount = criteria.filter((criterion) => criterion.grade !== null).length;
    const expectedStatus = gradedCount === AI_POWER_CRITERION_IDS.length
      ? "complete"
      : gradedCount > 0 ? "partial" : "insufficient_evidence";
    if (profile.assessment.status !== expectedStatus) errors.push(`${path}: assessment status must be ${expectedStatus}.`);
    const expectedProspective = profile.mechanism.stage !== "operational";
    if (profile.assessment.prospective !== expectedProspective) errors.push(`${path}: prospective flag must be ${expectedProspective}.`);
    if (gradedCount < AI_POWER_CRITERION_IDS.length && profile.assessment.overall_confidence !== "limited") {
      errors.push(`${path}: incomplete assessments must have limited overall confidence.`);
    }
    if (profile.assessment.overall_confidence === "high" && !criteria.every((criterion) => criterion.confidence === "high")) {
      errors.push(`${path}: high overall confidence requires high confidence on every criterion.`);
    }
    const expected = deriveAiPowerSummaryState(profile);
    if (profile.assessment.summary_state !== expected) errors.push(`${path}: summary state must be ${expected}.`);
    if (["announced", "proposed", "contracted"].includes(profile.mechanism.stage)
      && ["demonstrated_leverage", "durable_demonstrated_leverage"].includes(profile.assessment.summary_state)) {
      errors.push(`${path}: prospective mechanisms cannot be labeled demonstrated leverage.`);
    }
  }

  const computed = {
    attempted: candidate.profiles.filter((profile) => profile.collection.attempted).length,
    complete: candidate.profiles.filter((profile) => profile.assessment?.status === "complete").length,
    partial: candidate.profiles.filter((profile) => profile.assessment?.status === "partial").length,
    not_started: candidate.profiles.filter((profile) => profile.collection.status === "not_started").length,
    unassessed: candidate.profiles.filter((profile) => !profile.assessment).length
  };
  for (const [key, value] of Object.entries(computed)) {
    if (candidate.coverage[key] !== value) errors.push(`Coverage ${key} must equal ${value}.`);
  }
  if (candidate.release_status === "published") {
    if (computed.not_started > 0 || computed.attempted !== candidate.profiles.length) errors.push("Published releases must attempt every pilot profile.");
    if (!candidate.evidence_cutoff_at || !candidate.assessed_at || !candidate.published_at) errors.push("Published releases require evidence cutoff, assessment, and publication timestamps.");
  }
  if (candidate.assessed_at && candidate.published_at && Date.parse(candidate.published_at) < Date.parse(candidate.assessed_at)) {
    errors.push("Publication time cannot precede assessment time.");
  }
  return { ok: errors.length === 0, errors };
}
