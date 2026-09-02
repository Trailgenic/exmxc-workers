export const EXMXC_WEBMCP_POWER_LENS = String.raw`
(async function () {
  if (typeof document.modelContext?.registerTool !== "function") {
    console.info("[exmxc] WebMCP is not available in this browser.");
    return;
  }

  function bridge() {
    const value = window.exmxcPowerLens;
    if (!value || typeof value.run !== "function" || typeof value.read !== "function") {
      throw new Error("exmxc Power Lens is not ready on this page.");
    }
    return value;
  }

  function validateInput(input) {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new TypeError("Power Lens input must be an object.");
    }
    const keys = Object.keys(input);
    if (keys.length !== 1 || keys[0] !== "query") {
      throw new TypeError("Power Lens accepts exactly one field: query.");
    }
    const query = String(input.query || "").trim();
    if (!query) throw new TypeError("Power Lens query is required.");
    if (query.length > 120) throw new TypeError("Power Lens query must be 120 characters or fewer.");
    return query;
  }

  function project(data) {
    return {
      completed: true,
      product: data.product,
      version: data.version,
      generated_at: data.generated_at,
      match: data.match,
      power: data.power,
      four_forces: data.four_forces,
      entity_clarity: data.entity_clarity,
      scarcity: data.scarcity,
      reality_gap: data.reality_gap,
      interpretation: data.interpretation,
      coverage: data.coverage,
      provenance: data.provenance,
      disclaimer: data.disclaimer
    };
  }

  function toolResult(result) {
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result
    };
  }

  const tools = [
    {
      name: "run_exmxc_power_lens",
      title: "Run exmxc Power Lens",
      description: "Map one supported company or ticker through exmxc's deterministic AI Power Index, Four Forces, Entity Clarity, scarcity, and AI Reality Gap layers. This changes the visible page to the generated Power Card. It does not use live market data, place a trade, or provide investment advice.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 120,
            description: "Supported company name, common alias, or public-market ticker."
          }
        },
        required: ["query"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false },
      execute: async function (input) {
        const query = validateInput(input);
        const data = await bridge().run(query);
        if (!data) throw new Error("exmxc Power Lens did not return a result.");
        if (!data.found) {
          const suffix = Array.isArray(data.suggestions) && data.suggestions.length
            ? " Suggestions: " + data.suggestions.join(", ") + "."
            : "";
          throw new Error("No bundled exmxc Power Lens record matched " + query + "." + suffix);
        }
        return toolResult(project(data));
      }
    },
    {
      name: "get_exmxc_power_lens_result",
      title: "Read exmxc Power Lens Result",
      description: "Read the exmxc Power Card currently visible on this page, including its AI Power rank, Four Forces exposures, evidence layers, coverage boundaries, provenance, and disclaimer. This tool does not change the page or send data.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function () {
        const data = bridge().read();
        if (!data || !data.found) {
          return toolResult({
            completed: false,
            message: "No completed exmxc Power Lens result is visible. Run Power Lens first."
          });
        }
        return toolResult(project(data));
      }
    }
  ];

  const registeredTools = [];
  for (const tool of tools) {
    try {
      await document.modelContext.registerTool(tool);
      registeredTools.push(tool.name);
      console.info("[exmxc] WebMCP tool registered: " + tool.name);
    } catch (error) {
      console.error("[exmxc] WebMCP tool registration failed: " + tool.name, error);
    }
  }

  window.__exmxcWebMCP = {
    version: "1.0",
    surface: "power-lens",
    tools: registeredTools
  };
})();
`;
