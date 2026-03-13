# exmxc MCP Infrastructure — Current System Map

## 1) Worker routes currently implemented

### Worker deployments
- `exmxc-workers` (main: `worker.js`) with route pattern: `mcp.exmxc.ai/*`.
- `exmxc-root-discovery` (main: `workers/root-discovery/worker.js`) with route pattern: `exmxc.ai/.well-known/*`.

### Main worker HTTP routes (`mcp.exmxc.ai/*`)
- `/`
- `/.well-known/mcp.json`
- `/speg`
- `/capabilities.json`
- `/health`
- `/.well-known/tool-registry.json`
- `/.well-known/openapi.json`
- `/.well-known/manifest.json`
- `/entities`
- `/schema`
- `/definitions`
- `/index`
- `/.well-known/ai-plugin.json`

### Root discovery worker HTTP routes (`exmxc.ai/.well-known/*`)
- `/.well-known/mcp.json`
- Fallback: redirect to `https://exmxc.ai`.

## 2) Existing MCP endpoints

- MCP discovery:
  - `https://mcp.exmxc.ai/.well-known/mcp.json`
  - `https://exmxc.ai/.well-known/mcp.json` (pointer to MCP host)
- Tool registry: `https://mcp.exmxc.ai/.well-known/tool-registry.json`
- OpenAPI: `https://mcp.exmxc.ai/.well-known/openapi.json`
- Manifest: `https://mcp.exmxc.ai/.well-known/manifest.json`
- AI plugin: `https://mcp.exmxc.ai/.well-known/ai-plugin.json`
- Capabilities: `https://mcp.exmxc.ai/capabilities.json`
- Health: `https://mcp.exmxc.ai/health`

## 3) Existing datasets exposed

### Live dataset endpoints
- Entity dataset: `/entities`
  - Source file: `data/entities.json`
  - Supports filters: `industry`, `entity_type`, `posture`, `capability`
- sPEG index dataset: `/speg`
  - Source file: `data/speg_index.json`
  - Supports filters: `sector`, `scarcity_layer`, `ticker`

### Dataset support endpoints
- `/schema` → `schema/schema.json`
- `/definitions` → `schema/definitions.json`
- `/index` → `index.json`

## 4) OpenAPI routes

Defined in `/.well-known/openapi.json`:
- `/frameworks`
- `/signal-briefs`
- `/lexicon`
- `/entity-clarity-index`
- `/speg-indices`
- `/capital`
- `/doctrine`

## 5) `capabilities.json` contents

### Structure
- `capability_version`
- `entity` metadata
- `mcp` endpoint metadata
- `capabilities[]` tool list
- `trust_signals`
- `classification`
- `last_updated`

### Tools listed
- `ex.framework.get`
- `ex.signal.get`
- `ex.lexicon.get`
- `ex.eci.get`
- `ex.speg.get`
- `ex.speg.index.get`
- `ex.capital.get`
- `ex.doctrine.get`
- `ex.lab.get`
- `ex.about.get`
- `ex.diagnostic.run`
- `ex.search.query`

## 6) `.well-known` discovery endpoints

On `mcp.exmxc.ai`:
- `/.well-known/mcp.json`
- `/.well-known/tool-registry.json`
- `/.well-known/openapi.json`
- `/.well-known/manifest.json`
- `/.well-known/ai-plugin.json`

On `exmxc.ai` (root discovery worker):
- `/.well-known/mcp.json` (points to MCP host and discovery docs)

## 7) Existing schemas or datasets already defined

### Schemas/definitions/index
- `schema/schema.json`: Entity Intelligence dataset field contract
- `schema/definitions.json`: semantic definitions for `posture`, `capability`, `ecc`, `entity_type`
- `index.json`: dataset index pointing to entity schema/definitions/data

### Dataset files
- `data/entities.json`:
  - Hybrid schema+data package (`$defs` + `data.metadata` + `data.entities`)
  - Contains Entity Clarity / ECC-oriented records (`company`, `industry`, `entity_type`, `posture`, `capability`, `ecc`)
- `data/speg_index.json`:
  - sPEG valuation rows with scarcity layer and sector metadata

---

## Structural map

### Workers
- `exmxc-workers` → serves MCP API + datasets
- `exmxc-root-discovery` → serves root `.well-known/mcp.json` pointer

### Routes
- Discovery + MCP metadata: `/`, `/.well-known/*`, `/capabilities.json`, `/health`
- Data APIs: `/entities`, `/speg`
- Schema/index APIs: `/schema`, `/definitions`, `/index`

### Datasets
- Implemented:
  - Entity / ECI-style dataset (`/entities`)
  - sPEG index dataset (`/speg`)
- Not implemented as dedicated endpoints:
  - AI Power Index
  - Scarcity (dedicated dataset endpoint; currently only scarcity fields inside sPEG)
  - Industry Power
  - Strategic Durability
  - Entity Clarity (dedicated route separate from `/entities`)
  - Agent Discovery dataset

### Capabilities
- Declared tool-capability registry exists (`/capabilities.json` + tool registry)
- Tool declarations currently point mostly to `exmxc.ai` content endpoints rather than MCP-native JSON tool execution endpoints

### OpenAPI
- OpenAPI file exists at `/.well-known/openapi.json`
- Paths represent high-level content endpoints only; no explicit dataset API paths (`/entities`, `/speg`) in current OpenAPI document

---

## Missing pieces for requested datasets

### Entity Dataset
- **Status:** Mostly present (`/entities`, schema, definitions, index)
- **Missing pieces:**
  - Add `/entities` to OpenAPI paths
  - Optional: split schema and data into separate files for cleaner contract enforcement

### AI Power Index Dataset
- **Missing:**
  - Dataset file (e.g. `data/ai_power_index.json`)
  - Endpoint (e.g. `/ai-power-index`)
  - Schema + definitions updates
  - Index registration (`index.json` or multi-dataset index)
  - OpenAPI + capabilities/registry references

### Scarcity Dataset
- **Missing:**
  - Dedicated scarcity dataset artifact (currently only `scarcity_layer` embedded in sPEG rows)
  - Dedicated endpoint (e.g. `/scarcity`)
  - Schema/definitions/index + OpenAPI/capabilities wiring

### Industry Power Dataset
- **Missing:**
  - Dataset file + endpoint
  - Field contract (schema/definitions)
  - Discovery + OpenAPI + capabilities/tool registry exposure

### Strategic Durability Dataset
- **Missing:**
  - Dataset file + endpoint
  - Durability metric schema + definitions
  - Discovery + OpenAPI + capabilities/tool registry exposure

### Entity Clarity Dataset
- **Status:** Partially covered by current entity dataset (`ecc`-based records)
- **Missing pieces (if separate productized dataset required):**
  - Dedicated endpoint (e.g. `/entity-clarity`)
  - Dedicated schema/index entry and OpenAPI path
  - Capability/tool mapping for dedicated retrieval action

### Agent Discovery Dataset
- **Missing:**
  - No dedicated dataset currently (only discovery manifests/endpoints)
  - Need dataset model (agents, tool support, protocol metadata, trust signals)
  - Need endpoint + schema/definitions/index + OpenAPI + capability/registry mapping
