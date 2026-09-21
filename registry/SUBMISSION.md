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
- Version: 2.16.0
- Categories: institutional intelligence, AI capital architecture, entity intelligence

## Tools

- ex.consumer_intent.pulse.get — Get Consumer Intent Pulse: Versioned factor-level readings of observed digital consumer intent and wallet behavior. V1 publishes no arbitrary composite and returns insufficient_evidence below transparent coverage gates.
- ex.consumer_intent.entity.get — Get Consumer Intent Company Lens: Resolve a supported brand, retailer, company, or ticker and return its parent-company mapping, dated factor evidence, substitutions, and explicit coverage status.
- ex.ai_power.rankings.get — Get AI Power rankings: Current exmxc editorial rankings and forecasts for 50 companies in 2026, 2027, and 2030 using the fixed Four Forces methodology. Immutable monthly editions preserve prior judgments.
- ex.entities.get — Get Entity Intelligence Records: Institutional entity intelligence dataset including industry, entity_type, posture, capability, and ECC scoring.
- ex.speg.get — Get sPEG Valuation Records: Scarcity-adjusted PEG valuation dataset covering AI infrastructure companies.
- ex.speg.index.get — Get sPEG Index v1 Profiles: Evidence-backed durable-scarcity profiles with independently gated draft inclusion recommendations, immutable release semantics, full source provenance, and valuation fields kept separately nullable.
- ex.datasets.index.get — Get Dataset Index: Retrieve index of all bundled datasets available through the exmxc MCP server.
- ex.ai_power_index.get — Get Legacy AI Power Exposure Scaffold: Historical weighted exposure scaffold. Its 0–10 totals and ranks are not current evidence-backed measurements of company power.
- ex.four_forces.get — Get Legacy Four Forces Exposure Dataset: Historical v1 exposure scaffold across compute, interface, alignment, and energy; retained for compatibility, not as AI Power v2 judgments.
- ex.ai_power.profiles.get — Get AI Power v2 Evidence Profiles: Evidence-backed entity–mechanism–market–time profiles. The pilot publishes anchored judgments or explicit unknowns; it has no universal composite or league table.
- ex.power_lens.v2.get — Read an AI Power v2 Evidence Profile: Resolve a pilot company and return its scoped mechanism, Four Forces mapping, four anchored judgments or explicit unknowns, evidence status, confidence, and versioned release metadata. No universal composite or rank is generated.
- ex.entity_in_a_box.get — Get Entity-in-a-Box Ontology: System-level ontology dataset defining AI-era entity structure across ontology, dataset, schema, MCP endpoint, and interpretation layers.
- ex.power_lens.get — Generate a Legacy Power Lens v1 Card: Historical v1 exposure view. Resolves a supported company name or ticker and returns the original weighted exposure scaffold and adjacent datasets. It is not a current evidence-backed measurement of company power.
- ex.reality_gap.get — Get AI Reality Gap Scores: Retrieve the full AI Reality Gap benchmark or filter a supported company by name, alias, ticker, or classification. Scores compare public AI narrative with observed capability from dated official evidence.
- ex.strategic_consequence.get — Run a Legacy Experimental Strategic Consequence Scenario: Experimental scenario engine pinned to the legacy v1 exposure scaffold. Its relative outputs are not AI Power v2 profiles, probabilities, or universal measures of advantage.
- ex.ai_power.analysis.top — Get Legacy AI Power v1 Ranking: Retrieve historical weighted exposure rankings from the v1 scaffold. Alphabetical presentation within ties does not imply different merit.
- ex.eei.audit.run — Collect Entity Clarity Evidence: Collect page delivery, declared provider-purpose access policy, machine-readable identity evidence, a deterministic five-dimension Entity Clarity v2.1 score when assessable, a separate static-content adequacy flag, and a clearly labeled legacy website diagnostic for one public HTTPS URL.
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
