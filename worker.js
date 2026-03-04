export default {
  async fetch(request) {

    const url = new URL(request.url);

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
        capabilities: "https://mcp.exmxc.ai/capabilities.json",
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

          {
            tool: "ex.capital.get",
            description: "Retrieve Applied Capital Architecture doctrine and capital allocation intelligence."
          },

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
ENTITY INTELLIGENCE DATASET
============================================
*/

if (url.pathname === "/entities") {

  const response = await fetch("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/data/entities.json");

  if (!response.ok) {
    return new Response(JSON.stringify({
      error: "dataset fetch failed",
      status: response.status
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const entities = await response.json();

  const industry = url.searchParams.get("industry");
  const entity_type = url.searchParams.get("entity_type");
  const posture = url.searchParams.get("posture");
  const capability = url.searchParams.get("capability");

  let results = entities;

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

  return new Response(JSON.stringify(results, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

/*
============================================
SCHEMA
============================================
*/

if (url.pathname === "/schema") {

  const data = await fetch("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/schema/schema.json");
  const schema = await data.json();

  return new Response(JSON.stringify(schema, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

/*
============================================
DEFINITIONS
============================================
*/

if (url.pathname === "/definitions") {

  const data = await fetch("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/schema/definitions.json");
  const definitions = await data.json();

  return new Response(JSON.stringify(definitions, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

/*
============================================
INDEX
============================================
*/

if (url.pathname === "/index") {

  const data = await fetch("https://raw.githubusercontent.com/Trailgenic/exmxc-workers/main/index.json");
  const index = await data.json();

  return new Response(JSON.stringify(index, null, 2), {
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
