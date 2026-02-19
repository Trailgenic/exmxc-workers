export default {
  async fetch(request) {
    return new Response("exmxc MCP worker active", {
      headers: { "content-type": "text/plain" }
    });
  }
};
