import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import schema from "../schema/speg_index_profile_v1.schema.json" with { type: "json" };
import {
  SPEG_INDEX_RELEASE,
  SPEG_INDEX_DRAFT_RELEASE,
  calculateSpegIndexScore,
  evaluateSpegIndexEligibility,
  spegIndexReleaseHashPayload,
  validateSpegIndexReleaseSemantics
} from "../lib/speg-index-v1.js";

const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
const validate = ajv.compile(schema);
assert.equal(validate(SPEG_INDEX_RELEASE), true, JSON.stringify(validate.errors));
assert.deepEqual(validateSpegIndexReleaseSemantics(SPEG_INDEX_RELEASE), { ok: true, errors: [] });
assert.equal(validate(SPEG_INDEX_DRAFT_RELEASE), true, JSON.stringify(validate.errors));
assert.deepEqual(validateSpegIndexReleaseSemantics(SPEG_INDEX_DRAFT_RELEASE), { ok: true, errors: [] });

const stable = (value) => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
    : value;
const expectedHash = `sha256:${createHash("sha256").update(JSON.stringify(stable(spegIndexReleaseHashPayload(SPEG_INDEX_RELEASE)))).digest("hex")}`;
assert.equal(SPEG_INDEX_RELEASE.content_hash, expectedHash, "released content hash drift");

const moderate = Object.fromEntries([
  "constraint",
  "substitution_resistance",
  "economic_capture",
  "persistence",
  "cost_of_defense"
].map((key) => [key, "Moderate"]));
const common = {
  dimensionConfidence: moderate,
  materialityStatus: "adequate",
  sourcePacketPass: true,
  currentReviewPass: true,
  materialEventPass: true
};

const adi = { constraint: 2, substitution_resistance: 3, economic_capture: 3, persistence: 3, cost_of_defense: 3 };
assert.equal(calculateSpegIndexScore(adi), 14);
assert.equal(evaluateSpegIndexEligibility({ dimensions: adi, ...common }).eligible_for_inclusion, false);

const snps = { constraint: 3, substitution_resistance: 3, economic_capture: 3, persistence: 3, cost_of_defense: 2 };
assert.equal(calculateSpegIndexScore(snps), 14);
assert.equal(evaluateSpegIndexEligibility({ dimensions: snps, ...common }).eligible_for_inclusion, true);
assert.equal(calculateSpegIndexScore({ ...snps, persistence: null }), null);

const lowConfidence = { ...moderate, constraint: "Low" };
const perfect = { constraint: 4, substitution_resistance: 4, economic_capture: 4, persistence: 4, cost_of_defense: 4 };
assert.equal(evaluateSpegIndexEligibility({ dimensions: perfect, ...common, dimensionConfidence: lowConfidence }).eligible_for_inclusion, false);
assert.equal(evaluateSpegIndexEligibility({ dimensions: perfect, ...common, materialityStatus: "inadequate" }).eligible_for_inclusion, false);

assert.equal(SPEG_INDEX_RELEASE.release_state, "released");
assert.equal(SPEG_INDEX_RELEASE.membership_mutated, true);
assert.equal(SPEG_INDEX_RELEASE.coverage.released_members, 5);
assert.equal(SPEG_INDEX_RELEASE.coverage.qualified_member_count, 5);
assert.equal(SPEG_INDEX_DRAFT_RELEASE.release_state, "draft");
assert.equal(SPEG_INDEX_DRAFT_RELEASE.membership_mutated, false);
assert.equal(SPEG_INDEX_DRAFT_RELEASE.profiles.every((profile) => profile.decision.membership_state === null), true);
assert.equal(SPEG_INDEX_RELEASE.profiles.every((profile) => profile.valuation.sds_used_as_valuation_input === false), true);
assert.equal(SPEG_INDEX_RELEASE.profiles.every((profile) => profile.valuation.peg === null && profile.valuation.economic_speg === null), true);

console.log(`sPEG Index valid: ${SPEG_INDEX_RELEASE.release_id}, ${SPEG_INDEX_RELEASE.profiles.length} profiles, ${SPEG_INDEX_RELEASE.sources.length} sources, ${SPEG_INDEX_RELEASE.coverage.released_members} released members`);
