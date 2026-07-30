# exmxc Workers

Cloudflare Worker implementation for the `mcp.exmxc.ai` executable intelligence node. The service is both:

1. an agent-discoverable REST/JSON intelligence API, and
2. a spec-compatible MCP JSON-RPC 2.0 server at `POST /mcp`.

The code keeps the ES-module Worker entrypoint (`export default { fetch(request, env) }`) and stores no secrets in source.

## Canonical identity and build

- Entity: `exmxc`
- Domain: `https://exmxc.ai`
- Founder: Mike Ye
- Worker host: `https://mcp.exmxc.ai`
- Build version: `2.7.0`
- Stable build date / `last_updated`: `2026-07-29`

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

- `ex.entities.get`
- `ex.speg.get`
- `ex.datasets.index.get`
- `ex.ai_power_index.get`
- `ex.four_forces.get`
- `ex.entity_in_a_box.get`
- `ex.power_lens.get`
- `ex.reality_gap.get`
- `ex.strategic_consequence.get`
- `ex.ai_power.analysis.top`
- `ex.eei.audit.run`
- `ex.convergence.latest`
- `ex.convergence.log`

Content links from `CONTENT_LINKS`:

- `ex.framework.get` — `https://exmxc.ai/frameworks`
- `ex.signal.get` — `https://exmxc.ai/signal-briefs`
- `ex.lexicon.get` — `https://exmxc.ai/lexicon`
- `ex.capital.get` — `https://exmxc.ai/capital`
- `ex.doctrine.get` — `https://exmxc.ai/leadership-doctrine`
- `ex.about.get` — `https://exmxc.ai/about-us`
- `ex.audit.page` — `https://www.exmxc.ai/audit`
- `ex.reality_gap.page` — `https://www.exmxc.ai/reality-gap`
- `ex.strategic_consequence.page` — `https://www.exmxc.ai/strategic-consequence`

## REST data endpoints

Bundled datasets are imported directly into the Worker. Dataset updates require a Worker deploy.

- `GET /entities`
  - Source: `data/entities.json`
  - Filters: `industry`, `entity_type`, `posture`, `capability`
  - Canonical entity-name field: `company`
- `GET /speg`
  - Source: `data/speg_index.json`
  - Filters: `sector`, `scarcity_layer`, `ticker`
- `GET /datasets`
  - Generated dataset index
- `GET /datasets/ai_power_index`
  - Source: `data/ai_power_index_dataset_v1.json`
- `GET /datasets/ai_power_index/schema`
  - Source: `schema/ai_power_index.schema.json`
- `GET /datasets/four_forces`
  - Source: `data/four_forces_dataset_v1.json`
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
  - Returns deterministic relative advantage and pressure across the 84-entity AI Power universe, a company-specific result when requested, second-order consequences, bottlenecks, assumptions, and confirming or invalidating signals
- `GET /schemas/strategic-consequence`
  - Source: `schema/strategic_consequence.schema.json`
- `GET /analysis/ai_power/top?limit=10`
  - Top AI Power Index records sorted by `ai_power_index`
- `GET /power-lens?query=NVDA`
  - Resolves a supported company name, alias, or ticker against the bundled 84-entity AI Power universe
  - Returns a deterministic Power Card with AI Power Index rank, Four Forces exposure, available Entity Clarity, sPEG, and AI Reality Gap evidence, explicit coverage gaps, and provenance
- `GET /schemas/power-lens`
  - Source: `schema/power_lens.schema.json`
- `GET /audit/run?url=https://exmxc.ai`
  - Live Entity Engineering Index audit for a public URL
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
  "company": "BlackRock",
  "industry": "Financial",
  "entity_type": "Public Company",
  "posture": "Open",
  "capability": "High",
  "ecc": 86
}
```

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

AI Power Index record shape:

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

Strategic Consequence Engine V1 accepts one of six versioned counterfactuals: inference-cost collapse, power as the binding constraint, frontier-model commoditization, agent interface control, tighter advanced-AI export controls, or capability-gap consolidation. It computes a raw structural-impact score from Four Forces exposure, a matched sPEG scarcity-layer adjustment when available, and a bounded Reality Gap modifier when available. Raw scores are min-max normalized within the complete bundled universe to produce a relative 0–100 scenario advantage score. The score is conditional on the selected scenario and is not a probability or expected return.

## AI jobs signal endpoint

`GET /api/ai-jobs-signal` remains an experimental ADS endpoint backed by Anthropic for synthetic posting generation. Benchmark and signal responses include:

- `data_provenance: "synthetic-llm-generated"`
- `disclaimer: "Postings are model-generated illustrations for ADS analysis, not scraped or verified labor-market data."`

## Required Worker secret

The ADS signal route requires an Anthropic Worker secret binding:

```bash
wrangler secret put ANTHROPIC_API_KEY
```

Do not place `ANTHROPIC_API_KEY` in `wrangler.jsonc`, source files, or documentation beyond the binding name.

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
lib/ads-classifier.js             ADS classification helper
lib/ads-taxonomy.js               ADS taxonomy definitions
data/*.json                       Bundled datasets
schema/schema.json                Entity dataset schema with canonical company field
schema/definitions.json           Semantic definitions
schema/ai_power_index.schema.json AI Power Index JSON Schema
schema/power_lens.schema.json     Power Lens response JSON Schema
schema/reality_gap_index.schema.json Reality Gap dataset JSON Schema
schema/strategic_consequence.schema.json Strategic Consequence response JSON Schema
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
workers/root-discovery/worker.js  Unused root .well-known MCP pointer Worker reference
```

## MCP modernization notes (v2.7.0)

exmxc exposes a REST/JSON intelligence API plus an MCP server using Streamable HTTP on Cloudflare Workers. Tool and resource inventories are generated from `lib/registry.js`; public REST aliases and bundled dataset payloads are preserved.

### Power Lens + AI Reality Gap V1

`GET /power-lens?query=...` and `ex.power_lens.get` share one deterministic implementation. Power Lens resolves only the bundled AI Power universe and never invents a score for an unsupported entity. Reality Gap V1 activates claim-to-capability evidence for ten companies; all other Power Lens results remain explicitly `not_scored`. `GET /reality-gap` and `ex.reality_gap.get` expose the benchmark, filters, weights, five-point scoring anchors, rounding policy, classifications, confidence policy, and dated official-source evidence.

### Strategic Consequence Engine V1

`GET /strategic-consequence` and `ex.strategic_consequence.get` share one deterministic implementation. V1 accepts only the six bundled canonical scenarios and performs no live retrieval, free-form scenario generation, hidden company overrides, or missing-evidence imputation. Every entity result discloses its Four Forces contributions and coverage for scarcity and Reality Gap modifiers. Leaderboards express relative conditional structural exposure inside the selected scenario; they are not investment recommendations or return forecasts.

### ADS signal route

`GET /api/ai-jobs-signal` without signal parameters returns the deterministic public benchmark. Paid signal generation uses `POST /api/ai-jobs-signal` and requires `Authorization: Bearer <ADS_SIGNAL_KEY>`. The Cloudflare deployment should add a rate rule on this path as defense in depth.

### Audit route

`/audit/run` and the `ex.eei.audit.run` tool remain public but validate targets before contacting the upstream audit service. The upstream service at `exmxc-audit.vercel.app` must independently enforce DNS-resolution and redirect checks against private, loopback, link-local, and reserved ranges; that external security dependency is not satisfied by this repository alone. Conservative Cloudflare rate limiting should be applied to `/audit/run` and audit calls arriving via `/mcp` as deployment configuration.

### Structured content compatibility

Successful tool calls keep `content[0].text` as the JSON serialization of the complete handler result. `structuredContent` is only emitted for protocol-valid object results; top-level array results remain text-only to avoid introducing an unapproved wrapper.
