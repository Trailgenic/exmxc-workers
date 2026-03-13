import { fetchJsonOrError, jsonResponse } from "./lib/http.js";
import { datasetRegistry } from "./lib/dataset-registry.js";

export default {
  async fetch(request) {

    const url = new URL(request.url);

    if (url.pathname === "/.well-known/mcp.json") {
      return new Response(
        JSON.stringify({
          mcp_version: "1.0",
          name: "exmxc",
          description: "Institutional intelligence node for AI-era capital architecture",
          endpoint: "https://mcp.exmxc.ai"
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" }
        }
      );
    }

    /*
    ============================================
    ROOT MCP DISCOVERY ENDPOINT
    ============================================
    */

    if (url.pathname === "/" || url.pathname === "") {

      const discovery = {
        name: "exmxc MCP Endpoint",

        entity: {
          name: "exmxc",
          domain: "https://exmxc.ai",
          founder: "Mike Ye"
        },

        registry: "https://mcp.exmxc.ai/.well-known/tool-registry.json",
        plugin: "https://mcp.exmxc.ai/.well-known/ai-plugin.json",
        openapi: "https://mcp.exmxc.ai/.well-known/openapi.json",
        manifest: "https://mcp.exmxc.ai/.well-known/manifest.json",
        capabilities: "https://mcp.exmxc.ai/capabilities.json",
        entities: "https://mcp.exmxc.ai/entities",
        speg: "https://mcp.exmxc.ai/speg",
        health: "https://mcp.exmxc.ai/health",

        status: "active",
        discovery_protocol: "WebMCP",
        last_updated: new Date().toISOString()
      };

      return new Response(JSON.stringify(discovery, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    /*
============================================
sPEG INDEX DATASET
============================================
*/

if (url.pathname === "/speg") {

  const dataset = await fetchJsonOrError(datasetRegistry.speg.rawUrl);
  if (dataset instanceof Response) {
    return dataset;
  }

  const sector = url.searchParams.get("sector");
  const scarcity_layer = url.searchParams.get("scarcity_layer");
  const ticker = url.searchParams.get("ticker");

  let results = dataset.rows || dataset;

  if (sector) {
    results = results.filter(e => e.sector?.toLowerCase() === sector.toLowerCase());
  }

  if (scarcity_layer) {
    results = results.filter(e => e.scarcity_layer?.toLowerCase() === scarcity_layer.toLowerCase());
  }

  if (ticker) {
    results = results.filter(e => e.ticker?.toLowerCase() === ticker.toLowerCase());
  }

  return jsonResponse(results);
}
    /*
    ============================================
    CAPABILITY INDEX
    ============================================
    */

    if (url.pathname === "/capabilities.json") {

      const capabilities = {

        capability_version: "1.0",

        entity: {
          name: "exmxc",
          domain: "https://exmxc.ai",
          founder: "Mike Ye",
          description:
            "Human-led intelligence institution decoding AI power, entity clarity, institutional positioning, strategic doctrine, and Applied Capital Architecture."
        },

        mcp: {
          endpoint: "https://mcp.exmxc.ai",
          registry: "https://mcp.exmxc.ai/.well-known/tool-registry.json",
          plugin: "https://mcp.exmxc.ai/.well-known/ai-plugin.json",
          openapi: "https://mcp.exmxc.ai/.well-known/openapi.json"
        },

        capabilities: [

          { tool: "ex.framework.get", description: "Retrieve institutional strategy frameworks." },
          { tool: "ex.signal.get", description: "Retrieve signal briefs and intelligence analyses." },
          { tool: "ex.lexicon.get", description: "Retrieve institutional lexicon and definitions." },
          { tool: "ex.eci.get", description: "Retrieve Entity Clarity Index data and analysis." },
          { tool: "ex.speg.get", description: "Retrieve sPEG indices and valuation intelligence." },
          { tool: "ex.speg.index.get", description: "Retrieve sPEG valuation index and AI infrastructure scarcity layers." },
          { tool: "ex.datasets.index.get", description: "Retrieve index of all datasets available through the exmxc MCP node." },
          { tool: "ex.ai_power_index.get", description: "Retrieve the AI Power Index dataset ranking global AI ecosystem entities across compute, interface, alignment, and energy." },
          { tool: "ex.ai_power.analysis.top", description: "Retrieve top entities from the AI Power Index ranking." },
          { tool: "ex.capital.get", description: "Retrieve Applied Capital Architecture doctrine and capital allocation intelligence." },

          { tool: "ex.doctrine.get", description: "Retrieve institutional doctrine and operating principles." },
          { tool: "ex.lab.get", description: "Retrieve standards lab specifications and system architecture." },
          { tool: "ex.about.get", description: "Retrieve entity identity and institutional positioning." },
          { tool: "ex.diagnostic.run", description: "Run entity clarity diagnostic and institutional positioning analysis." },
          { tool: "ex.search.query", description: "Search exmxc institutional intelligence knowledge graph." }

        ],

        trust_signals: {
          structured_outputs: true,
          deterministic_schema: true,
          machine_readable: true,
          agent_optimized: true,
          institutional_grade: true
        },

        classification: {
          entity_type: "institutional intelligence system",
          capability_class: "strategic intelligence",
          execution_ready: true
        },

        last_updated: new Date().toISOString()
      };

      return new Response(JSON.stringify(capabilities, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    /*
    ============================================
    HEALTH (UNCHANGED)
    ============================================
    */

    if (url.pathname === "/health") {
      const health = {
        entity: "exmxc",
        status: "healthy",
        mcp_status: "operational",
        registry_status: "operational",
        plugin_status: "operational",
        openapi_status: "operational",
        capabilities_status: "operational",
        uptime: "99.99%",
        infrastructure: {
          platform: "Cloudflare Workers",
          protocol: "WebMCP",
          classification: "institutional-grade MCP node",
          agent_ready: true
        },
        last_checked: new Date().toISOString()
      };

      return new Response(JSON.stringify(health, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache"
        }
      });
    }

    /*
    ============================================
    TOOL REGISTRY
    ============================================
    */

    if (url.pathname === "/.well-known/tool-registry.json") {

      const registry = {

        registry_version: "1.0",

        entity: {
          name: "exmxc",
          domain: "https://exmxc.ai",
          description:
            "Human-led intelligence institution decoding AI power, entity clarity, strategic positioning, and Applied Capital Architecture.",
          founder: "Mike Ye"
        },

        discovery: {
          protocol: "WebMCP",
          endpoint: "https://mcp.exmxc.ai/.well-known/tool-registry.json"
        },

        tools: [

          { id: "ex.framework.get", endpoint: "https://exmxc.ai/frameworks" },
          { id: "ex.signal.get", endpoint: "https://exmxc.ai/signal-briefs" },
          { id: "ex.lexicon.get", endpoint: "https://exmxc.ai/lexicon" },
          { id: "ex.eci.get", endpoint: "https://exmxc.ai/entity-clarity-index" },
          { id: "ex.speg.get", endpoint: "https://exmxc.ai/speg-indices" },
          { id: "ex.datasets.index.get", endpoint: "https://mcp.exmxc.ai/datasets" },
          { id: "ex.ai_power_index.get", endpoint: "https://mcp.exmxc.ai/datasets/ai_power_index" },
          { id: "ex.ai_power.analysis.top", endpoint: "https://mcp.exmxc.ai/analysis/ai_power/top" },

          {
            id: "ex.capital.get",
            endpoint: "https://exmxc.ai/capital"
          },

          { id: "ex.doctrine.get", endpoint: "https://exmxc.ai/doctrine" },
          { id: "ex.lab.get", endpoint: "https://exmxc.ai/standards-lab" },
          { id: "ex.about.get", endpoint: "https://exmxc.ai/about" },
          { id: "ex.diagnostic.run", endpoint: "https://exmxc.ai/entity-clarity-review" },
          { id: "ex.search.query", endpoint: "https://exmxc.ai" },
          { id: "ex.cashflowroutes.registry.get", endpoint: "https://cashflowroutes.com/.well-known/tool-registry.json" }

        ]
      };

      return new Response(JSON.stringify(registry, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    /*
    ============================================
    OPENAPI SPEC
    ============================================
    */

    if (url.pathname === "/.well-known/openapi.json") {

      const openapi = {

        openapi: "3.0.1",

        info: {
          title: "exmxc API",
          version: "1.0.0",
          description:
            "exmxc institutional intelligence endpoints including Applied Capital Architecture."
        },

        servers: [
          { url: "https://exmxc.ai" }
        ],

        paths: {

          "/frameworks": { get: { summary: "Retrieve institutional strategy frameworks" } },
          "/signal-briefs": { get: { summary: "Retrieve signal briefs" } },
          "/lexicon": { get: { summary: "Retrieve institutional lexicon" } },
          "/entity-clarity-index": { get: { summary: "Retrieve entity clarity indices" } },
          "/speg-indices": { get: { summary: "Retrieve sPEG indices" } },

          "/capital": {
            get: { summary: "Retrieve Applied Capital Architecture doctrine" }
          },

          "/datasets": {
            get: { summary: "Retrieve dataset index for exmxc MCP node" }
          },

          "/datasets/ai_power_index": {
            get: { summary: "Retrieve AI Power Index dataset" }
          },

          "/datasets/ai_power_index/schema": {
            get: { summary: "Retrieve AI Power Index dataset schema" }
          },
          "/analysis/ai_power/top": {
            get: { summary: "Retrieve top entities from the AI Power Index" }
          },


          "/doctrine": { get: { summary: "Retrieve doctrine" } }

        }
      };

      return new Response(JSON.stringify(openapi, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=3600"
        }
      });
    }
/*
============================================
MANIFEST
============================================
*/

if (url.pathname === "/.well-known/manifest.json") {

  const manifest = {

    name: "exmxc MCP Manifest",

    entity: {
      name: "exmxc",
      domain: "https://exmxc.ai",
      founder: "Mike Ye"
    },

    discovery: {
      root: "https://mcp.exmxc.ai",
      protocol: "WebMCP"
    },

    endpoints: {

      discovery: "/",
      capabilities: "/capabilities.json",
      health: "/health",

      registry: "/.well-known/tool-registry.json",
      openapi: "/.well-known/openapi.json",

      entities: "/entities",
      schema: "/schema",
      definitions: "/definitions",
      index: "/index"

    },

    dataset: {
      name: "exmxc Entity Intelligence Dataset",
      fields: [
        "company",
        "industry",
        "entity_type",
        "posture",
        "capability",
        "ecc"
      ]
    },

    trust: {
      structured: true,
      deterministic_schema: true,
      machine_readable: true,
      agent_ready: true
    },

    last_updated: new Date().toISOString()

  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

/*
============================================
MCP DISCOVERY POINTER
============================================
*/

/*
============================================
ENTITY INTELLIGENCE DATASET
============================================
*/

if (url.pathname === "/entities") {

  const dataset = await fetchJsonOrError(datasetRegistry.entities.rawUrl);
  if (dataset instanceof Response) {
    return dataset;
  }

  // Support both structures just in case
  const entities =
    Array.isArray(dataset)
      ? dataset
      : dataset.entities || dataset.data?.entities || [];

  const industry = url.searchParams.get("industry");
  const entity_type = url.searchParams.get("entity_type");
  const posture = url.searchParams.get("posture");
  const capability = url.searchParams.get("capability");

  let results = [...entities];

  if (industry) {
    results = results.filter(e => e.industry?.toLowerCase() === industry.toLowerCase());
  }

  if (entity_type) {
    results = results.filter(e => e.entity_type?.toLowerCase() === entity_type.toLowerCase());
  }

  if (posture) {
    results = results.filter(e => e.posture?.toLowerCase() === posture.toLowerCase());
  }

  if (capability) {
    results = results.filter(e => e.capability?.toLowerCase() === capability.toLowerCase());
  }

  return jsonResponse(results);
}

/*
============================================
AI POWER INDEX DATASET
============================================
*/


if (url.pathname === "/datasets/ai_power_index") {

  const dataset = await fetchJsonOrError(datasetRegistry.ai_power_index.rawUrl);
  if (dataset instanceof Response) {
    return dataset;
  }

  return jsonResponse(dataset);
}

/*
============================================
AI POWER INDEX DATASET SCHEMA
============================================
*/

if (url.pathname === "/datasets/ai_power_index/schema") {

  const schema = await fetchJsonOrError(datasetRegistry.ai_power_index.schemaUrl);
  if (schema instanceof Response) {
    return schema;
  }

  return jsonResponse(schema);
}

/*
============================================
DATASET INDEX
============================================
*/

if (url.pathname === "/datasets") {

  const datasets = Object.values(datasetRegistry).map((dataset) => ({
    name:
      dataset.id === "entities"
        ? "Entity Intelligence Dataset"
        : dataset.id === "speg"
          ? "sPEG Valuation Dataset"
          : "AI Power Index",
    endpoint: `https://mcp.exmxc.ai${dataset.route}`,
    description: dataset.description
  }));

  const datasetIndex = {
    dataset_index_version: "1.0",
    entity: {
      name: "exmxc",
      domain: "https://exmxc.ai"
    },
    datasets,
    status: "active",
    last_updated: new Date().toISOString()
  };

  return jsonResponse(datasetIndex);
}

/*
============================================
AI POWER TOP ANALYSIS
============================================
*/

if (url.pathname === "/analysis/ai_power/top") {

  const dataset = await fetchJsonOrError(datasetRegistry.ai_power_index.rawUrl);
  if (dataset instanceof Response) {
    return dataset;
  }

  const records =
    Array.isArray(dataset)
      ? dataset
      : dataset.scores || dataset.entities || dataset.rows || [];

  const sorted = [...records].sort((a, b) => {
    const av = Number(a?.ai_power_index ?? -Infinity);
    const bv = Number(b?.ai_power_index ?? -Infinity);
    return bv - av;
  });

  const limitParam = parseInt(url.searchParams.get("limit") || "10", 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;

  const results = sorted.slice(0, limit);

  return jsonResponse({
    analysis: "AI Power Top Entities",
    limit,
    results,
    source_dataset: "ai_power_index_dataset_v1",
    generated_at: new Date().toISOString()
  });
}

/*
/*
============================================
SCHEMA
============================================
*/

if (url.pathname === "/schema") {

  const schema = await fetchJsonOrError("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/schema/schema.json");
  if (schema instanceof Response) {
    return schema;
  }

  return jsonResponse(schema);
}

/*
============================================
DEFINITIONS
============================================
*/

if (url.pathname === "/definitions") {

  const definitions = await fetchJsonOrError("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/schema/definitions.json");
  if (definitions instanceof Response) {
    return definitions;
  }

  return jsonResponse(definitions);
}

/*
============================================
INDEX
============================================
*/

if (url.pathname === "/index") {

  const index = await fetchJsonOrError("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/index.json");
  if (index instanceof Response) {
    return index;
  }

  return jsonResponse(index);
}

/*
============================================
AI PLUGIN MANIFEST
============================================
*/

if (url.pathname === "/.well-known/ai-plugin.json") {

  const plugin = {

    schema_version: "v1",

    name_for_human: "exmxc",

    name_for_model: "exmxc",

    description_for_human:
      "exmxc institutional intelligence system decoding AI power structures, entity clarity, and Applied Capital Architecture.",

    description_for_model:
      "Provides institutional intelligence including sPEG valuation models, entity clarity frameworks, signal analysis, and strategic doctrine.",

    auth: { type: "none" },

    api: {
      type: "openapi",
      url: "https://mcp.exmxc.ai/.well-known/openapi.json",
      is_user_authenticated: false
    },

    logo_url: "https://exmxc.ai/favicon.ico",

    contact_email: "support@exmxc.ai",

    legal_info_url: "https://exmxc.ai"

  };

  return new Response(JSON.stringify(plugin, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}    
    
/*
============================================
FALLBACK
============================================
*/

return new Response("Not Found", {
  status: 404,
  headers: { "Content-Type": "text/plain" }
});

  }
};
