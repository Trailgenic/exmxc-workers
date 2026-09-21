import { normalizeConsumerObservation } from "./consumer-intent.js";

export function createConsumerSourceAdapter({ id, sourceType, termsStatus, collect }) {
  if (!id || !sourceType || typeof collect !== "function") throw new Error("A source adapter requires id, sourceType, and collect().");
  if (!new Set(["permitted", "licensed", "review_required"]).has(termsStatus)) throw new Error("Source termsStatus must be permitted, licensed, or review_required.");
  return Object.freeze({ id, sourceType, termsStatus, collect });
}

export async function ingestConsumerRecords(adapter, context, extract) {
  if (adapter.termsStatus === "review_required") throw new Error(`Source ${adapter.id} requires access review before collection.`);
  if (typeof extract !== "function") throw new Error("A structured extraction function is required.");
  const rawRecords = await adapter.collect(context);
  if (!Array.isArray(rawRecords)) throw new Error(`Source ${adapter.id} did not return an array.`);
  const accepted = [];
  const rejected = [];
  for (const raw of rawRecords) {
    try {
      const extracted = await extract(raw, { source: adapter.id, source_type: adapter.sourceType });
      const normalized = normalizeConsumerObservation({ ...extracted, source: adapter.id, source_type: adapter.sourceType });
      if (!normalized.success) rejected.push({ source_native_id: raw.source_native_id ?? null, errors: normalized.errors });
      else accepted.push(normalized.observation);
    } catch (error) {
      rejected.push({ source_native_id: raw?.source_native_id ?? null, errors: [String(error?.message || error)] });
    }
  }
  return {
    adapter_id: adapter.id,
    source_type: adapter.sourceType,
    collected_count: rawRecords.length,
    accepted,
    rejected
  };
}

export function parseConsumerExtraction(payload, rawRecord, modelVersion) {
  const value = typeof payload === "string" ? JSON.parse(payload) : payload;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Extractor output must be one structured observation object.");
  return {
    ...value,
    observation_id: value.observation_id || `${rawRecord.source_native_id || "record"}:${value.consumer_action || "unknown"}`,
    timestamp: value.timestamp || rawRecord.timestamp,
    source_url: value.source_url || rawRecord.source_url || null,
    raw_text: rawRecord.raw_text ?? null,
    reference: rawRecord.reference ?? null,
    model_version: modelVersion
  };
}

export const CONSUMER_EXTRACTION_CONTRACT = {
  name: "consumer_intent_observation_v1",
  strict: true,
  instructions: [
    "Return a record only when the text contains a consumer economic behavior or specific intent signal.",
    "Do not infer a purchase, constraint, entity, geography, driver, or substitution that is not supported by the text.",
    "Preserve unknowns as null or unknown rather than guessing.",
    "A substitution requires an identifiable origin and destination; generic comparison is not substitution.",
    "Confidence measures extraction support in the observation, not truth of a company or market thesis."
  ],
  fields: [
    "observation_id", "timestamp", "category", "subcategory", "entity", "ticker",
    "consumer_action", "direction", "economic_driver", "substitute_entity", "time_horizon",
    "intensity", "confidence", "duplicate_cluster_id", "spam_bot_probability", "promotion_probability"
  ]
};
