# exmxc MCP Registry Submission Packet

Generated from `lib/registry.js` by running:

```bash
node scripts/build-registry-packet.mjs
```

## Canonical fields

- Name: exmxc
- Description: Human-led intelligence institution decoding AI power, entity clarity, institutional positioning, strategic doctrine, and Applied Capital Architecture.
- Server URL: https://mcp.exmxc.ai/mcp
- Transport: streamable-http
- Response mode: json
- Auth: none
- Homepage: https://exmxc.ai
- Repository: https://github.com/Trailgenic/exmxc-workers
- Version: 2.0.0
- Categories: institutional intelligence, AI capital architecture, entity intelligence
- Tool count: 7

## Tools

- ex.entities.get — Get Entity Intelligence Records: Institutional entity intelligence dataset including industry, entity_type, posture, capability, and ECC scoring.
- ex.speg.get — Get sPEG Valuation Records: Scarcity-adjusted PEG valuation dataset covering AI infrastructure companies.
- ex.datasets.index.get — Get Dataset Index: Retrieve index of all bundled datasets available through the exmxc MCP node.
- ex.ai_power_index.get — Get AI Power Index Dataset: Global AI ecosystem ranking dataset measuring compute, interface, alignment, and energy influence.
- ex.four_forces.get — Get Four Forces Exposure Dataset: Four Forces exposure scaffold for AI Power universe entities across compute, interface, alignment, and energy.
- ex.entity_in_a_box.get — Get Entity-in-a-Box Ontology: System-level ontology dataset defining AI-era entity structure across ontology, dataset, schema, MCP endpoint, and interpretation layers.
- ex.ai_power.analysis.top — Get Top AI Power Index Entities: Retrieve top-ranked entities from the AI Power Index ranking.

## Submission targets

### mcp.so

- Method: self-serve submission (web form).
- URL: https://mcp.so/
- Use the canonical fields from `registry/packet.json`.

### smithery.ai

- Method: submission/connect via GitHub.
- URL: https://smithery.ai/
- Note: a `smithery.yaml` may be required by Smithery before publication.

### glama.ai/mcp

- Method: GitHub MCP repo crawling or direct submission.
- URL: https://glama.ai/mcp
- Use the canonical fields from `registry/packet.json`.

### awesome-mcp-servers

- Method: GitHub pull request adding a list entry.
- URL: https://github.com/punkpeye/awesome-mcp-servers
- Ready-to-paste entry:

```markdown
- [exmxc](https://exmxc.ai) — institutional intelligence MCP node (sPEG valuation, entity intelligence, AI Power Index). Remote: https://mcp.exmxc.ai/mcp
```
