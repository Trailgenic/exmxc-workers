export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version"
};

export const JSON_HEADERS = {
  "Content-Type": "application/json",
  ...CORS_HEADERS,
  "Cache-Control": "public, max-age=3600"
};

export function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    ...init,
    headers: {
      ...JSON_HEADERS,
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
