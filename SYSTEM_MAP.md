# exmxc Workers System Map — v2.0

## Runtime topology

### Main Worker

- Config: `wrangler.jsonc`
- Route: `mcp.exmxc.ai/*`
- Entrypoint: `worker.js`
- Format: ES-module Worker (`export default { fetch(request, env) }`)
- Observability: enabled in `wrangler.jsonc`

### Root discovery Worker

- Config: `workers/root-discovery/wrangler.jsonc`
- Route: `exmxc.ai/.well-known/*`
- Entrypoint: `workers/root-discovery/worker.js`
- Purpose: serve `https://exmxc.ai/.well-known/mcp.json` as a pointer to the MCP host and transport.

## Source of truth

`lib/registry.js` exports canonical metadata:

- `ENTITY`
- `BUILD`
- `MCP_ORIGIN`
- `MCP_TRANSPORT`
- `DATASETS`
- `DATA_TOOLS`
- `CONTENT_LINKS`
- `FEDERATED_REGISTRIES`

The following surfaces are generated from these constants rather than hand-maintained duplicate lists:

- `GET /capabilities.json`
- `GET /.well-known/tool-registry.json`
- `GET /.well-known/openapi.json`
- `GET /.well-known/manifest.json`
- MCP `tools/list`
- `GET /datasets`

## Transport routes

### REST/WebMCP discovery

- `GET /`
- `GET /.well-known/mcp.json`
- `GET /capabilities.json`
- `GET /.well-known/tool-registry.json`
- `GET /.well-known/openapi.json`
- `GET /.well-known/manifest.json`
- `GET /.well-known/ai-plugin.json`
- `GET /health`

### MCP JSON-RPC 2.0

- `POST /mcp`
  - `initialize`
  - `notifications/initialized`
  - `ping`
  - `tools/list`
  - `tools/call`
- `GET /mcp` returns `405` with `Allow: POST`.

## Dataset routes

All local datasets are bundled with JSON imports; there are no runtime fetches to GitHub raw URLs for local data.

- `/entities`
  - Source: `data/entities.json`
  - Filters: `industry`, `entity_type`, `posture`, `capability`
  - Canonical entity-name field: `company`
- `/speg`
  - Source: `data/speg_index.json`
  - Filters: `sector`, `scarcity_layer`, `ticker`
- `/datasets`
  - Generated from `DATASETS`
- `/datasets/ai_power_index`
  - Source: `data/ai_power_index_dataset_v1.json`
- `/datasets/ai_power_index/schema`
  - Source: `schema/ai_power_index.schema.json`
- `/datasets/four_forces`
  - Source: `data/four_forces_dataset_v1.json`
- `/datasets/entity_in_a_box_v1`
  - Source: `data/entity_in_a_box_v1.json`
- `/datasets/entity_in_a_box`
  - Compatibility alias
- `/analysis/ai_power/top`
  - Shared implementation in `lib/queries.js`
- `/audit/run`
  - Shared implementation in `lib/queries.js` via `ex.eei.audit.run`
- `/schema`
  - Source: `schema/schema.json`
- `/definitions`
  - Source: `schema/definitions.json`
- `/index`
  - Source: `index.json`, with `total_entities` computed from bundled `data/entities.json`

## Shared query implementation

`lib/queries.js` owns dataset and analysis logic used by both REST handlers and MCP `tools/call`:

- `getEntities`
- `getSpeg`
- `getDatasetIndex`
- `getAiPowerIndex`
- `getFourForces`
- `getEntityInABox`
- `getAiPowerTop`
- `runEeiAudit`
- `getIndex`
- `TOOL_HANDLERS`

## Tool inventory

Callable JSON tools are the entries in `DATA_TOOLS`:

- `ex.entities.get`
- `ex.speg.get`
- `ex.datasets.index.get`
- `ex.ai_power_index.get`
- `ex.four_forces.get`
- `ex.entity_in_a_box.get`
- `ex.ai_power.analysis.top`
- `ex.eei.audit.run`

Content pages are listed separately as `CONTENT_LINKS` and are not exposed as callable MCP tools:

- `ex.framework.get` — `https://exmxc.ai/frameworks`
- `ex.signal.get` — `https://exmxc.ai/signal-briefs`
- `ex.lexicon.get` — `https://exmxc.ai/lexicon`
- `ex.capital.get` — `https://exmxc.ai/capital`
- `ex.doctrine.get` — `https://exmxc.ai/leadership-doctrine`
- `ex.about.get` — `https://exmxc.ai/about-us`
- `ex.audit.page` — `https://www.exmxc.ai/audit`

Federated registries are listed separately as `FEDERATED_REGISTRIES` and are not exposed as callable MCP tools.

## Trust and operations

- Build metadata is stable: `BUILD.version = 2.1.0`, `BUILD.released = 2026-06-10`.
- Discovery, capabilities, registry, manifest, and dataset index `last_updated` values use `BUILD.released`.
- `/health` uses `last_checked: new Date().toISOString()` because it is a live check time.
- `/health` does not assert a hardcoded uptime; Cloudflare observability is the source for uptime.
- Shared CORS headers are applied to JSON, text, MCP, and OPTIONS responses.
- `ANTHROPIC_API_KEY` is a Worker secret binding only.

## OpenAPI

`GET /.well-known/openapi.json` uses:

```json
{
  "servers": [{ "url": "https://mcp.exmxc.ai" }]
}
```

It documents REST dataset routes and `POST /mcp`.
