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
- Build version: `2.0.0`
- Stable build date / `last_updated`: `2026-06-05`

`lib/registry.js` is the single source of truth for entity metadata, build metadata, dataset registrations, callable data tools, content links, and federated registries.

## Discovery endpoints

- `GET /` — REST/WebMCP discovery document
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
- `GET /analysis/ai_power/top?limit=10`
  - Top AI Power Index records sorted by `ai_power_index`
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
  "date": "2026-02-13",
  "price_usd": 182.78,
  "speg": 0.63
}
```

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

There is exactly one Wrangler config per worker:

- `wrangler.jsonc` — main `mcp.exmxc.ai/*` Worker with observability enabled
- `workers/root-discovery/wrangler.jsonc` — root discovery Worker for `exmxc.ai/.well-known/*`

## Deployment

Deploys are automatic on every push to `main` through `.github/workflows/deploy.yml`; no manual `wrangler deploy` is required for normal releases. The workflow also supports `workflow_dispatch` for an explicit redeploy.

The deploy job uses a matrix to deploy both Cloudflare Workers from their own Wrangler config directories:

- `exmxc-workers` from the repository root (`.`)
- `exmxc-root-discovery` from `workers/root-discovery`

After both deploy attempts complete, the `verify live` job waits for edge propagation and runs:

```bash
node scripts/live-acceptance.mjs
```

The live acceptance harness checks the production origins, including `POST /mcp`, REST discovery, tool inventory consistency, dataset/schema endpoints, CORS, health semantics, and the apex `https://exmxc.ai/.well-known/mcp.json` pointer. The workflow fails if the deployed live result does not pass these checks.

One-time GitHub Actions secret setup is required in repo Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — scoped Cloudflare API token for deploying Workers and routes
- `CLOUDFLARE_ACCOUNT_ID` — `aeb064fbc195ef8f54ebce0f51897a63`

Do not commit the Cloudflare API token or any other secret value to source.

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
index.json                        Static entity dataset index baseline
workers/root-discovery/worker.js  Root .well-known MCP pointer Worker
```
