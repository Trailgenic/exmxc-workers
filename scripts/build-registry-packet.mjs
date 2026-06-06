import { mkdir, writeFile } from "node:fs/promises";
import { BUILD, DATA_TOOLS, ENTITY, MCP_TRANSPORT } from "../lib/registry.js";

const REGISTRY_DIR = new URL("../registry/", import.meta.url);
const REPOSITORY = "https://github.com/Trailgenic/exmxc-workers";
const CATEGORIES = ["institutional intelligence", "AI capital architecture", "entity intelligence"];
const REMOTE_TYPE = "streamable-http";

const tools = DATA_TOOLS.map(({ id, title, description }) => ({
  name: id,
  title,
  description
}));

const packet = {
  name: ENTITY.name,
  description: ENTITY.description,
  server_url: MCP_TRANSPORT,
  transport: REMOTE_TYPE,
  response_mode: "json",
  auth: "none",
  homepage: ENTITY.domain,
  repository: REPOSITORY,
  version: BUILD.version,
  categories: CATEGORIES,
  tool_count: tools.length,
  tools
};

const server = {
  name: "io.github.trailgenic/exmxc-workers",
  description: ENTITY.description,
  status: "active",
  version: BUILD.version,
  homepage: ENTITY.domain,
  repository: {
    url: REPOSITORY,
    source: "github"
  },
  remotes: [
    {
      type: REMOTE_TYPE,
      url: MCP_TRANSPORT
    }
  ]
};

const submission = `# exmxc MCP Registry Submission Packet

Generated from \`lib/registry.js\` by running:

\`\`\`bash
node scripts/build-registry-packet.mjs
\`\`\`

## Canonical fields

- Name: ${packet.name}
- Description: ${packet.description}
- Server URL: ${packet.server_url}
- Transport: ${packet.transport}
- Response mode: ${packet.response_mode}
- Auth: ${packet.auth}
- Homepage: ${packet.homepage}
- Repository: ${packet.repository}
- Version: ${packet.version}
- Categories: ${packet.categories.join(", ")}
- Tool count: ${packet.tool_count}

## Tools

${packet.tools.map((tool) => `- ${tool.name} — ${tool.title}: ${tool.description}`).join("\n")}

## Submission targets

### mcp.so

- Method: self-serve submission (web form).
- URL: https://mcp.so/
- Use the canonical fields from \`registry/packet.json\`.

### smithery.ai

- Method: submission/connect via GitHub.
- URL: https://smithery.ai/
- Note: a \`smithery.yaml\` may be required by Smithery before publication.

### glama.ai/mcp

- Method: GitHub MCP repo crawling or direct submission.
- URL: https://glama.ai/mcp
- Use the canonical fields from \`registry/packet.json\`.

### awesome-mcp-servers

- Method: GitHub pull request adding a list entry.
- URL: https://github.com/punkpeye/awesome-mcp-servers
- Ready-to-paste entry:

\`\`\`markdown
- [exmxc](https://exmxc.ai) — institutional intelligence MCP node (sPEG valuation, entity intelligence, AI Power Index). Remote: https://mcp.exmxc.ai/mcp
\`\`\`
`;

await mkdir(REGISTRY_DIR, { recursive: true });
await writeFile(new URL("packet.json", REGISTRY_DIR), `${JSON.stringify(packet, null, 2)}\n`);
await writeFile(
  new URL("server.json", REGISTRY_DIR),
  `// VERIFY against the current official MCP registry schema before publishing — schema evolves.\n${JSON.stringify(server, null, 2)}\n`
);
await writeFile(new URL("SUBMISSION.md", REGISTRY_DIR), submission);

console.log(`Wrote registry packet with ${tools.length} tools to ${REGISTRY_DIR.pathname}`);
