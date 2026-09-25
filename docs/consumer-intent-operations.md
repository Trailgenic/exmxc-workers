# Consumer Intent Graph operations

> **Legacy pilot, paused 2026-09-25.** The broad consumer-wallet collection does not establish whether AI participated in shopping. Its scheduled and push-triggered runs are disabled while the product is redesigned around AI-assisted commerce. Existing foundation and dated audit packets remain available; the workflow can be dispatched manually for troubleshooting. See [Agentic commerce signal design](agentic-commerce-signal-design.md). Do not publish broad wallet factors as evidence of AI shopping adoption.

## Production boundary

The Git-versioned release packet is the public source of truth. Collection and model extraction may run elsewhere, but only normalized, quality-controlled observations enter a release. Raw source material must be retained only where access rights and source terms permit.

The foundation release deliberately contains no observations or directional conclusions. It establishes the ontology, entity registry, category hierarchy, publication gates, query layer, schemas, and public interface. Daily automated collection begins from this foundation; a scheduled run never weakens the publication gates.

## Collection contract

1. Approve the source and record its access basis as `permitted` or `licensed`.
2. Collect stable source identifiers, timestamps, permitted references or excerpts, and source URLs where allowed.
3. Run relevance and spam/duplication checks.
4. Extract one or more structured observation candidates using `CONSUMER_EXTRACTION_CONTRACT`.
5. Normalize candidates with `normalizeConsumerObservation`.
6. Resolve brands and retailers without discarding their public-company parent.
7. Cluster duplicates and coordinated repeats.
8. Review rejection counts, unresolved entities, source concentration, and publication gates.

Adapters with `review_required` access status fail closed. The system does not bypass access controls.

## Legacy public-web collection (manual only)

`.github/workflows/consumer-intent-collect.yml` can be dispatched manually for troubleshooting. Its former daily schedule is paused because its broad consumer-wallet ontology does not measure AI-mediated shopping. It uses the OpenAI Responses API web-search tool to discover recent public, first-person consumer expressions and then runs a separate verification pass against every cited URL. The workflow does not directly scrape source sites.

Deterministic gates reject unsupported URLs, company and retailer pages, non-consumer source types, stale or future timestamps, weak behavioral evidence, unregistered taxonomy values, low-confidence classifications, and likely spam or promotion. A source origin counts only once toward source diversity regardless of its model-assigned source type. At most one accepted observation is retained per URL.

Each run writes an immutable dated packet under `data/consumer_intent_v1/observations/`. If the run yields new accepted observations, the workflow builds a dated pilot release, appends it to `release-archive.json`, validates and commits the new state, deploys the Worker, and runs live acceptance. A zero-acceptance run is still recorded for auditability but does not promote or deploy a release.

Workflow reruns use `--skip-existing`: an existing dated packet is never overwritten, cumulative observations are reconstructed, and a same-day promoted release can be redeployed after a transient deployment failure without invoking the model again.

Preview a run without network access or writes:

```bash
npm run collect:consumer-intent -- --date 2026-09-21 --dry-run
```

The workflow requires the repository `OPENAI_API_KEY` secret. `CONSUMER_INTENT_MODEL` and `CONSUMER_INTENT_REASONING_EFFORT` control the extraction and verification calls.

## Build a release

Prepare a JSON array conforming to the observation schema, then run:

```bash
node scripts/build-consumer-intent-release.mjs \
  --input path/to/observations.json \
  --as-of 2026-10-01 \
  --release-id consumer-intent-2026-10-01-pilot \
  --model-version extraction-model-version \
  --promote true
```

The build is deterministic for the same normalized input. It deduplicates clusters, calculates factor readings independently, emits explicit insufficient-evidence states, and creates 7/30/90-day NKE and TJX lenses.

## Release checklist

- Validate every observation and release against the published schemas.
- Confirm source access status and attribution handling.
- Inspect duplicate, spam, promotion, and unresolved-entity rates.
- Confirm factor gates independently; do not override insufficient evidence for presentation.
- Record methodology and extraction-model versions.
- Add the immutable release to the ledger rather than replacing history.
- Run `npm test`, `npm run test:workers`, `npm run validate:webflow`, and `npm run deploy:dry-run`.
- Publish the Worker before updating the Webflow page code.

## Validation program

Later validation packets should be separate from observational releases and keyed by release ID, outcome series, horizon, and methodology version. Macro, company, and market relationships remain non-causal unless a separate research design supports causality.
