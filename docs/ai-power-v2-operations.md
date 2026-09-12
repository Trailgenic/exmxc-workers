# AI Power Index v2.0 Pilot Operations

## Release boundary

The v2 pilot is an evidence-backed profile system, not a continuation of the v1 weighted exposure ranking. The staging release contains 20 declared research scopes and deliberately no company judgments until evidence collection succeeds. The legacy v1 data, Power Lens v1, and Strategic Consequence Engine remain available only as labeled compatibility surfaces.

The public unit is `entity–mechanism–market–time`. A profile may publish four anchored ordinal judgments—Control, Substitution constraint, Realized leverage, and Durability—or explicit unknowns. No code path may sum, average, normalize, percentile-rank, or convert those judgments into a universal score.

## Automated assessment flow

1. Select one pilot entity and prepare a source manifest conforming to `schema/ai_power_source_manifest_v2.schema.json`.
2. Run the dry-run command. It validates the entity and reports the fixed document and model-call budget without network access or repository writes.
3. Run evidence collection with an explicit `AI_POWER_MODEL`, `AI_POWER_REASONING_EFFORT`, and `OPENAI_API_KEY`. The pilot defaults to `gpt-5.6-luna` with Medium reasoning for cost-efficient bounded extraction and verification. The pipeline uses OpenAI's Responses API with storage disabled. Remote source text is treated as untrusted data. Collection accepts only credential-free public HTTPS, follows at most five revalidated redirects, rejects private-address hosts, caps each response at 2 MB, and retains at most 32,000 normalized characters.
4. The first model call extracts bounded claims from the collected packet. The second independently verifies entity, scope, dates, exact extracts, and contradictions.
5. Deterministic assembly accepts only verified exact-source extracts. A grade requires Moderate or High confidence, a canonical methodology anchor, supporting evidence, at least one current claim, two distinct evidentiary origins across the graded profile, and at least one primary source.
6. Single-entity mode supports development and diagnosis. The GitHub Actions workflow defaults to a two-entity ASML and Microsoft canary before the full cohort is enabled. A committed change to `data/ai_power_v2/canary-trigger.json` records and launches an explicitly authorized canary; ordinary pushes do not invoke the model. Cohort mode reads all 20 manifests, accumulates every result into one candidate release, and records an automatic abstention when collection or model verification fails for one entity instead of aborting the cohort.
7. The command emits a candidate release and per-pass token usage to standard output and does not alter the repository. Applying or publishing a candidate is a separate owner-controlled release action.

Example manifest:

```json
{
  "entity_id": "company-nvidia",
  "sources": [
    {
      "id": "issuer-filing",
      "url": "https://example.com/issuer-filing",
      "publisher": "Example issuer",
      "source_type": "filing",
      "document_title": "Annual filing",
      "published_at": "2026-09-01T00:00:00Z",
      "origin_id": "issuer-filing-2026"
    },
    {
      "id": "counterparty-disclosure",
      "url": "https://example.org/counterparty-disclosure",
      "publisher": "Example counterparty",
      "source_type": "counterparty_statement",
      "document_title": "Counterparty disclosure",
      "published_at": "2026-09-02T00:00:00Z",
      "origin_id": "counterparty-disclosure-2026"
    }
  ]
}
```

```bash
npm run assess:ai-power -- --entity company-nvidia --manifest ./source-manifest.json --dry-run
AI_POWER_MODEL=gpt-5.6-luna AI_POWER_REASONING_EFFORT=medium OPENAI_API_KEY=<secret> npm run assess:ai-power -- --entity company-nvidia --manifest ./source-manifest.json > candidate.json
AI_POWER_MODEL=gpt-5.6-luna AI_POWER_REASONING_EFFORT=medium OPENAI_API_KEY=<secret> npm run assess:ai-power -- --all --manifest-dir ./manifests > cohort-candidate.json
```

Cohort manifest filenames must equal the stable entity id plus `.json`, for example `company-nvidia.json` and `company-microsoft.json`.

## Publication gates

A release cannot be marked `published` unless all 20 pilot profiles have an attempted collection, release timestamps are present, JSON Schema validation passes, and semantic validation passes. An attempted entity may still publish as `insufficient_evidence`; abstention is valid output. The gates do not require human row review.

The semantic validator also enforces:

- exact criterion membership and canonical anchor labels;
- unknown rather than zero when support is absent;
- Limited confidence only with an unknown grade;
- deterministic assessment status, prospective status, and summary state;
- verified entity-matched, scope-matched, date-checked evidence;
- current support for every graded criterion;
- primary-source and distinct-origin minimums;
- source and follow-up budgets; and
- no composite, rank, percentile, or weighted-contribution fields in v2 artifacts.

## Cadence and versioning

- Monthly: check declared sources and material events for changes.
- Quarterly: refresh every pilot profile and issue a new immutable release.
- Event-driven: add a verified material-event note after the standard evidence gates pass.
- After two quarterly releases: review calibration and evidence failure patterns; thereafter review methodology annually unless a material defect requires a versioned correction.

Framework, methodology, schema, pipeline, model, evidence cutoff, assessment time, publication time, and release identifiers are recorded separately. Retrieval time is never substituted for observation time. Corrections create a new release or explicit change-log entry rather than silently rewriting published history.

## Verification

Run the complete local gate before any deployment:

```bash
npm run validate:ai-power
npm test
npm run test:workers
npm run verify:webmcp
npm run validate:webflow
npm run lint
npm run registry:check
npm run deploy:dry-run
```

Deployment and Webflow publication are intentionally outside the assessment command and require a separate explicit release decision.
