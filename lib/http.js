export const CACHE = {
  NO_STORE: "no-store",
  NO_CACHE: "no-cache",
  PUBLIC: "public, max-age=3600"
};

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version, authorization"
};

export function mcpCorsHeaders(request, env = {}) {
  const origin = request.headers.get("Origin");
  const allowed = String(env.MCP_ALLOWED_ORIGINS || "https://exmxc.ai,https://www.exmxc.ai,https://mcp.exmxc.ai")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const base = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, mcp-protocol-version",
    "Cache-Control": CACHE.NO_STORE
  };
  if (!origin) return base;
  if (!allowed.includes(origin)) return { ...base, "Vary": "Origin" };
  return { ...base, "Access-Control-Allow-Origin": origin, "Vary": "Origin" };
}

export function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      "Cache-Control": CACHE.PUBLIC,
      ...(init.headers || {})
    }
  });
}

export function emptyResponse(init = {}) {
  return new Response(null, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init.headers || {})
    }
  });
}

export function textResponse(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      "Content-Type": "text/plain",
      ...CORS_HEADERS,
      ...(init.headers || {})
    }
  });
}
