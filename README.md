# exmxc Workers

Cloudflare Worker implementation for the `mcp.exmxc.ai` executable intelligence node. The service is both:

1. an agent-discoverable REST/JSON intelligence API, and
2. a spec-compatible MCP JSON-RPC 2.0 server at `POST /mcp`.

The code keeps the ES-module Worker entrypoint (`export default { fetch(request, env) }`) and stores no secrets in source.

## Agent Commerce Intelligence + AI Commerce Signal

The latest AI commerce release is served at `GET /ai-commerce/signal` and through `ex.ai_commerce.signal.get`; the immutable foundation remains available by release ID. It distinguishes shopping research, recommendations, selection, referrals, and delegated checkout. Experience sentiment must refer to using AI for the shopping task. Publication gates prevent thin anecdotal samples from becoming a sentiment reading.

The September 25 foundation and subsequent search pilot contain zero verified shopper episodes and zero agent transaction events. Four sourced Adobe benchmarks are displayed as survey and referral context. A separate Google Trends panel shows a versioned, normalized weekly US search-interest comparison for two explicit AI-shopping terms, with the raw CSV archived and the incomplete week excluded. The previous broad wallet packets and NKE/TJX instrument have been removed from the active tree; legacy API routes return HTTP 410 with a successor URL, and the old Webflow page URLs hand off to the new pages. No paid daily collection is scheduled. See [method and operations](docs/agentic-commerce-signal-design.md).

## AI Power Index — monthly ranked edition

The current ranked index is served at `GET /ai-power/rankings` and exposed to agents through `ex.ai_power.rankings.get`. It covers 50 companies with scores and ranks for 2026, 2027, and 2030. Query `year=2030` to sort that forecast, and `edition=2026-09-18` for the immutable inaugural edition. The ledger is `/ai-power/rankings/editions`; the fixed method is `/ai-power/rankings/methodology`.

GitHub stores dated editions and the locked Four Forces methodology. Webflow presents a complete static table enhanced with year sorting and an edition selector. Run `npm run build:ai-power-rankings` to generate the page code from the same implementation used by the API. See [monthly operations](docs/ai-power-rankings-operations.md). Earlier v1 exposure and v2 pilot material below remains separate historical compatibility output.

## Canonical identity and build

- Entity: `exmxc`
- Domain: `https://exmxc.ai`
- Founder: Mike Ye
- Worker host: `https://mcp.exmxc.ai`
- Build version: `2.16.0`
- Stable build date / `last_updated`: `2026-09-21`

`lib/registry.js` is the single source of truth for entity metadata, build metadata, dataset registrations, callable data tools, content links, and federated registries.

## Discovery endpoints

Canonical MCP discovery is served from `https://mcp.exmxc.ai/.well-known/mcp.json`; the apex `https://exmxc.ai/.well-known/mcp.json` is intentionally not served because the apex is Webflow on a DNS-only record. The transport endpoint is `https://mcp.exmxc.ai/mcp`.

- `GET /` — REST/MCP discovery document
- `GET /.well-known/mcp.json` — MCP discovery pointer
- `GET /capabilities.json` — generated capability inventory
- `GET /.well-known/tool-registry.json` — generated tool registry
- `GET /.well-known/openapi.json` — OpenAPI document with `servers: [{ url: "https://mcp.exmxc.ai" }]`
- `GET /.well-known/manifest.json` — generated manifest
- `GET /.well-known/ai-plugin.json` — plugin manifest pointing at the OpenAPI document
- `GET /webmcp-power-lens.js` — browser-native Power Lens tools for the top-level Webflow page
- `GET /health` — operational health check; uptime is not asserted in the payload and is observed through Cloudflare observability

All JSON responses use shared CORS headers. `OPTIONS` returns `204` with `Access-Control-Allow-Methods: GET, POST, OPTIONS` and `Access-Control-Allow-Headers: content-type, mcp-protocol-version`.

## MCP JSON-RPC transport

`POST /mcp` accepts one JSON-RPC 2.0 request per HTTP request and returns an `application/json` response for synchronous tools. `GET /mcp` returns `405` with `Allow: POST`.

Supported methods:

- `initialize`
- `notifications/initialized`
- `ping`
- `tools/list`
- `tools/call`

Example initialize request:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": { "protocolVersion": "2025-06-18" }
}
```

Example tool call:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "ex.speg.get",
    "arguments": { "ticker": "NVDA" }
  }
}
```

`tools/list`, `/capabilities.json`, and `/.well-known/tool-registry.json` are generated from the same `DATA_TOOLS` registry so tool IDs and counts stay consistent.

## Tool inventory

Callable JSON tools from `DATA_TOOLS`:

- `ex.ai_commerce.signal.get`
- `ex.entities.get`
- `ex.speg.get`
- `ex.speg.index.get`
- `ex.datasets.index.get`
- `ex.ai_power_index.get`
- `ex.four_forces.get`
- `ex.ai_power.profiles.get`
- `ex.power_lens.v2.get`
- `ex.entity_in_a_box.get`
- `ex.power_lens.get`
- `ex.reality_gap.get`
- `ex.strategic_consequence.get`
- `ex.ai_power.analysis.top`
- `ex.eei.audit.run`
- `ex.convergence.latest`
- `ex.convergence.log`

Content links from `CONTENT_LINKS`:

- `ex.ai_commerce.page` — `https://www.exmxc.ai/ai-commerce`
- `ex.ai_commerce.methodology` — `https://www.exmxc.ai/ai-commerce-methodology`
- `ex.speg_index.page` — `https://www.exmxc.ai/speg-index`
- `ex.speg_index.methodology` — `https://www.exmxc.ai/speg-methodology`
- `ex.ai_power.page` — `https://www.exmxc.ai/ai-power-index`
- `ex.ai_power.methodology` — `https://www.exmxc.ai/ai-power-index-methodology`
- `ex.framework.get` — `https://exmxc.ai/frameworks`
- `ex.signal.get` — `https://exmxc.ai/signal-briefs`
- `ex.lexicon.get` — `https://exmxc.ai/lexicon`
- `ex.capital.get` — `https://exmxc.ai/capital`
- `ex.doctrine.get` — `https://exmxc.ai/leadership-doctrine`
- `ex.about.get` — `https://exmxc.ai/about-us`
- `ex.audit.page` — `https://www.exmxc.ai/audit`
- `ex.reality_gap.page` — `https://www.exmxc.ai/reality-gap`
- `ex.strategic_consequence.page` — `https://www.exmxc.ai/strategic-consequence`

## WebMCP Power Lens surface

The Webflow Power Lens page loads `GET /webmcp-power-lens.js` after exposing its
existing search and render workflow through `window.exmxcPowerLens`. Compatible
browsers discover two page-scoped tools:

- `run_exmxc_power_lens` — resolves one v2 pilot company or ticker and renders
  its evidence-backed profile or explicit unknown state.
- `get_exmxc_power_lens_result` — reads the Power Card currently visible on the
  page without changing state.

The browser layer does not create a second scoring model. The Worker remains the
source of truth for the scoped mechanism, four anchored judgments or unknowns,
evidence, confidence, and release metadata. Power Lens v2 produces no composite
score or universal rank. The page tools do not use live market data, place
trades, or provide investment advice.

Verify the browser contract with:

```bash
npm run verify:webmcp
```

## REST data endpoints

Bundled datasets are imported directly into the Worker. Dataset updates require a Worker deploy.

- `GET /ai-commerce/signal` — latest or immutable release, optional `release` ID
- `GET /ai-commerce/methodology`
- `GET /ai-commerce/releases`
- `GET /schemas/ai-commerce-episode-v1`
- `GET /schemas/ai-commerce-release-v1`
- `GET /consumer-intent/*` — retired (HTTP 410, successor URL)

- `GET /entities`
  - Source: `data/entities.json`
  - Filters: `industry`, `entity_type`, `posture`, `capability`
  - Canonical entity-name field: `company`
- `GET /speg`
  - Source: `data/speg_index.json`
  - Filters: `sector`, `scarcity_layer`, `ticker`
- `GET /speg/index/v1`
  - Sources: `data/speg_index_v1/methodology.json` and the immutable RC1 authoring packet under `data/speg_index_v1/releases/`
  - Filters: `query`, `decision`, `membership_state`, `release`
  - Returns ten durable-scarcity profiles with C/S/E/P/D judgments, independent eligibility gates, source provenance, review state, rule sensitivity, and separately nullable valuation links
  - RC1 is a draft research constitution: five include recommendations, five watchlist decisions, zero released members, and no live membership mutation
- `GET /speg/index/v1/profiles/{stable-slug}`
  - Exact issuer profile lookup; unknown issuers return `404`
- `GET /speg/index/v1/methodology`
  - Locked `speg-index-scarcity-v1.0.0` construct, anchors, gates, confidence, evidence, limits, and cadence
- `GET /speg/index/v1/releases`
  - Release ledger with a null latest-published pointer while only RC1 exists as a draft
- `GET /speg/index/v1/releases/{release-id}`
  - Exact immutable release lookup; unknown releases return `404`
- `GET /schemas/speg-index-profile-v1`
  - Source: `schema/speg_index_profile_v1.schema.json`
- `GET /datasets`
  - Generated dataset index
- `GET /datasets/ai_power_index`
  - Source: `data/ai_power_index_dataset_v1.json`; labeled legacy v1 compatibility output
- `GET /datasets/ai_power_index/schema`
  - Source: `schema/ai_power_index.schema.json`
- `GET /datasets/four_forces`
  - Source: `data/four_forces_dataset_v1.json`; labeled legacy v1 compatibility output
- `GET /datasets/ai_power_methodology_v2`
  - Versioned definition, Four Forces domains, ordinal anchors, evidence rules, confidence, and cadence
- `GET /datasets/ai_power_profiles_v2?query=NVDA`
  - 20-company pilot release with scoped profiles, explicit collection coverage, and no universal composite
- `GET /schemas/ai-power-methodology-v2`
- `GET /schemas/ai-power-profile-v2`
- `GET /schemas/ai-power-source-manifest-v2`
- `GET /datasets/entity_in_a_box_v1`
  - Source: `data/entity_in_a_box_v1.json`
- `GET /datasets/entity_in_a_box`
  - Compatibility alias for `/datasets/entity_in_a_box_v1`
- `GET /datasets/reality_gap_index`
  - Source: `data/reality_gap_index_v1.json`
  - Ten-company V1 evidence ledger comparing AI narrative and observed capability
- `GET /datasets/reality_gap_index/schema`
  - Source: `schema/reality_gap_index.schema.json`
- `GET /reality-gap?query=AAPL&sort=gap_ascending`
  - Filters: `query`, `classification`, `sort`, `limit`
  - Returns transparent component scores, classification, confidence, and dated official evidence
- `GET /datasets/strategic_consequence_scenarios`
  - Source: `data/strategic_consequence_scenarios_v1.json`
  - Six canonical counterfactuals with force deltas, scarcity adjustments, causal chains, bottlenecks, assumptions, and validation signals
- `GET /strategic-consequence?scenario=power_binding_constraint&query=NVDA`
  - Required filter: `scenario`; optional filters: `query`, `limit`
  - Returns experimental relative advantage and pressure across the 84-entity legacy v1 exposure universe; it does not use AI Power v2 profiles
- `GET /schemas/strategic-consequence`
  - Source: `schema/strategic_consequence.schema.json`
- `GET /datasets/entity_registry`
  - Stable identifiers and canonical classifications for 745 registered entities
- `GET /datasets/entity_clarity`
  - Longitudinal release ledger
- `GET /datasets/entity_clarity/snapshots/latest`
  - Latest dated ECI observations; 744 of 745 registered entities are observed on 2026-07-30
- `GET /datasets/entity_clarity/changes/latest`
  - Computed change ledger for the 744-entity matched panel
- `GET /datasets/entity_clarity/releases/latest`
  - Release metadata, QA disclosures, summary metrics, and industry aggregates
- `GET /schemas/entity-registry`
- `GET /schemas/eci-observation`
- `GET /schemas/eci-release`
- `GET /schemas/entity-clarity-evidence-v2`
  - Automated pilot contract separating delivery, declared access, five-dimension Entity Clarity, static-content adequacy, model-test status, and legacy diagnostics
- `GET /analysis/ai_power/top?limit=10`
  - Labeled legacy v1 weighted exposure ranking retained for compatibility
- `GET /power-lens?query=NVDA`
  - Labeled legacy v1 compatibility view
- `GET /power-lens/v2?query=NVDA`
  - Resolves a company in the 20-profile pilot and returns its mechanism, four anchored judgments or explicit unknowns, evidence, confidence, and release metadata
  - Never emits an AI Power composite, percentile, or universal rank
- `GET /schemas/power-lens`
  - Legacy v1 response schema
- `GET /schemas/power-lens-v2`
  - Source: `schema/power_lens_v2.schema.json`
- `GET /audit/run?url=https://exmxc.ai`
  - Collects website delivery and declared provider-purpose access evidence for a public HTTPS URL
  - Returns a deterministic five-dimension Entity Clarity v2.1 score when usable static HTML is delivered and labels the prior EEI score as a legacy website diagnostic
  - Leaves failed, restricted, or unsupported collection unscored; no human review is required
  - Reports a separate adequacy flag so thin static or JavaScript application shells can be identified without changing the score
  - Does not report independent model representation unless a separate recorded model test exists
- `GET /schema`
  - Source: `schema/schema.json`
- `GET /definitions`
  - Source: `schema/definitions.json`
- `GET /index`
  - Source: `index.json`, with `total_entities` computed dynamically from the bundled entities length

## Dataset examples

Entity record example using canonical `company`:

```json
{
  "entity_id": "ent_blackrock_...",
  "company": "BlackRock",
  "industry": "Financial",
  "entity_type": "Public Company",
  "posture": "Open",
  "capability": "High",
  "ecc": 86,
  "observed_at": "2026-07-30",
  "methodology_id": "eci-ecc-v1"
}
```

`ECC` means Entity Clarity & Capability. It is interpreted alongside posture and
capability, not as a standalone performance ranking. A Blocked observation is
assigned ECC `0` by definition. The website-audit `EEI` methodology is a separate
measurement family and must not be substituted for ECI/ECC observations.

sPEG record example using the row-level `date` field:

```json
{
  "entity_id": "nvidia",
  "company": "NVIDIA",
  "ticker": "NVDA",
  "sector": "AI Semiconductor",
  "scarcity_layer": "Compute",
  "date": "2026-07-16",
  "price_usd": 207.4,
  "forward_pe": 24.69,
  "forward_eps_growth_pct": 36.9,
  "scarcity_multiplier": 2.5,
  "speg": 0.27,
  "calculation_method": "forward_fiscal_eps_midpoint_proxy"
}
```

The active sPEG snapshot uses disclosed user-supplied July 16 closing prices and forward fiscal EPS ranges. It is a proxy dataset rather than licensed point-in-time NTM consensus data. The prior February snapshot is preserved at `data/speg_index_2026-02-13.json`.

The additive sPEG Index v1 does not overwrite that legacy ratio dataset. It measures durable economic scarcity as an ordinal, evidence-linked selection judgment across Constraint, Substitution resistance, Economic capture, Persistence, and Cost of defense. SDS is summed only when all five dimensions are known; it never changes PEG or an economic multiplier. RC1 contains no security pricing records, PEG values, economic-sPEG values, performance history, weights, buy/sell calls, or return claims.

Legacy AI Power v1 weighted exposure record shape (historical compatibility only):

```json
{
  "entity_name": "NVIDIA",
  "compute_exposure": 10,
  "interface_exposure": 9,
  "alignment_exposure": 7,
  "energy_exposure": 8,
  "ai_power_index": 8.6
}
```

AI Power v2 does not convert this total. Its current staging release uses a 20-company `entity–mechanism–market–time` cohort, four anchored judgments or explicit unknowns, and no composite or universal rank. See `docs/ai-power-v2-operations.md` for the evidence workflow and release gates.

AI Reality Gap record example:

```json
{
  "entity_name": "Apple",
  "ticker": "AAPL",
  "ai_narrative_score": 89,
  "ai_capability_score": 63,
  "reality_gap": -26,
  "classification": "narrative_outrunning_deployment",
  "confidence": "medium",
  "snapshot_date": "2026-07-21"
}
```

Reality Gap uses `AI Capability Score - AI Narrative Score`. Positive values mean observed capability leads narrative; negative values mean narrative leads the evidence currently visible. V1 scores only ten companies from dated official disclosures and never imputes a score outside that ledger.

Strategic Consequence Engine V1 is an experimental legacy model accepting one of six versioned counterfactuals. It remains pinned to the v1 Four Forces weighted exposure scaffold and does not use AI Power v2 judgments. Its relative 0–100 scenario exposure score is conditional on the selected scenario and is not a probability or expected return.

## AI jobs signal endpoint

`GET /api/ai-jobs-signal` remains an experimental ADS endpoint backed by Anthropic for synthetic posting generation. Benchmark and signal responses include:

- `data_provenance: "synthetic-llm-generated"`
- `disclaimer: "Postings are model-generated illustrations for ADS analysis, not scraped or verified labor-market data."`

## Required Worker secret

The ADS signal route requires an Anthropic Worker secret binding:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

Do not place `ANTHROPIC_API_KEY` in `wrangler.jsonc` or source files.

The separate manual AI Power assessment workflow requires `OPENAI_API_KEY` as a GitHub Actions repository secret. Do not place that value in source files, workflow inputs, logs, or configuration files.

## Wrangler configuration

The active deployed Worker config is:

- `wrangler.jsonc` — main `mcp.exmxc.ai/*` Worker with observability enabled

The legacy `workers/root-discovery/wrangler.jsonc` remains in the repo for reference only. Its apex `exmxc.ai/.well-known/*` route is intentionally abandoned because the apex is Webflow on a DNS-only record and canonical discovery is served by `mcp.exmxc.ai`.

## Deployment

Deploys are automatic on every push to `main` through `.github/workflows/deploy.yml`; no manual `wrangler deploy` is required for normal releases. The workflow also supports `workflow_dispatch` for an explicit redeploy.

The deploy job deploys the canonical `exmxc-workers` Worker from `wrangler.jsonc`. The abandoned `exmxc-root-discovery` Worker is not deployed by CI because apex discovery is intentionally not served; canonical discovery lives on `mcp.exmxc.ai`.

After deployment completes, the `verify live` job waits for edge propagation and runs:

```bash
node scripts/live-acceptance.mjs
```

The live acceptance harness checks the production origins, including `POST /mcp`, canonical REST/MCP discovery on `mcp.exmxc.ai`, tool inventory consistency, dataset/schema endpoints, CORS, and health semantics. Apex discovery is probed for information only and never fails CI. The workflow fails if the canonical live result does not pass these checks.

One-time GitHub Actions secret setup is required in repo Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — scoped Cloudflare API token for deploying Workers and routes
- `CLOUDFLARE_ACCOUNT_ID` — `aeb064fbc195ef8f54ebce0f51897a63`

Do not commit the Cloudflare API token or any other secret value to source.

## Registry submission packet

The `registry/` directory contains a generated MCP registry submission packet for external discovery directories. Regenerate it whenever `lib/registry.js` changes:

```bash
node scripts/build-registry-packet.mjs
```

The generator imports the canonical entity, build, transport, and `DATA_TOOLS` definitions from `lib/registry.js`, then rewrites:

- `registry/packet.json`
- `registry/server.json`
- `registry/SUBMISSION.md`

This keeps registry submission metadata aligned with the live MCP tool inventory.

## Repository structure

```text
worker.js                         Main Cloudflare Worker
lib/http.js                       Shared JSON/CORS response helpers
lib/registry.js                   Single source of truth for metadata, datasets, tools, links, federation
lib/queries.js                    Shared REST + MCP query implementations
lib/speg-index-v1.js              Deterministic sPEG Index score, gate, release, filter, and semantic validation engine
lib/ads-classifier.js             ADS classification helper
lib/ads-taxonomy.js               ADS taxonomy definitions
data/*.json                       Bundled datasets
data/speg_index_v1/               Versioned sPEG Index methodology and immutable authoring releases
schema/schema.json                Entity dataset schema with canonical company field
schema/definitions.json           Semantic definitions
schema/ai_power_index.schema.json AI Power Index JSON Schema
schema/power_lens.schema.json     Power Lens response JSON Schema
schema/reality_gap_index.schema.json Reality Gap dataset JSON Schema
schema/strategic_consequence.schema.json Strategic Consequence response JSON Schema
schema/speg_index_profile_v1.schema.json sPEG Index profile-release JSON Schema
index.json                        Static entity dataset index baseline
scripts/live-acceptance.mjs        Live deploy acceptance harness
scripts/build-registry-packet.mjs   Registry packet generator
registry/                           Generated MCP registry submission packet
webflow/power-lens-head.html       Staged Power Lens page head metadata and JSON-LD
webflow/power-lens-footer.html     Staged Power Lens responsive application bundle
webflow/reality-gap-head.html      Staged Reality Gap page metadata and JSON-LD
webflow/reality-gap-footer.html    Staged Reality Gap benchmark explorer
webflow/strategic-consequence-head.html Staged Strategic Consequence page metadata and JSON-LD
webflow/strategic-consequence-footer.html Staged Strategic Consequence responsive application bundle
webflow/speg-index-*.html          Staged sPEG Index hub, profile, and release templates; noindex until release approval
webflow/speg-methodology-*.html    Staged sPEG Index methodology page; noindex until release approval
workers/root-discovery/worker.js  Unused root .well-known MCP pointer Worker reference
```

## MCP modernization notes (v2.7.0)

exmxc exposes a REST/JSON intelligence API plus an MCP server using Streamable HTTP on Cloudflare Workers. Tool and resource inventories are generated from `lib/registry.js`; public REST aliases and bundled dataset payloads are preserved.

### Legacy Power Lens v1 + AI Reality Gap V1

`GET /power-lens?query=...` and `ex.power_lens.get` preserve the historical v1 weighted exposure view and are explicitly labeled legacy. The current evidence-profile surface is `GET /power-lens/v2?query=...` and `ex.power_lens.v2.get`; it returns scoped judgments or unknowns without a composite or universal rank. Reality Gap V1 remains a separate evidence ledger.

### Strategic Consequence Engine V1

`GET /strategic-consequence` and `ex.strategic_consequence.get` share one deterministic implementation. V1 accepts only the six bundled canonical scenarios and performs no live retrieval, free-form scenario generation, hidden company overrides, or missing-evidence imputation. Every entity result discloses its Four Forces contributions and coverage for scarcity and Reality Gap modifiers. Leaderboards express relative conditional structural exposure inside the selected scenario; they are not investment recommendations or return forecasts.

### ADS signal route

`GET /api/ai-jobs-signal` without signal parameters returns the deterministic public benchmark. Paid signal generation uses `POST /api/ai-jobs-signal` and requires `Authorization: Bearer <ADS_SIGNAL_KEY>`. The Cloudflare deployment should add a rate rule on this path as defense in depth.

### Audit route

`/audit/run` and the `ex.eei.audit.run` tool validate targets before contacting the fixed upstream audit service. The paired audit build validates each HTTPS destination and redirect, uses a DNS lookup that rejects private, loopback, link-local, reserved, and mixed public/private answers, and limits redirects, response size, and request time. Deployment configuration should still apply conservative Cloudflare rate limiting to `/audit/run` and audit calls arriving via `/mcp`.

### Structured content compatibility

Successful tool calls keep `content[0].text` as the JSON serialization of the complete handler result. `structuredContent` is only emitted for protocol-valid object results; top-level array results remain text-only to avoid introducing an unapproved wrapper.
