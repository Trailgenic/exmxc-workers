import { classifyPostings, computeADS } from "./lib/ads-classifier.js";
import { emptyResponse, jsonResponse, textResponse } from "./lib/http.js";
import {
  BUILD,
  BUNDLED_DEFINITIONS,
  BUNDLED_SCHEMA,
  CONTENT_LINKS,
  DATASETS,
  DATA_TOOLS,
  ENTITY,
  FEDERATED_REGISTRIES,
  MCP_ORIGIN,
  MCP_TRANSPORT
} from "./lib/registry.js";
import {
  getAiPowerTop,
  getDatasetIndex,
  getEntities,
  getFourForces,
  getIndex,
  getSpeg,
  TOOL_HANDLERS
} from "./lib/queries.js";
import baseline from "./data/ads-baseline.json" with { type: "json" };

const SYNTHETIC_DISCLAIMER =
  "Postings are model-generated illustrations for ADS analysis, not scraped or verified labor-market data.";

function queryArgs(url, keys) {
  return Object.fromEntries(keys.map((key) => [key, url.searchParams.get(key)]).filter(([, value]) => value));
}

function toolInventory() {
  return DATA_TOOLS.map((tool) => ({
    id: tool.id,
    title: tool.title,
    description: tool.description,
    endpoint: `${MCP_ORIGIN}${tool.route}`,
    inputSchema: tool.inputSchema
  }));
}

function capabilitiesDocument() {
  return {
    capability_version: "2.0",
    entity: ENTITY,
    mcp: {
      endpoint: MCP_ORIGIN,
      mcp_transport: MCP_TRANSPORT,
      registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
      plugin: `${MCP_ORIGIN}/.well-known/ai-plugin.json`,
      openapi: `${MCP_ORIGIN}/.well-known/openapi.json`
    },
    tools: toolInventory(),
    capabilities: toolInventory().map(({ id, title, description, endpoint, inputSchema }) => ({
      tool: id,
      title,
      description,
      endpoint,
      inputSchema
    })),
    content_links: CONTENT_LINKS,
    federated_registries: FEDERATED_REGISTRIES,
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
    last_updated: BUILD.released
  };
}

function registryDocument() {
  return {
    registry_version: "2.0",
    entity: ENTITY,
    discovery: {
      protocol: "WebMCP + MCP Streamable HTTP",
      endpoint: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
      mcp_transport: MCP_TRANSPORT
    },
    tools: toolInventory(),
    content_links: CONTENT_LINKS,
    federated_registries: FEDERATED_REGISTRIES,
    last_updated: BUILD.released
  };
}

function mcpDiscoveryDocument() {
  return {
    mcp_version: "1.0",
    name: ENTITY.name,
    description: ENTITY.description,
    endpoint: MCP_ORIGIN,
    mcp_transport: MCP_TRANSPORT,
    ontology_layers: ["entity_in_a_box_v1"],
    last_updated: BUILD.released
  };
}

function manifestDocument() {
  return {
    name: "exmxc MCP Manifest",
    version: BUILD.version,
    entity: ENTITY,
    discovery: {
      root: MCP_ORIGIN,
      protocol: "WebMCP + MCP Streamable HTTP",
      mcp_transport: MCP_TRANSPORT
    },
    endpoints: {
      discovery: "/",
      mcp_transport: "/mcp",
      capabilities: "/capabilities.json",
      health: "/health",
      registry: "/.well-known/tool-registry.json",
      openapi: "/.well-known/openapi.json",
      entities: "/entities",
      speg: "/speg",
      schema: "/schema",
      definitions: "/definitions",
      index: "/index"
    },
    datasets: Object.values(DATASETS).map(({ id, route, displayName, description, category, schemaRoute }) => ({
      id,
      route,
      displayName,
      description,
      category,
      schemaRoute
    })),
    tools: toolInventory(),
    content_links: CONTENT_LINKS,
    federated_registries: FEDERATED_REGISTRIES,
    trust: {
      structured: true,
      deterministic_schema: true,
      machine_readable: true,
      agent_ready: true
    },
    last_updated: BUILD.released
  };
}

function openApiDocument() {
  const parameter = (name, description = name) => ({
    name,
    in: "query",
    required: false,
    schema: name === "limit" ? { type: "integer", minimum: 1 } : { type: "string" },
    description
  });
  const json200 = { description: "JSON response" };
  const toolParameterMap = {
    "ex.entities.get": ["industry", "entity_type", "posture", "capability"].map(parameter),
    "ex.speg.get": ["sector", "scarcity_layer", "ticker"].map(parameter),
    "ex.ai_power.analysis.top": [parameter("limit", "Maximum number of records")],
    "ex.eei.audit.run": [{ ...parameter("url", "Public URL to audit"), required: true }]
  };
  const datasetPaths = Object.fromEntries(
    Object.values(DATASETS).map((dataset) => [
      dataset.route,
      { get: { summary: `Retrieve ${dataset.displayName}`, responses: { 200: json200 } } }
    ])
  );
  const toolPaths = Object.fromEntries(
    DATA_TOOLS.map((tool) => [
      tool.route,
      {
        get: {
          summary: tool.title,
          description: tool.description,
          parameters: toolParameterMap[tool.id] || [],
          responses: { 200: json200 }
        }
      }
    ])
  );
  return {
    openapi: "3.0.1",
    info: {
      title: "exmxc MCP REST API",
      version: BUILD.version,
      description: "REST/JSON endpoints and MCP transport for exmxc institutional intelligence."
    },
    servers: [{ url: MCP_ORIGIN }],
    paths: {
      ...datasetPaths,
      ...toolPaths,
      [DATASETS.ai_power_index.schemaRoute]: { get: { summary: "Retrieve AI Power Index JSON Schema", responses: { 200: json200 } } },
      "/schema": { get: { summary: "Retrieve entity intelligence schema", responses: { 200: json200 } } },
      "/definitions": { get: { summary: "Retrieve entity intelligence definitions", responses: { 200: json200 } } },
      "/index": { get: { summary: "Retrieve entity intelligence index", responses: { 200: json200 } } },
      "/mcp": { post: { summary: "MCP JSON-RPC 2.0 Streamable HTTP transport", responses: { 200: json200 } } }
    }
  };
}

function jsonRpcResponse(id, result) {
  return jsonResponse({ jsonrpc: "2.0", id, result });
}

function jsonRpcError(id, code, message) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

async function handleMcp(request) {
  if (request.method === "GET") {
    return emptyResponse({ status: 405, headers: { Allow: "POST" } });
  }
  if (request.method !== "POST") {
    return emptyResponse({ status: 405, headers: { Allow: "POST" } });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  const { id, method, params = {} } = payload || {};
  if (method === "notifications/initialized") return emptyResponse({ status: 202 });
  if (method === "initialize") {
    return jsonRpcResponse(id, {
      protocolVersion: params?.protocolVersion || "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: ENTITY.name, version: BUILD.version }
    });
  }
  if (method === "ping") return jsonRpcResponse(id, {});
  if (method === "tools/list") {
    return jsonRpcResponse(id, {
      tools: DATA_TOOLS.map((tool) => ({
        name: tool.id,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    });
  }
  if (method === "tools/call") {
    const handler = TOOL_HANDLERS[params?.name];
    if (!handler) return jsonRpcError(id, -32602, "Unknown tool");
    const result = await handler(params?.arguments || {});
    return jsonRpcResponse(id, {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result
    });
  }
  return jsonRpcError(id, -32601, "Method not found");
}

function pluginDocument() {
  return {
    schema_version: "v1",
    name_for_human: "exmxc",
    name_for_model: "exmxc",
    description_for_human: "exmxc institutional intelligence system decoding AI power structures, entity clarity, and Applied Capital Architecture.",
    description_for_model: "Provides institutional intelligence including sPEG valuation models, entity clarity frameworks, signal analysis, and strategic doctrine.",
    auth: { type: "none" },
    api: { type: "openapi", url: `${MCP_ORIGIN}/.well-known/openapi.json`, is_user_authenticated: false },
    logo_url: "https://exmxc.ai/favicon.ico",
    contact_email: "support@exmxc.ai",
    legal_info_url: ENTITY.domain
  };
}

async function handleAdsSignal(url, env) {
  const mode = url.searchParams.get("mode") || (url.searchParams.get("query") ? "signal" : "benchmark");
  const query = url.searchParams.get("query") || "agentic AI engineer";
  const count = Number.parseInt(url.searchParams.get("count") || "15", 10);
  const provenance = {
    data_provenance: "synthetic-llm-generated",
    disclaimer: SYNTHETIC_DISCLAIMER
  };

  if (mode === "benchmark") {
    return jsonResponse({
      tool: "ai-jobs-signal",
      version: "1.0",
      mode: "benchmark",
      generated_at: new Date().toISOString(),
      methodology: "https://exmxc.ai/frameworks/ads",
      ...provenance,
      data: baseline
    });
  }

  try {
    if (!env?.ANTHROPIC_API_KEY) {
      return jsonResponse({
        tool: "ai-jobs-signal",
        version: "1.0",
        mode: "signal",
        ...provenance,
        error: "missing ANTHROPIC_API_KEY binding"
      });
    }

    const genRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a job market research assistant with deep knowledge
of the US AI/ML hiring market as of early 2026. Generate realistic
remote US AI job postings matching the search query.
Return ONLY a valid JSON array, no markdown, no preamble:
[{"posting_id":"synthetic-001","title":"string","company":"string",
"location":"Remote","skills_raw":["skill1","skill2"],
"posted_date":"2026-03","compensation":"$120,000 - $180,000"}]
Base postings on real market patterns. Include realistic mix of
seniority levels and company types.`,
        messages: [{ role: "user", content: `Generate ${count} AI job postings for query: ${query}` }]
      })
    });

    if (!genRes.ok) {
      return jsonResponse({
        tool: "ai-jobs-signal",
        version: "1.0",
        mode: "signal",
        ...provenance,
        error: "failed to generate synthetic postings",
        status: genRes.status
      });
    }

    const generatedPayload = await genRes.json();
    const generatedText = generatedPayload?.content?.[0]?.text || "[]";
    const postings = JSON.parse(generatedText);
    const normalizedPostings = Array.isArray(postings)
      ? postings.map((posting, index) => ({
        posting_id: posting?.posting_id || `synthetic-${String(index + 1).padStart(3, "0")}`,
        title: posting?.title || "",
        skills_raw: Array.isArray(posting?.skills_raw) ? posting.skills_raw : []
      }))
      : [];
    const classified = await classifyPostings(normalizedPostings, env.ANTHROPIC_API_KEY);
    const metrics = computeADS(classified, normalizedPostings.length, baseline.sample_size);
    return jsonResponse({
      tool: "ai-jobs-signal",
      version: "1.0",
      mode: "signal",
      generated_at: new Date().toISOString(),
      query,
      requested_count: count,
      generated_count: normalizedPostings.length,
      prior_count: baseline.sample_size,
      ...provenance,
      metrics,
      classified
    });
  } catch (error) {
    return jsonResponse({
      tool: "ai-jobs-signal",
      version: "1.0",
      mode: "signal",
      ...provenance,
      error: "ai-jobs-signal failed",
      detail: String(error?.message || error)
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return emptyResponse({ status: 204 });
    if (url.pathname === "/mcp") return handleMcp(request);

    if (url.pathname === "/.well-known/mcp.json") return jsonResponse(mcpDiscoveryDocument());
    if (url.pathname === "/" || url.pathname === "") {
      return jsonResponse({
        name: "exmxc MCP Endpoint",
        entity: { name: ENTITY.name, domain: ENTITY.domain, founder: ENTITY.founder },
        registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
        plugin: `${MCP_ORIGIN}/.well-known/ai-plugin.json`,
        openapi: `${MCP_ORIGIN}/.well-known/openapi.json`,
        manifest: `${MCP_ORIGIN}/.well-known/manifest.json`,
        capabilities: `${MCP_ORIGIN}/capabilities.json`,
        mcp_transport: MCP_TRANSPORT,
        entities: `${MCP_ORIGIN}/entities`,
        speg: `${MCP_ORIGIN}/speg`,
        health: `${MCP_ORIGIN}/health`,
        status: "active",
        discovery_protocol: "WebMCP + MCP Streamable HTTP",
        last_updated: BUILD.released
      });
    }

    if (url.pathname === "/speg") return jsonResponse(getSpeg(queryArgs(url, ["sector", "scarcity_layer", "ticker"])));
    if (url.pathname === "/capabilities.json") return jsonResponse(capabilitiesDocument());
    if (url.pathname === "/health") {
      return jsonResponse({
        entity: ENTITY.name,
        status: "healthy",
        mcp_status: "operational",
        registry_status: "operational",
        plugin_status: "operational",
        openapi_status: "operational",
        capabilities_status: "operational",
        uptime: null,
        uptime_note: "Uptime is observed via Cloudflare observability, not asserted in this endpoint.",
        infrastructure: {
          platform: "Cloudflare Workers",
          protocol: "WebMCP + MCP Streamable HTTP",
          classification: "institutional-grade MCP node",
          agent_ready: true
        },
        last_checked: new Date().toISOString()
      }, { headers: { "Cache-Control": "no-cache" } });
    }
    if (url.pathname === "/.well-known/tool-registry.json") return jsonResponse(registryDocument());
    if (url.pathname === "/.well-known/openapi.json") return jsonResponse(openApiDocument());
    if (url.pathname === "/.well-known/manifest.json") return jsonResponse(manifestDocument());
    if (url.pathname === "/entities") return jsonResponse(getEntities(queryArgs(url, ["industry", "entity_type", "posture", "capability"])));
    if (url.pathname === "/datasets/ai_power_index") return jsonResponse(DATASETS.ai_power_index.data);
    if (url.pathname === "/datasets/ai_power_index/schema") return jsonResponse(DATASETS.ai_power_index.schema);
    if (url.pathname === "/datasets/four_forces") return jsonResponse(getFourForces());
    if (url.pathname === "/datasets/entity_in_a_box" || url.pathname === "/datasets/entity_in_a_box_v1") return jsonResponse(DATASETS.entity_in_a_box.data);
    if (url.pathname === "/datasets") return jsonResponse(getDatasetIndex());
    if (url.pathname === "/analysis/ai_power/top") return jsonResponse(getAiPowerTop(queryArgs(url, ["limit"])));
    if (url.pathname === "/audit/run") return jsonResponse(await TOOL_HANDLERS["ex.eei.audit.run"](queryArgs(url, ["url"])));
    if (url.pathname === "/schema") return jsonResponse(BUNDLED_SCHEMA);
    if (url.pathname === "/definitions") return jsonResponse(BUNDLED_DEFINITIONS);
    if (url.pathname === "/index") return jsonResponse(getIndex());
    if (url.pathname === "/.well-known/ai-plugin.json") return jsonResponse(pluginDocument());
    if (url.pathname === "/api/ai-jobs-signal") return handleAdsSignal(url, env);

    return textResponse("Not Found", { status: 404 });
  }
};
