import entities from "../data/entities.json" with { type: "json" };
import speg from "../data/speg_index.json" with { type: "json" };
import aiPowerIndex from "../data/ai_power_index_dataset_v1.json" with { type: "json" };
import fourForces from "../data/four_forces_dataset_v1.json" with { type: "json" };
import entityInABox from "../data/entity_in_a_box_v1.json" with { type: "json" };
import convergenceLog from "../data/convergence_log_v1.json" with { type: "json" };
import powerLensAliases from "../data/power_lens_aliases_v1.json" with { type: "json" };
import entitySchema from "../schema/schema.json" with { type: "json" };
import definitions from "../schema/definitions.json" with { type: "json" };
import index from "../index.json" with { type: "json" };
import aiPowerSchema from "../schema/ai_power_index.schema.json" with { type: "json" };
import powerLensSchema from "../schema/power_lens.schema.json" with { type: "json" };

export const ENTITY = {
  name: "exmxc",
  domain: "https://exmxc.ai",
  founder: "Mike Ye",
  description:
    "Human-led intelligence institution decoding AI power, entity clarity, institutional positioning, strategic doctrine, and Applied Capital Architecture."
};

export const BUILD = { version: "2.4.0", released: "2026-07-18" };
export const MCP_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18"];
export const MCP_TRANSPORT = "https://mcp.exmxc.ai/mcp";
export const MCP_ORIGIN = "https://mcp.exmxc.ai";

export const BUNDLED_SCHEMA = entitySchema;
export const BUNDLED_DEFINITIONS = definitions;
export const BUNDLED_INDEX = index;
export const POWER_LENS_ALIASES = powerLensAliases;

export const DATASETS = {
  entities: {
    id: "entities",
    route: "/entities",
    displayName: "Entity Intelligence Dataset",
    description:
      "Institutional entity intelligence dataset including industry, entity_type, posture, capability, and ECC scoring.",
    category: "dataset",
    data: entities,
    schemaRoute: "/schema",
    schema: entitySchema
  },
  speg: {
    id: "speg",
    route: "/speg",
    displayName: "sPEG Valuation Dataset",
    description:
      "Scarcity-adjusted PEG valuation dataset covering AI infrastructure companies.",
    category: "dataset",
    data: speg
  },
  ai_power_index: {
    id: "ai_power_index",
    route: "/datasets/ai_power_index",
    displayName: "AI Power Index",
    description:
      "Global AI ecosystem ranking dataset measuring compute, interface, alignment, and energy influence.",
    category: "dataset",
    data: aiPowerIndex,
    schemaRoute: "/datasets/ai_power_index/schema",
    schema: aiPowerSchema
  },
  four_forces: {
    id: "four_forces",
    route: "/datasets/four_forces",
    displayName: "Four Forces Exposure Dataset",
    description:
      "Four Forces exposure scaffold for AI Power universe entities across compute, interface, alignment, and energy.",
    category: "dataset",
    data: fourForces
  },
  entity_in_a_box: {
    id: "entity_in_a_box",
    route: "/datasets/entity_in_a_box_v1",
    displayName: "Entity in a Box Ontology Dataset",
    description:
      "System-level ontology dataset defining AI-era entity structure across ontology, dataset, schema, MCP endpoint, and interpretation layers.",
    category: "ontology",
    data: entityInABox
  },
  convergence_monitor: {
    id: "convergence_monitor",
    route: "/datasets/convergence_monitor",
    displayName: "AI Infrastructure Convergence Monitor",
    description:
      "Weekly longitudinal record of the AI Infrastructure Convergence Framework — six independent exit signals read against threshold and time-stamped. Derived reference layer; not investment advice.",
    category: "monitor",
    data: convergenceLog
  }
};

const emptySchema = { type: "object", properties: {}, additionalProperties: false };
const limitSchema = {
  type: "integer",
  minimum: 1,
  maximum: 100,
  description: "Maximum number of records to return."
};

export const DATA_TOOLS = [
  {
    id: "ex.entities.get",
    title: "Get Entity Intelligence Records",
    description: DATASETS.entities.description,
    route: DATASETS.entities.route,
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        entity_type: { type: "string" },
        posture: { type: "string" },
        capability: { type: "string" }
      },
      additionalProperties: false
    },
    openApiParameters: ["industry", "entity_type", "posture", "capability"]
  },
  {
    id: "ex.speg.get",
    title: "Get sPEG Valuation Records",
    description: DATASETS.speg.description,
    route: DATASETS.speg.route,
    inputSchema: {
      type: "object",
      properties: {
        sector: { type: "string" },
        scarcity_layer: { type: "string" },
        ticker: { type: "string" }
      },
      additionalProperties: false
    },
    openApiParameters: ["sector", "scarcity_layer", "ticker"]
  },
  {
    id: "ex.datasets.index.get",
    title: "Get Dataset Index",
    description: "Retrieve index of all bundled datasets available through the exmxc MCP server.",
    route: "/datasets",
    inputSchema: emptySchema
  },
  {
    id: "ex.ai_power_index.get",
    title: "Get AI Power Index Dataset",
    description: DATASETS.ai_power_index.description,
    route: DATASETS.ai_power_index.route,
    inputSchema: emptySchema
  },
  {
    id: "ex.four_forces.get",
    title: "Get Four Forces Exposure Dataset",
    description: DATASETS.four_forces.description,
    route: DATASETS.four_forces.route,
    inputSchema: emptySchema
  },
  {
    id: "ex.entity_in_a_box.get",
    title: "Get Entity-in-a-Box Ontology",
    description: DATASETS.entity_in_a_box.description,
    route: DATASETS.entity_in_a_box.route,
    inputSchema: emptySchema
  },
  {
    id: "ex.power_lens.get",
    title: "Generate an exmxc Power Lens Card",
    description:
      "Resolve a supported company name or ticker and synthesize its AI Power Index, Four Forces exposures, Entity Clarity record, available scarcity snapshot, coverage, and provenance.",
    route: "/power-lens",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Company name, common alias, or supported public-market ticker."
        }
      },
      required: ["query"],
      additionalProperties: false
    },
    openApiParameters: ["query"]
  },
  {
    id: "ex.ai_power.analysis.top",
    title: "Get Top AI Power Index Entities",
    description: "Retrieve top-ranked entities from the AI Power Index ranking.",
    route: "/analysis/ai_power/top",
    inputSchema: {
      type: "object",
      properties: { limit: limitSchema },
      additionalProperties: false
    },
    openApiParameters: ["limit"]
  },
  {
    id: "ex.eei.audit.run",
    title: "Run Entity Clarity (EEI) Audit",
    description: "Run a live Entity Engineering Index audit against any public URL, returning entity score, tier breakdown, crawl health, and structural profile per the exmxc EEI v2.1 methodology.",
    route: "/audit/run",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public URL to audit." }
      },
      required: ["url"],
      additionalProperties: false
    },
    openApiParameters: ["url"]
  },
  {
    id: "ex.convergence.latest",
    title: "Get Latest Convergence Read",
    description:
      "Retrieve the most recent weekly read of the AI Infrastructure Convergence Framework — overall status, count of categories in breach, per-signal state (Latent/Watch/Breach/Pending), and exit posture. Derived reference layer; not investment advice.",
    route: "/convergence/latest",
    inputSchema: emptySchema
  },
  {
    id: "ex.convergence.log",
    title: "Get Convergence Monitor Log",
    description:
      "Retrieve the longitudinal weekly log of convergence reads — each entry time-stamping status, breach count, categories breached, per-signal state, and posture. Optional limit returns the most recent N entries (newest first). Derived reference layer; not investment advice.",
    route: "/convergence/log",
    inputSchema: {
      type: "object",
      properties: { limit: limitSchema },
      additionalProperties: false
    },
    openApiParameters: ["limit"]
  }
];

export const CONTENT_LINKS = [
  { id: "ex.framework.get", title: "Frameworks", url: "https://exmxc.ai/frameworks" },
  { id: "ex.signal.get", title: "Signal Briefs", url: "https://exmxc.ai/signal-briefs" },
  { id: "ex.lexicon.get", title: "Lexicon", url: "https://exmxc.ai/lexicon" },
  { id: "ex.capital.get", title: "Capital", url: "https://exmxc.ai/capital" },
  { id: "ex.doctrine.get", title: "Doctrine", url: "https://exmxc.ai/leadership-doctrine" },
  { id: "ex.about.get", title: "About", url: "https://exmxc.ai/about-us" },
  { id: "ex.audit.page", title: "Entity Clarity Review (interactive)", url: "https://www.exmxc.ai/audit" }
];

export const SCHEMA_RESOURCES = [
  { id: "schema", uri: "exmxc://schemas/schema", name: "Entity Intelligence Schema", description: "Bundled entity intelligence JSON Schema.", mimeType: "application/json", category: "schema", route: "/schema", data: BUNDLED_SCHEMA, includeInDiscovery: true },
  { id: "definitions", uri: "exmxc://schemas/definitions", name: "Entity Intelligence Definitions", description: "Bundled entity intelligence definitions.", mimeType: "application/json", category: "schema", route: "/definitions", data: BUNDLED_DEFINITIONS, includeInDiscovery: true },
  { id: "index", uri: "exmxc://schemas/index", name: "Entity Intelligence Index", description: "Bundled entity index document.", mimeType: "application/json", category: "schema", route: "/index", resolver: "index", includeInDiscovery: true },
  { id: "ai_power_index", uri: "exmxc://schemas/ai_power_index", name: "AI Power Index Schema", description: "Bundled AI Power Index JSON Schema.", mimeType: "application/json", category: "schema", route: "/datasets/ai_power_index/schema", data: DATASETS.ai_power_index.schema, includeInDiscovery: true },
  { id: "power_lens", uri: "exmxc://schemas/power_lens", name: "Power Lens Response Schema", description: "Bundled JSON Schema for deterministic exmxc Power Lens responses.", mimeType: "application/json", category: "schema", route: "/schemas/power-lens", data: powerLensSchema, includeInDiscovery: true }
];

export const MCP_RESOURCES = [
  { id: "datasets_index", uri: "exmxc://datasets/index", name: "Dataset Index", description: "Index of all bundled exmxc datasets.", mimeType: "application/json", category: "dataset-index", route: "/datasets", resolver: "datasetIndex", includeInDiscovery: true },
  ...Object.values(DATASETS).map((dataset) => ({
    id: dataset.id,
    uri: `exmxc://datasets/${dataset.id}`,
    name: dataset.displayName,
    description: dataset.description,
    mimeType: "application/json",
    category: dataset.category,
    route: dataset.route,
    resolver: dataset.id === "entities" ? "entities" : dataset.id === "speg" ? "speg" : undefined,
    data: dataset.id === "entities" || dataset.id === "speg" ? undefined : dataset.data,
    includeInDiscovery: true
  })),
  ...SCHEMA_RESOURCES,
  { id: "content_index", uri: "exmxc://content/index", name: "Content Link Index", description: "Canonical exmxc content URLs; page bodies are not exposed as resources.", mimeType: "application/json", category: "content-index", route: null, resolver: "contentIndex", includeInDiscovery: true }
];

export const FEDERATED_REGISTRIES = [
  {
    id: "ex.cashflowroutes.registry.get",
    url: "https://cashflowroutes.com/.well-known/tool-registry.json"
  }
];
