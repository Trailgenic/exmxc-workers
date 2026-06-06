// Unused/abandoned: canonical discovery is served by the main worker at mcp.exmxc.ai.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-protocol-version"
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/.well-known/mcp.json") {
      return new Response(JSON.stringify({
        name: "exmxc",
        endpoints: {
          mcp: "https://mcp.exmxc.ai",
          mcp_transport: "https://mcp.exmxc.ai/mcp"
        },
        mcp_transport: "https://mcp.exmxc.ai/mcp",
        ontology_layers: ["entity_in_a_box_v1"],
        last_updated: "2026-06-05"
      }, null, 2), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    if (url.pathname.startsWith("/.well-known/")) {
      return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain", ...CORS_HEADERS } });
    }

    return new Response("Not Found", { status: 404, headers: { "Content-Type": "text/plain", ...CORS_HEADERS } });
  }
};
