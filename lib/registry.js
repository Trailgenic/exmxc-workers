import { POWER_LATEST, POWER_METHODOLOGY, POWER_EDITIONS } from './ai-power-rankings.js';
import entities from "../data/entities.json" with { type: "json" };
import speg from "../data/speg_index.json" with { type: "json" };
import aiPowerIndex from "../data/ai_power_index_dataset_v1.json" with { type: "json" };
import fourForces from "../data/four_forces_dataset_v1.json" with { type: "json" };
import entityInABox from "../data/entity_in_a_box_v1.json" with { type: "json" };
import convergenceLog from "../data/convergence_log_v1.json" with { type: "json" };
import powerLensAliases from "../data/power_lens_aliases_v1.json" with { type: "json" };
import realityGapIndex from "../data/reality_gap_index_v1.json" with { type: "json" };
import strategicConsequenceScenarios from "../data/strategic_consequence_scenarios_v1.json" with { type: "json" };
import entityRegistry from "../data/entity-registry.json" with { type: "json" };
import eciSeries from "../data/eci/index.json" with { type: "json" };
import eciLatestSnapshot from "../data/eci/snapshots/2026-07-30.json" with { type: "json" };
import eciLatestChanges from "../data/eci/changes/2026-01-20_to_2026-07-30.json" with { type: "json" };
import eciLatestRelease from "../data/eci/releases/2026-07-30.json" with { type: "json" };
import entitySchema from "../schema/schema.json" with { type: "json" };
import definitions from "../schema/definitions.json" with { type: "json" };
import index from "../index.json" with { type: "json" };
import aiPowerSchema from "../schema/ai_power_index.schema.json" with { type: "json" };
import powerLensSchema from "../schema/power_lens.schema.json" with { type: "json" };
import realityGapSchema from "../schema/reality_gap_index.schema.json" with { type: "json" };
import strategicConsequenceSchema from "../schema/strategic_consequence.schema.json" with { type: "json" };
import entityRegistrySchema from "../schema/entity-registry.schema.json" with { type: "json" };
import eciObservationSchema from "../schema/eci-observation.schema.json" with { type: "json" };
import eciReleaseSchema from "../schema/eci-release.schema.json" with { type: "json" };
import entityClarityEvidenceV2Schema from "../schema/entity-clarity-evidence-v2.schema.json" with { type: "json" };
import aiPowerMethodologyV2 from "../data/ai_power_v2/methodology.json" with { type: "json" };
import aiPowerProfilesV2 from "../data/ai_power_v2/releases/2026-09-11-pilot.json" with { type: "json" };
import aiPowerMethodologyV2Schema from "../schema/ai_power_methodology_v2.schema.json" with { type: "json" };
import aiPowerProfileV2Schema from "../schema/ai_power_profile_v2.schema.json" with { type: "json" };
import aiPowerSourceManifestV2Schema from "../schema/ai_power_source_manifest_v2.schema.json" with { type: "json" };
import powerLensV2Schema from "../schema/power_lens_v2.schema.json" with { type: "json" };
import spegIndexProfileV1Schema from "../schema/speg_index_profile_v1.schema.json" with { type: "json" };
import aiCommerceEpisodeV1Schema from "../schema/ai_commerce_episode_v1.schema.json" with { type: "json" };
import aiCommerceReleaseV1Schema from "../schema/ai_commerce_release_v1.schema.json" with { type: "json" };
import {
  AI_COMMERCE_LATEST,
  AI_COMMERCE_METHODOLOGY,
  AI_COMMERCE_RELEASES
} from "./ai-commerce.js";
import { SPEG_INDEX_RELEASE } from "./speg-index-v1.js";

export const ENTITY = {
  name: "exmxc",
  domain: "https://exmxc.ai",
  founder: "Mike Ye",
  description:
    "Human-led intelligence institution decoding AI power, entity clarity, institutional positioning, strategic doctrine, and Applied Capital Architecture."
};

export const BUILD = { version: "2.16.0", released: "2026-09-25" };
export const MCP_PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18"];
export const MCP_TRANSPORT = "https://mcp.exmxc.ai/mcp";
export const MCP_ORIGIN = "https://mcp.exmxc.ai";

export const BUNDLED_SCHEMA = entitySchema;
export const BUNDLED_DEFINITIONS = definitions;
export const BUNDLED_INDEX = index;
export const POWER_LENS_ALIASES = powerLensAliases;

export const DATASETS = {
  ai_commerce_signal_v1: {
    id: "ai_commerce_signal_v1",
    route: "/ai-commerce/signal",
    resourceUri: "exmxc://datasets/ai-commerce/signal/v1",
    displayName: "AI Commerce Signal v1",
    description: "Versioned AI commerce evidence: signed-in app selection method checks, separate provider-API tests, shopper experience gates, and attributed survey, referral, and search context. No inferred agent purchases or market-share score.",
    category: "longitudinal-instrument",
    data: AI_COMMERCE_LATEST,
    schemaRoute: "/schemas/ai-commerce-release-v1",
    schema: aiCommerceReleaseV1Schema
  },
  ai_commerce_methodology_v1: {
    id: "ai_commerce_methodology_v1",
    route: "/ai-commerce/methodology",
    resourceUri: "exmxc://methodologies/ai-commerce/v1",
    displayName: "AI Commerce Methodology v1",
    description: "AI shopping episode ontology, evidence lanes, transaction boundaries, and publication gates.",
    category: "methodology",
    data: AI_COMMERCE_METHODOLOGY
  },
  ai_commerce_releases_v1: {
    id: "ai_commerce_releases_v1",
    route: "/ai-commerce/releases",
    resourceUri: "exmxc://datasets/ai-commerce/releases/v1",
    displayName: "AI Commerce Signal Release Ledger",
    description: "Immutable dated AI commerce releases and their methodology lineage.",
    category: "release-ledger",
    data: AI_COMMERCE_RELEASES
  },
  ai_power_rankings: {
    id: "ai_power_rankings", route: "/ai-power/rankings",
    displayName: "AI Power Index — Monthly Rankings",
    description: "Current exmxc editorial rankings and forecasts for 50 companies in 2026, 2027, and 2030 using the fixed Four Forces methodology. Immutable monthly editions preserve prior judgments.",
    category: "index", data: POWER_LATEST
  },
  ai_power_rankings_methodology: {
    id: "ai_power_rankings_methodology", route: "/ai-power/rankings/methodology",
    displayName: "AI Power Index — Fixed Methodology 1.0.0",
    description: "Locked Four Forces, dominance-plus-breadth formula, scoring anchors, rounding, tie-breaks, and edition policy.",
    category: "methodology", data: POWER_METHODOLOGY
  },
  ai_power_rankings_editions: {
    id: "ai_power_rankings_editions", route: "/ai-power/rankings/editions",
    displayName: "AI Power Index — Edition Archive",
    description: "Dated immutable ranked editions and content hashes, beginning September 2026.",
    category: "release-ledger", data: POWER_EDITIONS
  },
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
  speg_index_v1: {
    id: "speg_index_v1",
    route: "/speg/index/v1",
    resourceUri: "exmxc://datasets/speg-index/v1",
    displayName: "sPEG Index v1 — Draft Research Constitution",
    description:
      "Evidence-backed durable-scarcity profiles with independently gated draft inclusion recommendations, immutable release semantics, full source provenance, and valuation fields kept separately nullable.",
    category: "index-profile-release",
    data: SPEG_INDEX_RELEASE,
    schemaRoute: "/schemas/speg-index-profile-v1",
    schema: spegIndexProfileV1Schema
  },
  ai_power_index: {
    id: "ai_power_index",
    route: "/datasets/ai_power_index",
    displayName: "AI Power Index v1 — Legacy Exposure Scaffold",
    description:
      "Historical weighted exposure scaffold. Its 0–10 totals and ranks are not current evidence-backed measurements of company power.",
    category: "legacy-dataset",
    data: aiPowerIndex,
    schemaRoute: "/datasets/ai_power_index/schema",
    schema: aiPowerSchema
  },
  four_forces: {
    id: "four_forces",
    route: "/datasets/four_forces",
    displayName: "Four Forces Exposure Dataset v1 — Legacy",
    description:
      "Historical v1 exposure scaffold across compute, interface, alignment, and energy; retained for compatibility, not as AI Power v2 judgments.",
    category: "legacy-dataset",
    data: fourForces
  },
  ai_power_methodology_v2: {
    id: "ai_power_methodology_v2",
    route: "/datasets/ai_power_methodology_v2",
    displayName: "AI Power Index v2 Pilot Methodology",
    description: "Versioned construct, force taxonomy, ordinal criteria, evidence rules, confidence policy, freshness rules, and release cadence for evidence-backed AI Power profiles.",
    category: "methodology",
    data: aiPowerMethodologyV2,
    schemaRoute: "/schemas/ai-power-methodology-v2",
    schema: aiPowerMethodologyV2Schema
  },
  ai_power_profiles_v2: {
    id: "ai_power_profiles_v2",
    route: "/datasets/ai_power_profiles_v2",
    displayName: "AI Power Index v2 Pilot Profiles",
    description: "Evidence-backed entity–mechanism–market–time profiles. The pilot publishes anchored judgments or explicit unknowns; it has no universal composite or league table.",
    category: "index-profile-release",
    data: aiPowerProfilesV2,
    schemaRoute: "/schemas/ai-power-profile-v2",
    schema: aiPowerProfileV2Schema
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
  },
  reality_gap_index: {
    id: "reality_gap_index",
    route: "/datasets/reality_gap_index",
    displayName: "AI Reality Gap Index",
    description:
      "Evidence-bounded index comparing company AI narrative intensity with observed AI capability, deployment, adoption, and monetization.",
    category: "index",
    data: realityGapIndex,
    schemaRoute: "/datasets/reality_gap_index/schema",
    schema: realityGapSchema
  },
  strategic_consequence_scenarios: {
    id: "strategic_consequence_scenarios",
    route: "/datasets/strategic_consequence_scenarios",
    displayName: "Strategic Consequence Scenario Library",
    description:
      "Versioned canonical counterfactuals, causal chains, bottlenecks, assumptions, and validation signals for the deterministic exmxc Strategic Consequence Engine.",
    category: "scenario-model",
    data: strategicConsequenceScenarios
  },
  entity_registry: {
    id: "entity_registry",
    route: "/datasets/entity_registry",
    displayName: "Entity Registry",
    description: "Stable identifiers and canonical classifications for the Entity Clarity longitudinal panel.",
    category: "registry",
    data: entityRegistry,
    schemaRoute: "/schemas/entity-registry",
    schema: entityRegistrySchema
  },
  entity_clarity_series: {
    id: "entity_clarity_series",
    route: "/datasets/entity_clarity",
    displayName: "Entity Clarity Series",
    description: "Versioned release ledger for the longitudinal Entity Clarity Index.",
    category: "index",
    data: eciSeries
  },
  entity_clarity_latest_snapshot: {
    id: "entity_clarity_latest_snapshot",
    route: "/datasets/entity_clarity/snapshots/latest",
    displayName: "Latest Entity Clarity Snapshot",
    description: "Latest posture, capability, and ECC observations keyed by stable entity identifier.",
    category: "snapshot",
    data: eciLatestSnapshot,
    schemaRoute: "/schemas/eci-observation",
    schema: eciObservationSchema
  },
  entity_clarity_latest_changes: {
    id: "entity_clarity_latest_changes",
    route: "/datasets/entity_clarity/changes/latest",
    displayName: "Latest Entity Clarity Changes",
    description: "Computed longitudinal change ledger for the latest matched panel.",
    category: "change-ledger",
    data: eciLatestChanges
  },
  entity_clarity_latest_release: {
    id: "entity_clarity_latest_release",
    route: "/datasets/entity_clarity/releases/latest",
    displayName: "Latest Entity Clarity Release",
    description: "Publication metadata, source QA, summary metrics, and industry aggregates for the latest release.",
    category: "release",
    data: eciLatestRelease,
    schemaRoute: "/schemas/eci-release",
    schema: eciReleaseSchema
  }
};

const emptySchema = { type: "object", properties: {}, additionalProperties: false };
const limitSchema = {
  type: "integer",
  minimum: 1,
  maximum: 100,
  description: "Maximum number of records to return."
};
const consequenceLimitSchema = {
  type: "integer",
  minimum: 1,
  maximum: 25,
  description: "Number of entities to return in each relative advantage and pressure list."
};
const strategicScenarioSchema = {
  type: "string",
  enum: [
    "inference_cost_collapse",
    "power_binding_constraint",
    "frontier_model_commoditization",
    "agent_interface_shift",
    "export_controls_tighten",
    "capability_gap_consolidation"
  ],
  description: "Canonical counterfactual scenario identifier."
};

export const DATA_TOOLS = [
  {
    id: "ex.ai_commerce.signal.get",
    title: "Get AI Commerce Signal",
    description: DATASETS.ai_commerce_signal_v1.description,
    route: DATASETS.ai_commerce_signal_v1.route,
    inputSchema: {
      type: "object",
      properties: {
        release: { type: "string", description: "Exact immutable release identifier; omit for latest." }
      },
      additionalProperties: false
    },
    openApiParameters: ["release"]
  },
  {
    id: "ex.ai_power.rankings.get", title: "Get AI Power rankings",
    description: DATASETS.ai_power_rankings.description,
    route: "/ai-power/rankings",
    inputSchema: { type: "object", properties: {
      edition: { type: "string", description: "Exact dated edition ID; omit for latest." },
      year: { type: "string", enum: ["2026", "2027", "2030"], description: "Sort highest power first for this year; defaults to 2026." }
    }, additionalProperties: false },
    openApiParameters: ["edition", "year"]
  },
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
    id: "ex.speg.index.get",
    title: "Get sPEG Index v1 Profiles",
    description: DATASETS.speg_index_v1.description,
    route: DATASETS.speg_index_v1.route,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional issuer name, stable ID, or common ticker alias." },
        decision: { type: "string", enum: ["include", "watchlist", "insufficient_evidence", "exclude"] },
        membership_state: { type: "string", enum: ["member", "under_review", "removed"] },
        release: { type: "string", description: "Exact immutable release identifier." }
      },
      additionalProperties: false
    },
    openApiParameters: ["query", "decision", "membership_state", "release"]
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
    title: "Get Legacy AI Power Exposure Scaffold",
    description: DATASETS.ai_power_index.description,
    route: DATASETS.ai_power_index.route,
    inputSchema: emptySchema
  },
  {
    id: "ex.four_forces.get",
    title: "Get Legacy Four Forces Exposure Dataset",
    description: DATASETS.four_forces.description,
    route: DATASETS.four_forces.route,
    inputSchema: emptySchema
  },
  {
    id: "ex.ai_power.profiles.get",
    title: "Get AI Power v2 Evidence Profiles",
    description: DATASETS.ai_power_profiles_v2.description,
    route: DATASETS.ai_power_profiles_v2.route,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional company name, alias, or ticker." },
        group: { type: "string", enum: ["chips_manufacturing_memory", "cloud_ecosystems", "model_developers", "distribution_workflows", "energy_enabling_infrastructure"] },
        status: { type: "string", enum: ["not_started", "complete", "partial", "insufficient_evidence"] }
      },
      additionalProperties: false
    },
    openApiParameters: ["query", "group", "status"]
  },
  {
    id: "ex.power_lens.v2.get",
    title: "Read an AI Power v2 Evidence Profile",
    description: "Resolve a pilot company and return its scoped mechanism, Four Forces mapping, four anchored judgments or explicit unknowns, evidence status, confidence, and versioned release metadata. No universal composite or rank is generated.",
    route: "/power-lens/v2",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Company name, common alias, or supported public-market ticker." }
      },
      required: ["query"],
      additionalProperties: false
    },
    openApiParameters: ["query"]
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
    title: "Generate a Legacy Power Lens v1 Card",
    description:
      "Historical v1 exposure view. Resolves a supported company name or ticker and returns the original weighted exposure scaffold and adjacent datasets. It is not a current evidence-backed measurement of company power.",
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
    id: "ex.reality_gap.get",
    title: "Get AI Reality Gap Scores",
    description:
      "Retrieve the full AI Reality Gap benchmark or filter a supported company by name, alias, ticker, or classification. Scores compare public AI narrative with observed capability from dated official evidence.",
    route: "/reality-gap",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Optional company name, common alias, or ticker." },
        classification: {
          type: "string",
          enum: [
            "quiet_compounder",
            "capability_leads_narrative",
            "narrative_capability_aligned",
            "narrative_leads_deployment",
            "narrative_outrunning_deployment"
          ]
        },
        sort: {
          type: "string",
          enum: ["gap_ascending", "gap_descending", "capability_descending", "narrative_descending"]
        },
        limit: limitSchema
      },
      additionalProperties: false
    },
    openApiParameters: ["query", "classification", "sort", "limit"]
  },
  {
    id: "ex.strategic_consequence.get",
    title: "Run a Legacy Experimental Strategic Consequence Scenario",
    description:
      "Experimental scenario engine pinned to the legacy v1 exposure scaffold. Its relative outputs are not AI Power v2 profiles, probabilities, or universal measures of advantage.",
    route: "/strategic-consequence",
    inputSchema: {
      type: "object",
      properties: {
        scenario: strategicScenarioSchema,
        query: {
          type: "string",
          description: "Optional company name, common alias, or ticker for a company-specific consequence view."
        },
        limit: consequenceLimitSchema
      },
      required: ["scenario"],
      additionalProperties: false
    },
    openApiParameters: ["scenario", "query", "limit"]
  },
  {
    id: "ex.ai_power.analysis.top",
    title: "Get Legacy AI Power v1 Ranking",
    description: "Retrieve historical weighted exposure rankings from the v1 scaffold. Alphabetical presentation within ties does not imply different merit.",
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
    title: "Collect Entity Clarity Evidence",
    description: "Collect page delivery, declared provider-purpose access policy, machine-readable identity evidence, a deterministic five-dimension Entity Clarity v2.1 score when assessable, a separate static-content adequacy flag, and a clearly labeled legacy website diagnostic for one public HTTPS URL.",
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
  { id: "ex.ai_commerce.page", title: "AI Commerce", description: "How AI assistants shape product discovery, selection, and shopping experience.", url: "https://www.exmxc.ai/ai-commerce" },
  { id: "ex.ai_commerce.methodology", title: "AI Commerce Methodology", description: "Evidence lanes, shopping episodes, transaction boundaries, and versioning.", url: "https://www.exmxc.ai/ai-commerce-methodology" },
  { id: "ex.speg_index.page", title: "sPEG Index", description: "Durable scarcity selection with valuation context.", url: "https://www.exmxc.ai/speg-index" },
  { id: "ex.speg_index.methodology", title: "sPEG Index Methodology", description: "Anchors, gates, evidence requirements, confidence, cadence, and version policy.", url: "https://www.exmxc.ai/speg-methodology" },
  { id: "ex.ai_power.page", title: "AI Power Index", description: "Evidence-backed AI Power profiles and release coverage.", url: "https://www.exmxc.ai/ai-power-index" },
  { id: "ex.ai_power.methodology", title: "AI Power Index Methodology", description: "Definition, rubric, evidence rules, confidence, cadence, and version history.", url: "https://www.exmxc.ai/ai-power-index-methodology" },
  { id: "ex.framework.get", title: "Frameworks", url: "https://exmxc.ai/frameworks" },
  { id: "ex.signal.get", title: "Signal Briefs", url: "https://exmxc.ai/signal-briefs" },
  { id: "ex.lexicon.get", title: "Lexicon", url: "https://exmxc.ai/lexicon" },
  { id: "ex.capital.get", title: "Capital", url: "https://exmxc.ai/capital" },
  { id: "ex.doctrine.get", title: "Doctrine", url: "https://exmxc.ai/leadership-doctrine" },
  { id: "ex.about.get", title: "About", url: "https://exmxc.ai/about-us" },
  { id: "ex.audit.page", title: "Entity Clarity Audit (interactive)", url: "https://www.exmxc.ai/audit" },
  { id: "ex.reality_gap.page", title: "AI Reality Gap Index (interactive)", url: "https://www.exmxc.ai/reality-gap" },
  { id: "ex.strategic_consequence.page", title: "Strategic Consequence Engine (interactive)", url: "https://www.exmxc.ai/strategic-consequence" }
];

export const SCHEMA_RESOURCES = [
  { id: "ai_commerce_episode_v1", uri: "exmxc://schemas/ai-commerce-episode/v1", name: "AI Commerce Episode v1 Schema", description: "Schema for attributable AI-mediated shopping episodes.", mimeType: "application/json", category: "schema", route: "/schemas/ai-commerce-episode-v1", data: aiCommerceEpisodeV1Schema, includeInDiscovery: true },
  { id: "ai_commerce_release_v1", uri: "exmxc://schemas/ai-commerce-release/v1", name: "AI Commerce Signal Release v1 Schema", description: "Schema for separate episode, survey, referral, and selection evidence lanes.", mimeType: "application/json", category: "schema", route: "/schemas/ai-commerce-release-v1", data: aiCommerceReleaseV1Schema, includeInDiscovery: true },
  { id: "schema", uri: "exmxc://schemas/schema", name: "Entity Intelligence Schema", description: "Bundled entity intelligence JSON Schema.", mimeType: "application/json", category: "schema", route: "/schema", data: BUNDLED_SCHEMA, includeInDiscovery: true },
  { id: "definitions", uri: "exmxc://schemas/definitions", name: "Entity Intelligence Definitions", description: "Bundled entity intelligence definitions.", mimeType: "application/json", category: "schema", route: "/definitions", data: BUNDLED_DEFINITIONS, includeInDiscovery: true },
  { id: "index", uri: "exmxc://schemas/index", name: "Entity Intelligence Index", description: "Bundled entity index document.", mimeType: "application/json", category: "schema", route: "/index", resolver: "index", includeInDiscovery: true },
  { id: "ai_power_index", uri: "exmxc://schemas/ai_power_index", name: "AI Power Index Schema", description: "Bundled AI Power Index JSON Schema.", mimeType: "application/json", category: "schema", route: "/datasets/ai_power_index/schema", data: DATASETS.ai_power_index.schema, includeInDiscovery: true },
  { id: "ai_power_methodology_v2_schema", uri: "exmxc://schemas/ai_power_methodology_v2", name: "AI Power v2 Methodology Schema", description: "Schema for the versioned AI Power v2 methodology contract.", mimeType: "application/json", category: "schema", route: "/schemas/ai-power-methodology-v2", data: aiPowerMethodologyV2Schema, includeInDiscovery: true },
  { id: "ai_power_profile_v2_schema", uri: "exmxc://schemas/ai_power_profile_v2", name: "AI Power v2 Profile Release Schema", description: "Schema for evidence-backed AI Power v2 profile releases.", mimeType: "application/json", category: "schema", route: "/schemas/ai-power-profile-v2", data: aiPowerProfileV2Schema, includeInDiscovery: true },
  { id: "ai_power_source_manifest_v2_schema", uri: "exmxc://schemas/ai_power_source_manifest_v2", name: "AI Power v2 Source Manifest Schema", description: "Schema for bounded evidence-source packets used by the automated AI Power v2 assessment pipeline.", mimeType: "application/json", category: "schema", route: "/schemas/ai-power-source-manifest-v2", data: aiPowerSourceManifestV2Schema, includeInDiscovery: true },
  { id: "power_lens_v2", uri: "exmxc://schemas/power_lens_v2", name: "Power Lens v2 Response Schema", description: "Schema for the AI Power v2 evidence-profile projection.", mimeType: "application/json", category: "schema", route: "/schemas/power-lens-v2", data: powerLensV2Schema, includeInDiscovery: true },
  { id: "power_lens", uri: "exmxc://schemas/power_lens", name: "Power Lens Response Schema", description: "Bundled JSON Schema for deterministic exmxc Power Lens responses.", mimeType: "application/json", category: "schema", route: "/schemas/power-lens", data: powerLensSchema, includeInDiscovery: true },
  { id: "reality_gap_index", uri: "exmxc://schemas/reality_gap_index", name: "AI Reality Gap Index Schema", description: "Bundled JSON Schema for the exmxc AI Reality Gap evidence ledger.", mimeType: "application/json", category: "schema", route: "/datasets/reality_gap_index/schema", data: realityGapSchema, includeInDiscovery: true },
  { id: "strategic_consequence", uri: "exmxc://schemas/strategic_consequence", name: "Strategic Consequence Engine Response Schema", description: "Bundled JSON Schema for deterministic exmxc Strategic Consequence Engine responses.", mimeType: "application/json", category: "schema", route: "/schemas/strategic-consequence", data: strategicConsequenceSchema, includeInDiscovery: true },
  { id: "entity_registry_schema", uri: "exmxc://schemas/entity_registry", name: "Entity Registry Schema", description: "Stable-identifier schema for the Entity Clarity panel.", mimeType: "application/json", category: "schema", route: "/schemas/entity-registry", data: entityRegistrySchema, includeInDiscovery: true },
  { id: "eci_observation", uri: "exmxc://schemas/eci_observation", name: "Entity Clarity Observation Schema", description: "Schema for dated ECI posture, capability, and ECC observations.", mimeType: "application/json", category: "schema", route: "/schemas/eci-observation", data: eciObservationSchema, includeInDiscovery: true },
  { id: "eci_release", uri: "exmxc://schemas/eci_release", name: "Entity Clarity Release Schema", description: "Schema for versioned Entity Clarity release metadata.", mimeType: "application/json", category: "schema", route: "/schemas/eci-release", data: eciReleaseSchema, includeInDiscovery: true },
  { id: "entity_clarity_evidence_v2", uri: "exmxc://schemas/entity_clarity_evidence_v2", name: "Automated Entity Clarity Evidence v2.1 Pilot Schema", description: "Schema for collection status, declared provider-purpose access, deterministic five-dimension Entity Clarity, static-content adequacy, explicit unknowns, model-test status, and legacy diagnostic separation.", mimeType: "application/json", category: "schema", route: "/schemas/entity-clarity-evidence-v2", data: entityClarityEvidenceV2Schema, includeInDiscovery: true },
  { id: "speg_index_profile_v1", uri: "exmxc://schemas/speg-index-profile/v1", name: "sPEG Index Profile Release v1 Schema", description: "Schema for durable-scarcity profiles, independent eligibility gates, draft-versus-membership separation, source provenance, review state, sensitivity, and nullable valuation links.", mimeType: "application/json", category: "schema", route: "/schemas/speg-index-profile-v1", data: spegIndexProfileV1Schema, includeInDiscovery: true }
];

export const MCP_RESOURCES = [
  { id: "datasets_index", uri: "exmxc://datasets/index", name: "Dataset Index", description: "Index of all bundled exmxc datasets.", mimeType: "application/json", category: "dataset-index", route: "/datasets", resolver: "datasetIndex", includeInDiscovery: true },
  ...Object.values(DATASETS).map((dataset) => ({
    id: dataset.id,
    uri: dataset.resourceUri || `exmxc://datasets/${dataset.id}`,
    name: dataset.displayName,
    description: dataset.description,
    mimeType: "application/json",
    category: dataset.category,
    route: dataset.route,
    resolver: dataset.id === "entities"
      ? "entities"
      : dataset.id === "speg"
        ? "speg"
        : dataset.id === "speg_index_v1"
          ? "spegIndexV1"
        : dataset.id === "ai_power_index"
          ? "aiPowerIndexLegacy"
          : dataset.id === "four_forces"
            ? "fourForcesLegacy"
        : dataset.id === "ai_power_profiles_v2"
          ? "aiPowerProfilesV2"
          : undefined,
    data: ["entities", "speg", "speg_index_v1", "ai_power_index", "four_forces", "ai_power_profiles_v2"].includes(dataset.id) ? undefined : dataset.data,
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
