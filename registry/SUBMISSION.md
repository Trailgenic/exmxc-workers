# exmxc MCP Registry Submission Packet

> Verify `registry/server.json` against the current official MCP registry schema before publishing; the external schema evolves.

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
- Version: 2.6.0
- Categories: institutional intelligence, AI capital architecture, entity intelligence

## Tools

- ex.entities.get — Get Entity Intelligence Records: Institutional entity intelligence dataset including industry, entity_type, posture, capability, and ECC scoring.
- ex.speg.get — Get sPEG Valuation Records: Scarcity-adjusted PEG valuation dataset covering AI infrastructure companies.
- ex.datasets.index.get — Get Dataset Index: Retrieve index of all bundled datasets available through the exmxc MCP server.
- ex.ai_power_index.get — Get AI Power Index Dataset: Global AI ecosystem ranking dataset measuring compute, interface, alignment, and energy influence.
- ex.four_forces.get — Get Four Forces Exposure Dataset: Four Forces exposure scaffold for AI Power universe entities across compute, interface, alignment, and energy.
- ex.entity_in_a_box.get — Get Entity-in-a-Box Ontology: System-level ontology dataset defining AI-era entity structure across ontology, dataset, schema, MCP endpoint, and interpretation layers.
- ex.power_lens.get — Generate an exmxc Power Lens Card: Resolve a supported company name or ticker and synthesize its AI Power Index, Four Forces exposures, Entity Clarity record, available scarcity snapshot, coverage, and provenance.
- ex.reality_gap.get — Get AI Reality Gap Scores: Retrieve the full AI Reality Gap benchmark or filter a supported company by name, alias, ticker, or classification. Scores compare public AI narrative with observed capability from dated official evidence.
- ex.ai_power.analysis.top — Get Top AI Power Index Entities: Retrieve top-ranked entities from the AI Power Index ranking.
- ex.eei.audit.run — Run Entity Clarity (EEI) Audit: Run a live Entity Engineering Index audit against any public URL, returning entity score, tier breakdown, crawl health, and structural profile per the exmxc EEI v2.1 methodology.
- ex.convergence.latest — Get Latest Convergence Read: Retrieve the most recent weekly read of the AI Infrastructure Convergence Framework — overall status, count of categories in breach, per-signal state (Latent/Watch/Breach/Pending), and exit posture. Derived reference layer; not investment advice.
- ex.convergence.log — Get Convergence Monitor Log: Retrieve the longitudinal weekly log of convergence reads — each entry time-stamping status, breach count, categories breached, per-signal state, and posture. Optional limit returns the most recent N entries (newest first). Derived reference layer; not investment advice.

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
- [exmxc](https://exmxc.ai) — institutional intelligence MCP server (sPEG valuation, entity intelligence, AI Power Index). Remote: https://mcp.exmxc.ai/mcp
```
