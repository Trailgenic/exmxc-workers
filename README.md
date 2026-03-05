# exmxc MCP Endpoint

**Institutional Intelligence. Structured for the Agentic Internet.**

This repository contains the Cloudflare Worker implementation for the official exmxc Model Context Protocol (MCP) endpoint.

The MCP endpoint exposes exmxc’s institutional intelligence capabilities — including Applied Capital Architecture and the sPEG valuation framework — in a structured, machine-readable, and agent-executable format.

---

# Purpose

exmxc exists to decode AI-era power structures, entity clarity, strategic positioning, and capital durability across the Four Forces:

- Compute  
- Interface  
- Alignment  
- Energy  

This MCP endpoint enables AI agents, systems, and institutional tools to discover, interpret, and execute exmxc capabilities through standardized protocol interfaces.

This transforms exmxc from a static content entity into an executable intelligence node.

---

# MCP Endpoint

Primary endpoint

https://mcp.exmxc.ai/

Capability index

https://mcp.exmxc.ai/capabilities.json

Health and reliability endpoint

https://mcp.exmxc.ai/health

Tool registry

https://mcp.exmxc.ai/.well-known/tool-registry.json

OpenAPI specification

https://mcp.exmxc.ai/.well-known/openapi.json

Plugin manifest

https://mcp.exmxc.ai/.well-known/ai-plugin.json

---

# Data Endpoints

The MCP endpoint also exposes structured institutional datasets used by exmxc intelligence systems.

Entity dataset

https://mcp.exmxc.ai/entities

sPEG valuation index

https://mcp.exmxc.ai/speg

These datasets allow agents to traverse the exmxc intelligence graph and combine structural analysis with valuation intelligence.

---

# Capabilities Exposed

The exmxc MCP endpoint exposes the following institutional intelligence capabilities:

- Strategy frameworks  
- Signal briefs  
- Institutional lexicon  
- Entity Clarity Index (ECI)  
- sPEG valuation intelligence  
- Applied Capital Architecture  
- Strategic doctrine  
- Standards lab architecture  
- Entity diagnostics  
- Knowledge graph search  

Each capability is exposed as a structured, machine-readable tool callable by AI agents.

Applied Capital Architecture represents the integration layer where structural doctrine informs capital allocation logic and long-horizon institutional positioning.

---

# Architecture

Infrastructure stack

- Cloudflare Workers (execution layer)
- WebMCP protocol (discovery and capability interface)
- Structured JSON capability schemas
- OpenAPI compatibility layer
- Modular dataset registry

This design ensures:

- deterministic agent interaction
- capability clarity
- execution reliability
- institutional-grade availability
- scalable dataset expansion

---

# Repository Structure

```
workers/
  worker.js        Cloudflare Worker MCP implementation
  README.md        This document

data/
  entities.json        Entity Intelligence dataset
  speg_index.json      sPEG valuation index dataset

schema/
  schema.json          Entity schema contract
  definitions.json     Semantic definitions

index.json             Dataset discovery index
```

Each dataset is exposed as a modular endpoint through the MCP worker, allowing agents to query datasets independently.

---

# Entity Intelligence Dataset

The Entity Intelligence dataset provides structured records used by the exmxc intelligence system.

Dataset fields include:

- entity_name  
- industry  
- entity_type  
- posture  
- capability  
- ecc  

Example entity record:

```json
{
  "entity_name": "BlackRock",
  "industry": "Financial",
  "entity_type": "Public Company",
  "posture": "Open",
  "capability": "High",
  "ecc": 86
}
```

This dataset powers intelligence tools including:

- Entity Clarity Index analysis
- strategic posture mapping
- institutional capability evaluation
- ecosystem influence mapping

---

# sPEG Valuation Dataset

The sPEG dataset provides a structural valuation index for AI infrastructure and capital-critical industries.

sPEG (Scarcity-adjusted PEG) integrates growth, structural scarcity, and infrastructure positioning into a unified valuation metric.

Dataset fields include:

- entity_id  
- company  
- ticker  
- sector  
- scarcity_layer  
- price_usd  
- speg  
- price_as_of  

Example record:

```json
{
  "entity_id": "nvidia",
  "company": "NVIDIA",
  "ticker": "NVDA",
  "sector": "AI Semiconductor",
  "scarcity_layer": "Compute",
  "price_usd": 182.78,
  "speg": 0.63,
  "price_as_of": "2026-02-13"
}
```

The dataset represents valuation snapshots, while the sPEG methodology itself remains durable.

---

# Entity Identity

Entity: exmxc  
Domain: https://exmxc.ai  
Founder: Mike Ye  

Classification: Institutional Intelligence System

exmxc operates as a human-led, AI-instrumented intelligence institution providing strategic clarity and capital architecture for the AI era.

---

# Role in the Agentic Internet

The exmxc MCP endpoint functions as a capability node within the global agent execution graph.

AI agents can:

- discover exmxc capabilities automatically
- execute structured intelligence queries
- integrate exmxc frameworks into decision workflows
- incorporate Applied Capital Architecture into allocation modeling
- traverse entity intelligence datasets
- integrate sPEG valuation intelligence into capital analysis
- chain exmxc capabilities with other MCP nodes

This enables institutional intelligence to be accessed programmatically rather than manually.

---

# Trust Signals

This endpoint provides:

- deterministic structured outputs
- explicit capability indexing
- health and uptime signaling
- stable institutional identity
- machine-readable schema definitions
- transparent dataset provenance

These signals enable reliable agent trust and capability prioritization.

---

# Contact

https://exmxc.ai

---

# Declaration

This MCP endpoint represents the executable intelligence layer of exmxc.

exmxc is not a content site.  
exmxc is not a trading platform.  
exmxc is not a cryptocurrency exchange.

exmxc is an institutional intelligence system.
