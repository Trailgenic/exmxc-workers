# AI Power Index v2.0 Pilot Operations

## Release boundary

The v2 pilot is an evidence-backed profile system, not a continuation of the v1 weighted exposure ranking. The staging release contains 20 declared research scopes and deliberately no company judgments until evidence collection succeeds. The legacy v1 data, Power Lens v1, and Strategic Consequence Engine remain available only as labeled compatibility surfaces.

The public unit is `entity–mechanism–market–time`. A profile may publish four anchored ordinal judgments—Control, Substitution constraint, Realized leverage, and Durability—or explicit unknowns. No code path may sum, average, normalize, percentile-rank, or convert those judgments into a universal score.

## Automated assessment flow

1. Select one pilot entity and prepare a source manifest conforming to `schema/ai_power_source_manifest_v2.schema.json`.
2. Run the dry-run command. It validates the entity and reports the fixed document and model-call budget without network access or repository writes.
3. Run the source snapshot preflight. It retrieves every declared document once without invoking a model, records delivery failures, requires at least two distinct delivered origins for each entity before cohort spending is authorized, and writes an immutable run-scoped source packet for both repeat attempts.
4. Run evidence collection with an explicit `AI_POWER_MODEL`, `AI_POWER_REASONING_EFFORT`, and `OPENAI_API_KEY`. The pilot defaults to `gpt-5.6-luna` with Medium reasoning for cost-efficient bounded extraction and verification. The pipeline uses OpenAI's Responses API with storage disabled. Remote source text is treated as untrusted data. Collection accepts only credential-free public HTTPS, follows at most five revalidated redirects, rejects private-address hosts, caps each response at 2 MB, and retains at most 32,000 normalized characters.
5. The first model call extracts bounded claims from the collected packet. The second independently verifies entity, scope, dates, exact extracts, and contradictions.
6. Deterministic assembly accepts only verified exact-source extracts. A grade requires Moderate or High confidence, a canonical methodology anchor, supporting evidence, at least one current claim, two distinct evidentiary origins across the graded profile, and at least one primary source. If a proposed grade misses a profile-wide gate, the assembler preserves verified contextual evidence but replaces the grade with `unknown`.
7. Single-entity mode supports development and diagnosis. The GitHub Actions workflow defaults to a two-entity ASML and Microsoft canary before the full cohort is enabled. A committed change to `data/ai_power_v2/canary-trigger.json` records and launches an explicitly authorized canary; ordinary pushes do not invoke the model. Cohort mode reads all 20 manifests and records an automatic abstention when collection or model verification fails for one entity instead of aborting the cohort.
8. A cohort run produces two independent candidate attempts against the same immutable source snapshots, then reconciles them conservatively. Evidence survives only when both attempts retain the same exact passage from the same source snapshot. The two extracts may differ only by surrounding passage boundaries when the shorter verbatim passage is sufficiently substantive and fully contained in the longer passage. A grade survives only when both attempts select the same anchor and the repeated evidence passes the ordinary anchor-support, freshness, source-diversity, and primary-evidence gates. Disagreement becomes `unknown`; model agreement is a repeatability control, not factual corroboration.
9. The commands emit candidate releases and per-pass token usage to standard output and do not alter the repository. Applying or publishing a consensus candidate is a separate owner-controlled release action.
10. The dedicated `AI Power Cohort Assessment` workflow is the production research runner. It is pinned to `gpt-5.6-luna` with Medium reasoning, captures and validates one no-model source snapshot before any API call, runs exactly two cohort attempts against that snapshot, produces conservative consensus, and uploads the snapshot and candidate artifacts without writing to the repository or public API. It runs only when `data/ai_power_v2/cohort-trigger.json` changes on `main`, or through an explicit manual dispatch.

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
npm run check:ai-power-sources -- --manifest-dir data/ai_power_v2/manifests
AI_POWER_MODEL=gpt-5.6-luna AI_POWER_REASONING_EFFORT=medium OPENAI_API_KEY=<secret> npm run assess:ai-power -- --entity company-nvidia --manifest ./source-manifest.json > candidate.json
node scripts/snapshot-ai-power-sources.mjs --manifest-dir ./manifests --output-dir ./source-snapshots > source-preflight.json
AI_POWER_MODEL=gpt-5.6-luna AI_POWER_REASONING_EFFORT=medium OPENAI_API_KEY=<secret> npm run assess:ai-power -- --all --manifest-dir ./manifests --documents-dir ./source-snapshots > cohort-attempt-a.json
AI_POWER_MODEL=gpt-5.6-luna AI_POWER_REASONING_EFFORT=medium OPENAI_API_KEY=<secret> npm run assess:ai-power -- --all --manifest-dir ./manifests --documents-dir ./source-snapshots > cohort-attempt-b.json
npm run reconcile:ai-power -- cohort-attempt-a.json cohort-attempt-b.json > cohort-consensus.json
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
