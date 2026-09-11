export const EXMXC_WEBMCP_POWER_LENS = String.raw`
(async function () {
  if (typeof document.modelContext?.registerTool !== "function") {
    console.info("[exmxc] WebMCP is not available in this browser.");
    return;
  }

  let currentResult = null;

  function pageBridge() {
    const value = window.exmxcPowerLens;
    return value && typeof value.run === "function" && typeof value.read === "function"
      ? value
      : null;
  }

  async function runPowerLens(query) {
    const bridge = pageBridge();
    if (bridge) {
      currentResult = await bridge.run(query);
      return currentResult;
    }

    const url = new URL("https://mcp.exmxc.ai/power-lens/v2");
    url.searchParams.set("query", query);
    const responsePromise = fetch(url.toString(), { headers: { accept: "application/json" } });

    const input = document.querySelector("#pl-query");
    const button = document.querySelector("#pl-run");
    if (input instanceof HTMLInputElement && button instanceof HTMLButtonElement) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      button.click();
    }

    const response = await responsePromise;
    if (!response.ok) throw new Error("exmxc Power Lens request failed (" + response.status + ").");
    currentResult = await response.json();
    return currentResult;
  }

  function readPowerLens() {
    const bridge = pageBridge();
    return bridge ? bridge.read() : currentResult;
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
      release: data.release,
      match: data.match,
      profile: data.profile,
      evidence: data.evidence,
      methodology: data.methodology,
      coverage: data.coverage,
      suggestions: data.suggestions,
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
      title: "Read an exmxc AI Power v2 Profile",
      description: "Resolve one v2 pilot company and show its scoped AI control mechanism, evidence status, and four anchored judgments or explicit unknowns. This changes the visible page to the selected profile and does not generate a composite score or rank.",
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
        const data = await runPowerLens(query);
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
      description: "Read the v2 AI Power profile currently visible on this page, including scope, evidence, criteria, confidence, version boundaries, and disclaimer. This tool does not change the page or send data.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function () {
        const data = readPowerLens();
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
    version: "2.0",
    surface: "power-lens",
    tools: registeredTools
  };
})();
`;
