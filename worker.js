import { createMcpHandler } from "agents/mcp";
import { ADSUpstreamError, classifyPostings, computeADS } from "./lib/ads-classifier.js";
import { CACHE, emptyResponse, jsonResponse, mcpCorsHeaders, textResponse } from "./lib/http.js";
import { createExmxcMcpServer, mcpResourceProjection, contentIndexResource, TOOL_IDS } from "./lib/mcp-server.js";
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
  MCP_PROTOCOL_VERSIONS,
  MCP_RESOURCES,
  MCP_TRANSPORT
} from "./lib/registry.js";
import {
  getAiPowerTop,
  getConvergenceLatest,
  getConvergenceLog,
  getDatasetIndex,
  getEntities,
  getFourForces,
  getIndex,
  getPowerLens,
  getRealityGap,
  getSpeg,
  getStrategicConsequence,
  TOOL_HANDLERS,
  validateAuditTarget,
  validatePowerLensQuery,
  validateStrategicConsequenceArgs
} from "./lib/queries.js";
import baseline from "./data/ads-baseline.json" with { type: "json" };

const SYNTHETIC_DISCLAIMER = "Postings are model-generated illustrations for ADS analysis, not scraped or verified labor-market data.";
const JSON_SSE = "application/json, text/event-stream";
const ADS_BODY_LIMIT_BYTES = 8192;
const ADS_GENERATION_TIMEOUT_MS = 20_000;
const ADS_CLASSIFICATION_TIMEOUT_MS = 20_000;

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

function resourceInventory() {
  return mcpResourceProjection().map((resource) => ({
    ...resource,
    category: MCP_RESOURCES.find((candidate) => candidate.uri === resource.uri)?.category,
    route: MCP_RESOURCES.find((candidate) => candidate.uri === resource.uri)?.route
  }));
}

function openApiParameter(name, schema = { type: "string" }, required = false) {
  return {
    name,
    in: "query",
    required,
    schema,
    description: name
  };
}

function capabilitiesDocument() {
  return {
    capability_version: "2.1",
    entity: ENTITY,
    mcp: {
      endpoint: MCP_ORIGIN,
      mcp_transport: MCP_TRANSPORT,
      protocol_versions: MCP_PROTOCOL_VERSIONS,
      registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
      openapi: `${MCP_ORIGIN}/.well-known/openapi.json`
    },
    tools: toolInventory(),
    resources: resourceInventory(),
    content_links: CONTENT_LINKS,
    federated_registries: FEDERATED_REGISTRIES,
    positioning: { structured_outputs: true, deterministic_schema: true, machine_readable: true },
    last_updated: BUILD.released
  };
}

function registryDocument() {
  return {
    registry_version: "2.1",
    entity: ENTITY,
    discovery: {
      protocol: "MCP Streamable HTTP via official SDK and Cloudflare Workers handler",
      endpoint: `${MCP_ORIGIN}/.well-known/tool-registry.json`,
      mcp_transport: MCP_TRANSPORT,
      protocol_versions: MCP_PROTOCOL_VERSIONS
    },
    tools: toolInventory(),
    resources: resourceInventory(),
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
    protocol_versions: MCP_PROTOCOL_VERSIONS,
    resources: resourceInventory().map((resource) => resource.uri),
    last_updated: BUILD.released
  };
}

function manifestDocument() {
  return {
    name: "exmxc MCP Manifest",
    version: BUILD.version,
    entity: ENTITY,
    discovery: { root: MCP_ORIGIN, protocol: "MCP Streamable HTTP via Cloudflare Workers", mcp_transport: MCP_TRANSPORT, protocol_versions: MCP_PROTOCOL_VERSIONS },
    endpoints: { discovery: "/", mcp_transport: "/mcp", capabilities: "/capabilities.json", health: "/health", registry: "/.well-known/tool-registry.json", openapi: "/.well-known/openapi.json" },
    datasets: Object.values(DATASETS).map(({ id, route, displayName, description, category, schemaRoute }) => ({ id, route, displayName, description, category, schemaRoute })),
    tools: toolInventory(),
    resources: resourceInventory(),
    content_links: CONTENT_LINKS,
    last_updated: BUILD.released
  };
}

function openApiDocument() {
  const json200 = { description: "JSON response" };
  const toolPaths = Object.fromEntries(DATA_TOOLS.map((tool) => [
    tool.route,
    { get: { summary: tool.title, description: tool.description, parameters: (tool.openApiParameters || []).map((parameter) => openApiParameter(
      parameter,
      tool.inputSchema?.properties?.[parameter] ?? { type: "string" },
      tool.inputSchema?.required?.includes(parameter) ?? false
    )), responses: { 200: json200 } } }
  ]));
  return {
    openapi: "3.0.1",
    info: { title: "exmxc REST and MCP API", version: BUILD.version, description: "REST/JSON intelligence API plus an MCP server using Streamable HTTP via the Cloudflare Workers handler." },
    servers: [{ url: MCP_ORIGIN }],
    components: { securitySchemes: { AdsSignalBearer: { type: "http", scheme: "bearer" } } },
    paths: {
      ...Object.fromEntries(Object.values(DATASETS).map((dataset) => [dataset.route, { get: { summary: `Retrieve ${dataset.displayName}`, responses: { 200: json200 } } }])),
      ...toolPaths,
      "/api/ai-jobs-signal": {
        get: { summary: "ADS benchmark", responses: { 200: json200, 405: { description: "Signal generation requires POST" } } },
        post: { summary: "Paid ADS signal generation", security: [{ AdsSignalBearer: [] }], responses: { 200: json200, 400: { description: "Invalid body" }, 401: { description: "Unauthorized" }, 502: { description: "Upstream failed" }, 504: { description: "Upstream timeout" } } }
      },
      "/mcp": { post: { summary: "MCP Streamable HTTP transport", responses: { 200: json200, 400: { description: "Bad MCP protocol version" }, 403: { description: "Origin forbidden" }, 405: { description: "Method not allowed" }, 406: { description: "Not acceptable" }, 415: { description: "Unsupported media type" } } } }
    }
  };
}

function jsonRpcError(id, code, message, headers = {}) {
  return jsonResponse({ jsonrpc: "2.0", id: id ?? null, error: { code, message } }, { headers: { ...headers, "Cache-Control": CACHE.NO_STORE } });
}

function mediaAvailability(header) {
  if (!header || !header.trim()) return { json: true, sse: false, normalize: true };
  let json = false;
  let sse = false;
  let wildcard = false;
  for (const part of header.split(",")) {
    const [rawType, ...params] = part.trim().toLowerCase().split(";").map((value) => value.trim());
    const unavailable = params.some((param) => /^q=0(?:\.0*)?$/.test(param));
    if (unavailable) continue;
    if (rawType === "application/json") json = true;
    if (rawType === "text/event-stream") sse = true;
    if (rawType === "*/*") wildcard = true;
  }
  if (wildcard) json = true;
  return { json, sse, normalize: wildcard || (json && !sse) };
}

function acceptPolicy(request) {
  const availability = mediaAvailability(request.headers.get("Accept") || "");
  if (!availability.json) return { ok: false, normalize: false };
  if (availability.sse && !availability.json) return { ok: false, normalize: false };
  return { ok: true, normalize: availability.normalize };
}

async function handleMcp(request, env, ctx) {
  const cors = mcpCorsHeaders(request, env);
  const origin = request.headers.get("Origin");
  if (origin && !cors["Access-Control-Allow-Origin"]) return emptyResponse({ status: 403, headers: cors });
  if (request.method === "OPTIONS") return emptyResponse({ status: 204, headers: cors });
  if (request.method !== "POST") return emptyResponse({ status: 405, headers: { ...cors, Allow: "POST" } });

  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return emptyResponse({ status: 415, headers: cors });

  const accept = acceptPolicy(request);
  if (!accept.ok) return emptyResponse({ status: 406, headers: cors });

  const protocolVersion = request.headers.get("MCP-Protocol-Version");
  if (protocolVersion && !MCP_PROTOCOL_VERSIONS.includes(protocolVersion)) return emptyResponse({ status: 400, headers: cors });

  const body = await request.text();
  try {
    const payload = JSON.parse(body);
    if (payload?.method === "tools/call" && !TOOL_IDS.has(payload?.params?.name)) {
      return jsonRpcError(payload?.id, -32602, "Unknown tool", cors);
    }
  } catch {
    // Let the SDK produce the JSON-RPC parse error; this guard only handles known parsed unknown tools.
  }

  const headers = new Headers(request.headers);
  if (accept.normalize) headers.set("Accept", JSON_SSE);
  const normalizedRequest = new Request(request.url, { method: request.method, headers, body });
  const handler = createMcpHandler(createExmxcMcpServer(), { route: "/mcp", enableJsonResponse: true });
  const sdkResponse = await handler(normalizedRequest, env, ctx);
  const responseHeaders = new Headers(sdkResponse.headers);
  for (const [key, value] of Object.entries(cors)) responseHeaders.set(key, value);
  responseHeaders.set("Cache-Control", CACHE.NO_STORE);
  return new Response(sdkResponse.body, { status: sdkResponse.status, statusText: sdkResponse.statusText, headers: responseHeaders });
}

function unauthorized() {
  return jsonResponse({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": CACHE.NO_STORE, "Access-Control-Allow-Origin": "null" } });
}

function timeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function handleAdsSignal(request, url, env) {
  const provenance = { data_provenance: "synthetic-llm-generated", disclaimer: SYNTHETIC_DISCLAIMER };
  const noStore = { "Cache-Control": CACHE.NO_STORE };
  if (request.method === "GET") {
    if (url.searchParams.get("mode") === "signal" || url.searchParams.has("query")) return jsonResponse({ error: "Signal generation requires POST." }, { status: 405, headers: noStore });
    return jsonResponse({ tool: "ai-jobs-signal", version: "1.0", mode: "benchmark", generated_at: BUILD.released, methodology: "https://exmxc.ai/frameworks/ads", ...provenance, data: baseline });
  }
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405, headers: noStore });
  if (!env?.ADS_SIGNAL_KEY || request.headers.get("Authorization") !== `Bearer ${env.ADS_SIGNAL_KEY}`) return unauthorized();

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > ADS_BODY_LIMIT_BYTES) return jsonResponse({ error: "Request body too large" }, { status: 400, headers: noStore });

  let body;
  try { body = JSON.parse(text); } catch { return jsonResponse({ error: "Invalid JSON body" }, { status: 400, headers: noStore }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonResponse({ error: "Request body must be a JSON object" }, { status: 400, headers: noStore });
  const allowed = new Set(["query", "count"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return jsonResponse({ error: "Unknown field" }, { status: 400, headers: noStore });
  const query = body.query;
  const count = body.count;
  if (typeof query !== "string" || query.length < 1 || query.length > 200 || !Number.isInteger(count) || count < 1 || count > 50) {
    return jsonResponse({ error: "Invalid query or count" }, { status: 400, headers: noStore });
  }

  try {
    // Paid ADS has two upstream calls: generation (20s budget) and classification (20s budget), for an overall documented budget of roughly 40s plus Worker overhead.
    const genRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: timeoutSignal(ADS_GENERATION_TIMEOUT_MS),
      headers: { "Content-Type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: `Generate ${count} AI job postings for query: ${query}` }] })
    });
    if (!genRes.ok) return jsonResponse({ error: "ADS upstream failed" }, { status: 502, headers: noStore });
    const generatedPayload = await genRes.json();
    const postings = JSON.parse(generatedPayload?.content?.[0]?.text || "[]");
    const normalized = Array.isArray(postings) ? postings.map((posting, index) => ({ posting_id: posting?.posting_id || `synthetic-${index + 1}`, title: posting?.title || "", skills_raw: Array.isArray(posting?.skills_raw) ? posting.skills_raw : [] })) : [];
    const classified = await classifyPostings(normalized, env.ANTHROPIC_API_KEY, { signal: timeoutSignal(ADS_CLASSIFICATION_TIMEOUT_MS) });
    return jsonResponse({ tool: "ai-jobs-signal", version: "1.0", mode: "signal", query, requested_count: count, generated_count: normalized.length, prior_count: baseline.sample_size, ...provenance, metrics: computeADS(classified, normalized.length, baseline.sample_size), classified }, { headers: noStore });
  } catch (error) {
    const status = error instanceof ADSUpstreamError ? error.status : (error?.name === "AbortError" || error?.name === "TimeoutError" ? 504 : 502);
    return jsonResponse({ error: status === 504 ? "ADS upstream timed out" : "ADS upstream failed" }, { status, headers: noStore });
  }
}

function pluginDocument() {
  return {
    schema_version: "v1",
    name_for_human: "exmxc",
    name_for_model: "exmxc",
    description_for_human: "exmxc institutional intelligence system decoding AI power structures, entity clarity, and Applied Capital Architecture.",
    description_for_model: "Provides institutional intelligence datasets and REST endpoints. This legacy plugin manifest is not part of the MCP protocol.",
    auth: { type: "none" },
    api: { type: "openapi", url: `${MCP_ORIGIN}/.well-known/openapi.json`, is_user_authenticated: false },
    logo_url: "https://exmxc.ai/favicon.ico",
    contact_email: "support@exmxc.ai",
    legal_info_url: ENTITY.domain
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp") return handleMcp(request, env, ctx);
    if (request.method === "OPTIONS") return emptyResponse({ status: 204 });

    const discoveryHeaders = { "Cache-Control": CACHE.NO_CACHE };
    const noStore = { "Cache-Control": CACHE.NO_STORE };
    if (url.pathname === "/.well-known/mcp.json") return jsonResponse(mcpDiscoveryDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/" || url.pathname === "") return jsonResponse({ name: "exmxc MCP Endpoint", entity: { name: ENTITY.name, domain: ENTITY.domain, founder: ENTITY.founder }, registry: `${MCP_ORIGIN}/.well-known/tool-registry.json`, openapi: `${MCP_ORIGIN}/.well-known/openapi.json`, manifest: `${MCP_ORIGIN}/.well-known/manifest.json`, capabilities: `${MCP_ORIGIN}/capabilities.json`, mcp_transport: MCP_TRANSPORT, protocol_versions: MCP_PROTOCOL_VERSIONS, tools: toolInventory(), resources: resourceInventory().map((resource) => resource.uri), health: `${MCP_ORIGIN}/health`, status: "active", discovery_protocol: "MCP Streamable HTTP", last_updated: BUILD.released }, { headers: discoveryHeaders });
    if (url.pathname === "/capabilities.json") return jsonResponse(capabilitiesDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/health") return jsonResponse({ entity: ENTITY.name, status: "healthy", mcp_status: "not_checked", registry_status: "not_checked", plugin_status: "not_checked", openapi_status: "not_checked", uptime: null, infrastructure: { platform: "Cloudflare Workers", protocol: "MCP Streamable HTTP" }, last_checked: new Date().toISOString() }, { headers: noStore });
    if (url.pathname === "/.well-known/tool-registry.json") return jsonResponse(registryDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/.well-known/openapi.json") return jsonResponse(openApiDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/.well-known/manifest.json") return jsonResponse(manifestDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/.well-known/ai-plugin.json") return jsonResponse(pluginDocument(), { headers: discoveryHeaders });
    if (url.pathname === "/speg") return jsonResponse(getSpeg(queryArgs(url, ["sector", "scarcity_layer", "ticker"])));
    if (url.pathname === "/entities") return jsonResponse(getEntities(queryArgs(url, ["industry", "entity_type", "posture", "capability"])));
    if (url.pathname === "/datasets/ai_power_index") return jsonResponse(DATASETS.ai_power_index.data);
    if (url.pathname === "/datasets/ai_power_index/schema") return jsonResponse(DATASETS.ai_power_index.schema);
    if (url.pathname === "/datasets/reality_gap_index") return jsonResponse(DATASETS.reality_gap_index.data);
    if (url.pathname === "/datasets/reality_gap_index/schema") return jsonResponse(DATASETS.reality_gap_index.schema);
    if (url.pathname === "/datasets/strategic_consequence_scenarios") return jsonResponse(DATASETS.strategic_consequence_scenarios.data);
    if (url.pathname === "/datasets/entity_registry") return jsonResponse(DATASETS.entity_registry.data);
    if (url.pathname === "/datasets/entity_clarity") return jsonResponse(DATASETS.entity_clarity_series.data);
    if (url.pathname === "/datasets/entity_clarity/snapshots/latest") return jsonResponse(DATASETS.entity_clarity_latest_snapshot.data);
    if (url.pathname === "/datasets/entity_clarity/changes/latest") return jsonResponse(DATASETS.entity_clarity_latest_changes.data);
    if (url.pathname === "/datasets/entity_clarity/releases/latest") return jsonResponse(DATASETS.entity_clarity_latest_release.data);
    if (url.pathname === "/schemas/power-lens") return jsonResponse(MCP_RESOURCES.find((resource) => resource.id === "power_lens")?.data);
    if (url.pathname === "/schemas/strategic-consequence") return jsonResponse(MCP_RESOURCES.find((resource) => resource.id === "strategic_consequence")?.data);
    if (url.pathname === "/schemas/entity-registry") return jsonResponse(MCP_RESOURCES.find((resource) => resource.id === "entity_registry_schema")?.data);
    if (url.pathname === "/schemas/eci-observation") return jsonResponse(MCP_RESOURCES.find((resource) => resource.id === "eci_observation")?.data);
    if (url.pathname === "/schemas/eci-release") return jsonResponse(MCP_RESOURCES.find((resource) => resource.id === "eci_release")?.data);
    if (url.pathname === "/datasets/four_forces") return jsonResponse(getFourForces());
    if (url.pathname === "/datasets/entity_in_a_box" || url.pathname === "/datasets/entity_in_a_box_v1") return jsonResponse(DATASETS.entity_in_a_box.data);
    if (url.pathname === "/datasets") return jsonResponse(getDatasetIndex());
    if (url.pathname === "/analysis/ai_power/top") return jsonResponse(getAiPowerTop(queryArgs(url, ["limit"])));
    if (url.pathname === "/power-lens") {
      const args = queryArgs(url, ["query"]);
      const valid = validatePowerLensQuery(args.query);
      if (!valid.ok) return jsonResponse({ success: false, error: valid.error }, { status: valid.status, headers: noStore });
      return jsonResponse(getPowerLens(args));
    }
    if (url.pathname === "/reality-gap") {
      return jsonResponse(getRealityGap(queryArgs(url, ["query", "classification", "sort", "limit"])));
    }
    if (url.pathname === "/strategic-consequence") {
      const args = queryArgs(url, ["scenario", "query", "limit"]);
      const valid = validateStrategicConsequenceArgs(args);
      if (!valid.ok) {
        return jsonResponse(
          { success: false, error: valid.error, valid_scenarios: valid.valid_scenarios ?? [] },
          { status: valid.status, headers: noStore }
        );
      }
      return jsonResponse(getStrategicConsequence(args));
    }
    if (url.pathname === "/datasets/convergence_monitor") return jsonResponse(DATASETS.convergence_monitor.data);
    if (url.pathname === "/convergence/latest") return jsonResponse(getConvergenceLatest());
    if (url.pathname === "/convergence/log") return jsonResponse(getConvergenceLog(queryArgs(url, ["limit"])));
    if (url.pathname === "/audit/run") {
      const args = queryArgs(url, ["url"]);
      const valid = validateAuditTarget(args.url);
      if (!valid.ok) return jsonResponse({ success: false, error: valid.error }, { status: valid.status, headers: noStore });
      return jsonResponse(await TOOL_HANDLERS["ex.eei.audit.run"](args), { headers: noStore });
    }
    if (url.pathname === "/schema") return jsonResponse(BUNDLED_SCHEMA);
    if (url.pathname === "/definitions") return jsonResponse(BUNDLED_DEFINITIONS);
    if (url.pathname === "/index") return jsonResponse(getIndex());
    if (url.pathname === "/api/ai-jobs-signal") return handleAdsSignal(request, url, env);
    if (url.pathname === "/__test/content-index") return jsonResponse(contentIndexResource(), { headers: noStore });
    return textResponse("Not Found", { status: 404 });
  }
};
