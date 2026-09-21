# Consumer Intent Graph operations

## Production boundary

The Git-versioned release packet is the public source of truth. Collection and model extraction may run elsewhere, but only normalized, quality-controlled observations enter a release. Raw source material must be retained only where access rights and source terms permit.

The foundation release deliberately contains no observations or directional conclusions. It establishes the ontology, entity registry, category hierarchy, publication gates, query layer, schemas, and public interface.

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

## Build a release

Prepare a JSON array conforming to the observation schema, then run:

```bash
node scripts/build-consumer-intent-release.mjs \
  --input path/to/observations.json \
  --as-of 2026-10-01 \
  --release-id consumer-intent-2026-10-01-pilot \
  --model-version extraction-model-version
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
