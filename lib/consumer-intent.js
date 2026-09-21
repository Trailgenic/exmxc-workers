import methodology from "../data/consumer_intent_v1/methodology.json" with { type: "json" };
import entityRegistry from "../data/consumer_intent_v1/entities.json" with { type: "json" };
import categoryRegistry from "../data/consumer_intent_v1/categories.json" with { type: "json" };
import releaseArchive from "../data/consumer_intent_v1/release-archive.json" with { type: "json" };

export const CONSUMER_INTENT_METHODOLOGY = methodology;
export const CONSUMER_INTENT_ENTITIES = entityRegistry;
export const CONSUMER_INTENT_CATEGORIES = categoryRegistry;
const archivedReleases = Array.isArray(releaseArchive.releases) ? releaseArchive.releases : [];
const releaseById = new Map(archivedReleases.map((release) => [release.release_id, release]));
const latestRelease = releaseById.get(releaseArchive.latest) ?? archivedReleases.at(-1);
if (!latestRelease) throw new Error("Consumer Intent release archive is empty.");
export const CONSUMER_INTENT_LATEST = latestRelease;

export const CONSUMER_INTENT_RELEASES = {
  series_id: releaseArchive.series_id,
  latest: latestRelease.release_id,
  releases: archivedReleases.map((release) => ({
    release_id: release.release_id,
    as_of: release.as_of,
    status: release.release_status,
    methodology_id: release.methodology_id,
    observation_count: release.coverage.observation_count,
    label: `${release.release_status === "foundation" ? "Foundation" : "Pilot"} · ${release.as_of}`
  }))
};

const ACTIONS = new Set(methodology.consumer_actions);
const DIRECTIONS = new Set(["positive", "negative", "mixed", "neutral"]);
const HORIZONS = new Set(["completed", "immediate", "near_term", "later", "unknown"]);

const FACTOR_ACTIONS = {
  wallet_stress: {
    support: ["PURCHASE_DELAY", "PURCHASE_CANCELLED", "LOST_INTENT", "TRADE_DOWN", "DEAL_SEEKING", "WAITING_FOR_SALE", "DISCRETIONARY_REDUCTION"],
    oppose: ["TRADE_UP", "DISCRETIONARY_EXPANSION"]
  },
  purchase_intent: {
    support: ["PURCHASE_INTENT", "PURCHASE_COMPLETED", "GAINED_INTENT", "REPEAT_PURCHASE", "BRAND_ENTRY"],
    oppose: ["PURCHASE_DELAY", "PURCHASE_CANCELLED", "LOST_INTENT", "BRAND_EXIT"]
  },
  purchase_deferral: {
    support: ["PURCHASE_DELAY", "PURCHASE_CANCELLED", "WAITING_FOR_SALE"],
    oppose: ["PURCHASE_COMPLETED"]
  },
  trade_down: {
    support: ["TRADE_DOWN"],
    oppose: ["TRADE_UP"]
  },
  deal_sensitivity: {
    support: ["DEAL_SEEKING", "WAITING_FOR_SALE"],
    oppose: []
  },
  discretionary_appetite: {
    support: ["DISCRETIONARY_EXPANSION", "PURCHASE_COMPLETED"],
    oppose: ["DISCRETIONARY_REDUCTION", "PURCHASE_DELAY", "PURCHASE_CANCELLED"]
  },
  brand_desire: {
    support: ["PURCHASE_INTENT", "GAINED_INTENT", "REPEAT_PURCHASE", "BRAND_ENTRY"],
    oppose: ["LOST_INTENT", "BRAND_EXIT", "PURCHASE_CANCELLED"]
  }
};

function key(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function consumerSourceKey(observation) {
  return String(observation?.source ?? "").trim().toLowerCase();
}

function dateOnly(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString().slice(0, 10);
}

function numberInRange(value, minimum, maximum) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= minimum && numeric <= maximum;
}

export function resolveConsumerEntity(value) {
  const needle = key(value);
  if (!needle) return null;
  return entityRegistry.entities.find((entity) => key(entity.id) === needle)
    ?? entityRegistry.entities.find((entity) => entity.entity_type === "public_company" && key(entity.ticker) === needle)
    ?? entityRegistry.entities.find((entity) => key(entity.display_name) === needle)
    ?? entityRegistry.entities.find((entity) => (entity.aliases || []).some((candidate) => key(candidate) === needle))
    ?? entityRegistry.entities.find((entity) => key(entity.ticker) === needle)
    ?? null;
}

export function consumerEntityFamily(value) {
  const entity = resolveConsumerEntity(value);
  if (!entity) return null;
  const parent = entity.parent_company_id
    ? entityRegistry.entities.find((candidate) => candidate.id === entity.parent_company_id) ?? null
    : entity.entity_type === "public_company" ? entity : null;
  const children = entityRegistry.entities.filter((candidate) => candidate.parent_company_id === (parent?.id ?? entity.id));
  return { entity, parent, children };
}

export function validateConsumerObservation(input) {
  const errors = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return { ok: false, errors: ["Observation must be an object."] };
  for (const field of ["observation_id", "timestamp", "source", "source_type", "category", "consumer_action", "model_version"]) {
    if (!String(input[field] ?? "").trim()) errors.push(`${field} is required.`);
  }
  if (!ACTIONS.has(input.consumer_action)) errors.push("consumer_action is outside the v1 taxonomy.");
  if (!DIRECTIONS.has(input.direction)) errors.push("direction must be positive, negative, mixed, or neutral.");
  if (!HORIZONS.has(input.time_horizon ?? "unknown")) errors.push("time_horizon is invalid.");
  if (!numberInRange(input.intensity, 0, 1)) errors.push("intensity must be between 0 and 1.");
  if (!numberInRange(input.confidence, 0, 1)) errors.push("confidence must be between 0 and 1.");
  if (input.spam_bot_probability != null && !numberInRange(input.spam_bot_probability, 0, 1)) errors.push("spam_bot_probability must be between 0 and 1.");
  if (input.promotion_probability != null && !numberInRange(input.promotion_probability, 0, 1)) errors.push("promotion_probability must be between 0 and 1.");
  if (!dateOnly(input.timestamp)) errors.push("timestamp must be a valid date-time.");
  if (input.collection_date && !dateOnly(input.collection_date)) errors.push("collection_date must be a valid date.");
  const category = categoryRegistry.categories.find((candidate) => candidate.id === input.category);
  if (!category) errors.push("category is not present in the v1 category registry.");
  return { ok: errors.length === 0, errors };
}

export function normalizeConsumerObservation(input) {
  const validation = validateConsumerObservation(input);
  if (!validation.ok) return { success: false, errors: validation.errors };
  const resolved = resolveConsumerEntity(input.entity_id || input.entity || input.ticker);
  const parent = resolved?.parent_company_id
    ? entityRegistry.entities.find((candidate) => candidate.id === resolved.parent_company_id) ?? null
    : resolved?.entity_type === "public_company" ? resolved : null;
  const substitute = resolveConsumerEntity(input.substitute_entity_id || input.substitute_entity);
  return {
    success: true,
    observation: {
      observation_id: String(input.observation_id),
      timestamp: new Date(input.timestamp).toISOString(),
      collection_date: dateOnly(input.collection_date || input.timestamp),
      source: String(input.source),
      source_type: String(input.source_type),
      source_url: input.source_url || null,
      raw_text: input.raw_text || null,
      reference: input.reference || null,
      geography: input.geography || null,
      category: input.category,
      subcategory: input.subcategory || null,
      entity_id: resolved?.id ?? null,
      entity: resolved?.display_name ?? input.entity ?? null,
      parent_company_id: parent?.id ?? null,
      parent_company: parent?.display_name ?? null,
      ticker: parent?.ticker ?? resolved?.ticker ?? null,
      consumer_action: input.consumer_action,
      direction: input.direction,
      economic_driver: input.economic_driver || null,
      substitute_entity_id: substitute?.id ?? null,
      substitute_entity: substitute?.display_name ?? input.substitute_entity ?? null,
      time_horizon: input.time_horizon || "unknown",
      intensity: Number(input.intensity),
      confidence: Number(input.confidence),
      methodology_version: methodology.methodology_id,
      model_version: String(input.model_version),
      duplicate_cluster_id: input.duplicate_cluster_id || null,
      spam_bot_probability: input.spam_bot_probability == null ? null : Number(input.spam_bot_probability),
      promotion_probability: input.promotion_probability == null ? null : Number(input.promotion_probability),
      entity_resolution_status: resolved ? "resolved" : (input.entity || input.ticker ? "unresolved" : "unresolved")
    }
  };
}

export function deduplicateConsumerObservations(observations) {
  const seen = new Set();
  const unique = [];
  for (const observation of observations) {
    const cluster = observation.duplicate_cluster_id || `${key(observation.source)}:${key(observation.observation_id)}`;
    if (seen.has(cluster)) continue;
    seen.add(cluster);
    unique.push(observation);
  }
  return unique;
}

function factorSign(action, factor) {
  if (FACTOR_ACTIONS[factor]?.support.includes(action)) return 1;
  if (FACTOR_ACTIONS[factor]?.oppose.includes(action)) return -1;
  return 0;
}

function confidenceLabel(observations) {
  const mean = observations.reduce((sum, row) => sum + Number(row.confidence), 0) / Math.max(1, observations.length);
  if (observations.length >= 100 && mean >= 0.8) return "high";
  if (mean >= 0.65) return "moderate";
  return "low";
}

export function aggregateConsumerFactor(observations, factor, window = "30d") {
  if (!FACTOR_ACTIONS[factor]) throw new Error(`Unknown Consumer Intent factor: ${factor}`);
  const unique = deduplicateConsumerObservations(observations)
    .filter((row) => factorSign(row.consumer_action, factor) !== 0)
    .filter((row) => Number(row.spam_bot_probability ?? 0) < 0.8 && Number(row.promotion_probability ?? 0) < 0.8);
  const sources = new Set(unique.map(consumerSourceKey).filter(Boolean));
  const days = new Set(unique.map((row) => row.collection_date || dateOnly(row.timestamp)).filter(Boolean));
  const concentration = unique.length
    ? Math.max(...[...sources].map((source) => unique.filter((row) => consumerSourceKey(row) === source).length)) / unique.length
    : 1;
  const gates = methodology.measurement_policy.publication_gates;
  const measured = unique.length >= gates.minimum_unique_observations
    && sources.size >= gates.minimum_independent_sources
    && days.size >= gates.minimum_collection_days
    && concentration <= gates.maximum_single_source_share;
  if (!measured) {
    return {
      factor,
      window,
      status: "insufficient_evidence",
      balance: null,
      direction: "unknown",
      observation_count: unique.length,
      source_count: sources.size,
      collection_days: days.size,
      maximum_single_source_share: Number(concentration.toFixed(3)),
      confidence: "low",
      dominant_drivers: []
    };
  }
  let signed = 0;
  let mass = 0;
  const driverMass = new Map();
  for (const row of unique) {
    const weight = Number(row.intensity) * Number(row.confidence);
    signed += factorSign(row.consumer_action, factor) * weight;
    mass += weight;
    if (row.economic_driver) driverMass.set(row.economic_driver, (driverMass.get(row.economic_driver) || 0) + weight);
  }
  const balance = mass ? Number((100 * signed / mass).toFixed(1)) : 0;
  return {
    factor,
    window,
    status: "measured",
    balance,
    direction: balance > 10 ? "positive" : balance < -10 ? "negative" : "mixed",
    observation_count: unique.length,
    source_count: sources.size,
    collection_days: days.size,
    maximum_single_source_share: Number(concentration.toFixed(3)),
    confidence: confidenceLabel(unique),
    dominant_drivers: [...driverMass.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([driver]) => driver)
  };
}

export function aggregateConsumerPulse(observations, { window = "30d", entity = null, category = null } = {}) {
  let rows = observations;
  if (entity) {
    const family = consumerEntityFamily(entity);
    const ids = new Set([family?.entity?.id, family?.parent?.id, ...(family?.children || []).map((child) => child.id)].filter(Boolean));
    rows = rows.filter((row) => ids.has(row.entity_id) || ids.has(row.parent_company_id));
  }
  if (category) rows = rows.filter((row) => row.category === category || row.subcategory === category);
  return Object.keys(FACTOR_ACTIONS).map((factor) => aggregateConsumerFactor(rows, factor, window));
}

export function getConsumerIntentPulse(args = {}) {
  const release = args.release ? releaseById.get(args.release) ?? null : latestRelease;
  if (!release) return { found: false, query: args, available_releases: CONSUMER_INTENT_RELEASES.releases };
  const factor = String(args.factor || "").trim();
  const ticker = String(args.ticker || "").trim();
  const response = structuredClone(release);
  if (factor) response.factor_readings = response.factor_readings.filter((row) => row.factor === factor);
  if (ticker) response.entity_readings = response.entity_readings.filter((row) => key(row.ticker) === key(ticker));
  return response;
}

export function getConsumerIntentEntity(value) {
  const family = consumerEntityFamily(value);
  if (!family) return { found: false, query: value, suggestions: entityRegistry.entities.filter((row) => row.entity_type === "public_company").map((row) => row.ticker) };
  const parentId = family.parent?.id ?? family.entity.id;
  const reading = latestRelease.entity_readings.find((row) => row.entity_id === parentId) ?? null;
  return {
    found: true,
    release_id: latestRelease.release_id,
    as_of: latestRelease.as_of,
    identity: family,
    reading: reading ?? {
      entity_id: parentId,
      company: family.parent?.display_name ?? family.entity.display_name,
      ticker: family.parent?.ticker ?? family.entity.ticker,
      status: "insufficient_evidence",
      windows: { "7d": null, "30d": null, "90d": null },
      factors: [],
      substitutions: [],
      major_reasons: []
    },
    interpretation_boundary: latestRelease.interpretation_boundary
  };
}
