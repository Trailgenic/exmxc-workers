# exmxc Workers System Map — v2.14

## Runtime topology

### Main Worker

- Config: `wrangler.jsonc`
- Route: `mcp.exmxc.ai/*`
- Entrypoint: `worker.js`
- Format: ES-module Worker (`export default { fetch(request, env) }`)
- Observability: enabled in `wrangler.jsonc`

### Root discovery Worker

- Config: `workers/root-discovery/wrangler.jsonc`
- Entrypoint: `workers/root-discovery/worker.js`
- Status: legacy reference only; not deployed by the main CI workflow
- Canonical discovery: `https://mcp.exmxc.ai/.well-known/mcp.json`

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

### REST/MCP discovery

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
- `/speg/index/v1`
  - Source: frozen RC1 authoring packet under `data/speg_index_v1/releases/`
  - Filters: `query`, `decision`, `membership_state`, `release`
  - Shared deterministic implementation in `lib/speg-index-v1.js` via `ex.speg.index.get`
- `/speg/index/v1/profiles/{stable-slug}`
- `/speg/index/v1/methodology`
  - Source: `data/speg_index_v1/methodology.json`
- `/speg/index/v1/releases`
- `/speg/index/v1/releases/{release-id}`
- `/schemas/speg-index-profile-v1`
  - Source: `schema/speg_index_profile_v1.schema.json`
- `/datasets`
  - Generated from `DATASETS`
- `/datasets/ai_power_index`
  - Source: `data/ai_power_index_dataset_v1.json`; legacy v1 compatibility output
- `/datasets/ai_power_index/schema`
  - Source: `schema/ai_power_index.schema.json`
- `/datasets/four_forces`
  - Source: `data/four_forces_dataset_v1.json`; legacy v1 compatibility output
- `/datasets/ai_power_methodology_v2`
  - Source: `data/ai_power_v2/methodology.json`
- `/datasets/ai_power_profiles_v2`
  - Source: `data/ai_power_v2/releases/2026-09-11-pilot.json`
  - Filters: `query`, `group`, `status`
- `/schemas/ai-power-methodology-v2`
- `/schemas/ai-power-profile-v2`
- `/schemas/ai-power-source-manifest-v2`
- `/datasets/entity_in_a_box_v1`
  - Source: `data/entity_in_a_box_v1.json`
- `/datasets/entity_in_a_box`
  - Compatibility alias
- `/datasets/reality_gap_index`
  - Source: `data/reality_gap_index_v1.json`
- `/datasets/reality_gap_index/schema`
  - Source: `schema/reality_gap_index.schema.json`
- `/reality-gap`
  - Filters: `query`, `classification`, `sort`, `limit`
  - Shared implementation in `lib/queries.js` via `ex.reality_gap.get`
- `/datasets/strategic_consequence_scenarios`
  - Source: `data/strategic_consequence_scenarios_v1.json`
- `/strategic-consequence`
  - Required filter: `scenario`
  - Optional filters: `query`, `limit`
  - Shared deterministic implementation in `lib/queries.js` via `ex.strategic_consequence.get`
- `/schemas/strategic-consequence`
  - Source: `schema/strategic_consequence.schema.json`
- `/analysis/ai_power/top`
  - Shared implementation in `lib/queries.js`
- `/power-lens`
  - Legacy v1 weighted exposure compatibility view
- `/power-lens/v2`
  - Required query: `query` (canonical company name, supported alias, or ticker)
  - Shared evidence-profile implementation in `lib/ai-power-v2.js` via `ex.power_lens.v2.get`
- `/schemas/power-lens`
  - Source: `schema/power_lens.schema.json`
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
- `getSpegIndexV1`
- `getDatasetIndex`
- `getAiPowerIndex`
- `getFourForces`
- `getAiPowerMethodologyV2`
- `getAiPowerProfilesV2`
- `getPowerLensV2`
- `getEntityInABox`
- `getAiPowerTop`
- `getPowerLens`
- `getRealityGap`
- `calculateRealityGapScores`
- `realityGapClassification`
- `getStrategicConsequence`
- `strategicConsequenceClassification`
- `validatePowerLensQuery`
- `validateStrategicConsequenceArgs`
- `runEeiAudit`
- `getIndex`
- `TOOL_HANDLERS`

## Tool inventory

Callable JSON tools are the entries in `DATA_TOOLS`:

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

Content pages are listed separately as `CONTENT_LINKS` and are not exposed as callable MCP tools:

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

Federated registries are listed separately as `FEDERATED_REGISTRIES` and are not exposed as callable MCP tools.

## Trust and operations

- Build metadata is stable: `BUILD.version = 2.14.0`, `BUILD.released = 2026-09-17`.
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
