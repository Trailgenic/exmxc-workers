export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/mcp.json") {
      const discovery = {
        mcp_host: "https://mcp.exmxc.ai",
        registry: "https://mcp.exmxc.ai/.well-known/tool-registry.json",
        openapi: "https://mcp.exmxc.ai/.well-known/openapi.json",
        manifest: "https://mcp.exmxc.ai/.well-known/manifest.json",
        ai_plugin: "https://mcp.exmxc.ai/.well-known/ai-plugin.json"
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

    return Response.redirect("https://exmxc.ai", 302);
  }
};
