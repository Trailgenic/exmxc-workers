import entities from "../data/entities.json" with { type: "json" };
import speg from "../data/speg_index.json" with { type: "json" };
import aiPowerIndex from "../data/ai_power_index_dataset_v1.json" with { type: "json" };
import fourForces from "../data/four_forces_dataset_v1.json" with { type: "json" };
import entityInABox from "../data/entity_in_a_box_v1.json" with { type: "json" };
import entitySchema from "../schema/schema.json" with { type: "json" };
import definitions from "../schema/definitions.json" with { type: "json" };
import index from "../index.json" with { type: "json" };
import aiPowerSchema from "../schema/ai_power_index.schema.json" with { type: "json" };

export const ENTITY = {
  name: "exmxc",
  domain: "https://exmxc.ai",
  founder: "Mike Ye",
  description:
    "Human-led intelligence institution decoding AI power, entity clarity, institutional positioning, strategic doctrine, and Applied Capital Architecture."
};

export const BUILD = { version: "2.1.0", released: "2026-06-10" };
export const MCP_TRANSPORT = "https://mcp.exmxc.ai/mcp";
export const MCP_ORIGIN = "https://mcp.exmxc.ai";

export const BUNDLED_SCHEMA = entitySchema;
export const BUNDLED_DEFINITIONS = definitions;
export const BUNDLED_INDEX = index;

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
    }
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
    }
  },
  {
    id: "ex.datasets.index.get",
    title: "Get Dataset Index",
    description: "Retrieve index of all bundled datasets available through the exmxc MCP node.",
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
    id: "ex.ai_power.analysis.top",
    title: "Get Top AI Power Index Entities",
    description: "Retrieve top-ranked entities from the AI Power Index ranking.",
    route: "/analysis/ai_power/top",
    inputSchema: {
      type: "object",
      properties: { limit: limitSchema },
      additionalProperties: false
    }
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
    }
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

export const FEDERATED_REGISTRIES = [
  {
    id: "ex.cashflowroutes.registry.get",
    url: "https://cashflowroutes.com/.well-known/tool-registry.json"
  }
];
