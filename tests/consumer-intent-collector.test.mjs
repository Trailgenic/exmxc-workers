import assert from "node:assert/strict";
import {
  canonicalConsumerSourceUrl,
  collectConsumerIntent,
  consumerSearchSources,
  parseConsumerModelJson,
  validateConsumerCandidate
} from "../lib/consumer-intent-collector.js";

const sourceUrl = "https://community.example/posts/nike-sale?utm_source=test";
const canonicalUrl = "https://community.example/posts/nike-sale";
const payload = {
  output: [
    { type: "web_search_call", action: { sources: [{ type: "url", url: sourceUrl }] } },
    { type: "message", content: [{
      type: "output_text",
      text: JSON.stringify({ observations: [{ source_url: canonicalUrl }] }),
      annotations: [{ type: "url_citation", url: sourceUrl, title: "Consumer post" }]
    }] }
  ]
};

assert.equal(canonicalConsumerSourceUrl(sourceUrl), canonicalUrl);
assert.deepEqual(parseConsumerModelJson(payload), { observations: [{ source_url: canonicalUrl }] });
assert.deepEqual([...consumerSearchSources(payload)], [canonicalUrl]);

const candidate = {
  source_url: canonicalUrl,
  source_title: "Waiting for the sale worked",
  timestamp: "2026-09-20T18:30:00Z",
  source_type: "public_forum",
  raw_text: "I waited for the sale and bought Nike shoes yesterday because the regular price was too high for my budget.",
  category: "athletic-footwear",
  subcategory: null,
  entity: "Nike",
  ticker: "NKE",
  consumer_action: "PURCHASE_COMPLETED",
  direction: "positive",
  economic_driver: "promotion_timing",
  substitute_entity: null,
  time_horizon: "completed",
  intensity: 0.8,
  confidence: 0.9,
  spam_bot_probability: 0.05,
  promotion_probability: 0.05,
  geography: "US"
};
const checked = validateConsumerCandidate(candidate, {
  collectionDate: "2026-09-21",
  model: "fixture-model",
  consultedUrls: new Set([canonicalUrl])
});
assert.equal(checked.accepted, true);
assert.equal(checked.observation.entity_id, "brand-nike");
assert.equal(checked.observation.parent_company_id, "company-nike");
assert.equal(checked.observation.source, "community.example");

const unconsulted = validateConsumerCandidate({ ...candidate, source_url: "https://other.example/post" }, {
  collectionDate: "2026-09-21",
  model: "fixture-model",
  consultedUrls: new Set([canonicalUrl])
});
assert.equal(unconsulted.accepted, false);
assert.ok(unconsulted.reasons.includes("source_not_in_search_evidence"));

const promotional = validateConsumerCandidate({ ...candidate, source_url: "https://nike.com/product" }, {
  collectionDate: "2026-09-21",
  model: "fixture-model",
  consultedUrls: new Set(["https://nike.com/product"])
});
assert.equal(promotional.accepted, false);
assert.ok(promotional.reasons.includes("source_host_excluded"));

function modelResponse(text, urls = []) {
  return {
    output: [
      { type: "web_search_call", action: { sources: urls.map((url) => ({ type: "url", url })) } },
      { type: "message", content: [{ type: "output_text", text, annotations: [] }] }
    ]
  };
}

let requestCount = 0;
const fakeFetch = async (_url, init) => {
  requestCount += 1;
  const request = JSON.parse(init.body);
  const prompt = request.input[0].content[0].text;
  let body;
  if (prompt.startsWith("Independently verify")) {
    body = modelResponse(JSON.stringify({
      verifications: [{ candidate_id: "athletic-footwear-wallet-1", verified: true, reason: "Passage verified." }]
    }), [canonicalUrl]);
  } else if (prompt.includes("Nike, HOKA, On, or lululemon")) {
    body = modelResponse(JSON.stringify({ observations: [candidate] }), [canonicalUrl]);
  } else {
    body = modelResponse(JSON.stringify({ observations: [] }));
  }
  return { ok: true, status: 200, json: async () => body };
};

const collected = await collectConsumerIntent({
  collectionDate: "2026-09-21",
  model: "fixture-model",
  apiKey: "fixture-key",
  fetchImpl: fakeFetch
});
assert.equal(requestCount, 4);
assert.equal(collected.accepted.length, 1);
assert.equal(collected.accepted[0].source_url, canonicalUrl);
assert.equal(collected.runs[0].accepted, 1);
assert.equal(collected.rejected_summary.count, 0);

console.log("consumer intent collector tests passed");
