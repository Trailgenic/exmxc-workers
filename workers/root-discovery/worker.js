export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/.well-known/mcp.json") {
      return new Response(JSON.stringify({
        name: "exmxc",
        endpoints: {
          mcp: "https://mcp.exmxc.ai"
        },
        ontology_layers: ["entity_in_a_box_v1"]
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname.startsWith("/.well-known/")) {
      return new Response("Not Found", { status: 404 });
    }

    return Response.redirect("https://exmxc.ai", 302);
  }
};
