import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SELF } from 'cloudflare:test';
import { readFile } from 'node:fs/promises';
import { BUILD, DATA_TOOLS, MCP_RESOURCES } from '../lib/registry.js';
import { contentIndexResource, mcpResourceProjection } from '../lib/mcp-server.js';

const BASE = 'https://mcp.exmxc.ai';
const toolIds = () => DATA_TOOLS.map((tool) => tool.id).sort();
const resourceUris = () => MCP_RESOURCES.filter((resource) => resource.includeInDiscovery).map((resource) => resource.uri).sort();
const validArgs = {
  'ex.entities.get': { industry: 'Energy' },
  'ex.speg.get': { ticker: 'NVDA' },
  'ex.datasets.index.get': {},
  'ex.ai_power_index.get': {},
  'ex.four_forces.get': {},
  'ex.entity_in_a_box.get': {},
  'ex.power_lens.get': { query: 'NVDA' },
  'ex.reality_gap.get': { query: 'AAPL' },
  'ex.ai_power.analysis.top': { limit: 1 },
  'ex.eei.audit.run': { url: 'https://example.com' },
  'ex.convergence.latest': {},
  'ex.convergence.log': { limit: 1 }
};
expect(Object.keys(validArgs).sort()).toEqual(toolIds());

function req(path, init = {}) {
  return SELF.fetch(`${BASE}${path}`, init);
}

function mcp(body, headers = {}) {
  return req('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

async function rpc(method, params = {}, id = 1, headers = {}) {
  const response = await mcp({ jsonrpc: '2.0', id, method, params }, headers);
  const text = await response.text();
  return { response, text, json: text ? JSON.parse(text) : null };
}

function normalizeSchema(value) {
  if (Array.isArray(value)) return value.map(normalizeSchema).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== '$schema')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, child]) => [key, key === 'required' && Array.isArray(child) ? [...child].sort() : normalizeSchema(child)]));
}

function mockExternalFetch() {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (input) => {
    const url = String(input?.url || input);
    calls.push(url);
    if (url.includes('exmxc-audit.vercel.app')) {
      return new Response(JSON.stringify({ success: true, score: 91, url }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (url.includes('api.anthropic.com')) {
      return new Response(JSON.stringify({ content: [{ text: JSON.stringify([{ posting_id: 'synthetic-001', title: 'AI Agent Engineer', skills_raw: ['MCP'] }]) }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    return SELF.fetch(input);
  }));
  return calls;
}

beforeEach(() => vi.restoreAllMocks());

describe('MCP protocol and transport policy', () => {
  it('negotiates supported initialize payload versions and rejects invalid subsequent headers', async () => {
    for (const version of ['2025-11-25', '2025-06-18']) {
      const { json } = await rpc('initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'vitest', version: BUILD.version } });
      expect(json.result.protocolVersion).toBe(version);
      expect(json.result.serverInfo.version).toBe(BUILD.version);
    }
    const fabricated = await rpc('initialize', { protocolVersion: '2099-01-01', capabilities: {}, clientInfo: { name: 'vitest', version: BUILD.version } });
    expect(fabricated.json.result.protocolVersion).not.toBe('2099-01-01');
    expect((await rpc('ping', {}, 9, { 'mcp-protocol-version': '2099-01-01' })).response.status).toBe(400);
  });

  it('applies Accept and Content-Type tables including normalization through SDK', async () => {
    const accepted = [undefined, '', '*/*', 'application/json', 'Application/JSON; Charset=UTF-8', 'application/json, text/event-stream'];
    for (const accept of accepted) {
      const headers = { 'content-type': 'application/json' };
      if (accept !== undefined) headers.accept = accept;
      const response = await req('/mcp', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id: accept || 'missing', method: 'ping', params: {} }) });
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect((await mcp({ jsonrpc: '2.0', id: 1, method: 'ping' }, { accept: 'text/event-stream' })).status).toBe(406);
    expect((await mcp({ jsonrpc: '2.0', id: 1, method: 'ping' }, { accept: 'application/json;q=0, text/event-stream' })).status).toBe(406);
    expect((await mcp({ jsonrpc: '2.0', id: 1, method: 'ping' }, { accept: 'text/plain' })).status).toBe(406);
    expect((await req('/mcp', { method: 'POST', headers: { 'content-type': 'text/plain', accept: 'application/json' }, body: '{}' })).status).toBe(415);
  });

  it('applies origin CORS to preflight, early errors, and SDK responses', async () => {
    expect((await req('/mcp', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } })).status).toBe(403);
    const preflight = await req('/mcp', { method: 'OPTIONS', headers: { origin: 'https://exmxc.ai' } });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://exmxc.ai');
    const early = await req('/mcp', { method: 'GET', headers: { origin: 'https://exmxc.ai' } });
    expect(early.status).toBe(405);
    expect(early.headers.get('access-control-allow-origin')).toBe('https://exmxc.ai');
    const sdk = await mcp({ jsonrpc: '2.0', id: 1, method: 'ping' }, { origin: 'https://mcp.exmxc.ai' });
    expect(sdk.headers.get('access-control-allow-origin')).toBe('https://mcp.exmxc.ai');
  });

  it('uses per-request server isolation', async () => {
    const one = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'a', version: '1' } }, 1);
    const two = await rpc('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'b', version: '1' } }, 2);
    expect(one.json.id).toBe(1);
    expect(two.json.id).toBe(2);
    expect(one.json.result.protocolVersion).toBe('2025-06-18');
    expect(two.json.result.protocolVersion).toBe('2025-11-25');
  });
});

describe('tools and schemas', () => {
  it('lists schemas semantically equal to registry schemas', async () => {
    const { json } = await rpc('tools/list');
    const byName = Object.fromEntries(json.result.tools.map((tool) => [tool.name, tool]));
    for (const tool of DATA_TOOLS) expect(normalizeSchema(byName[tool.id].inputSchema)).toEqual(normalizeSchema(tool.inputSchema));
  });

  it('successfully calls every registered tool with exhaustive fixtures', async () => {
    mockExternalFetch();
    for (const id of toolIds()) {
      const { json } = await rpc('tools/call', { name: id, arguments: validArgs[id] }, id);
      expect(json.result.content[0].type).toBe('text');
      const parsed = JSON.parse(json.result.content[0].text);
      if (Array.isArray(parsed)) expect(json.result.structuredContent).toBeUndefined();
      else expect(json.result.structuredContent).toEqual(parsed);
    }
  });

  it('rejects invalid arguments, unknown fields, and unknown tools', async () => {
    const missing = await rpc('tools/call', { name: 'ex.eei.audit.run', arguments: {} });
    expect(missing.json.result.isError).toBe(true);
    const unknownField = await rpc('tools/call', { name: 'ex.ai_power.analysis.top', arguments: { limit: 1, extra: true } });
    expect(unknownField.json.result.isError).toBe(true);
    const unknownTool = await rpc('tools/call', { name: 'ex.nope', arguments: {} });
    expect(unknownTool.json.error.code).toBe(-32602);
  });

  it('generates deterministic Power Lens cards from company names and ticker aliases', async () => {
    const byTicker = await req('/power-lens?query=NVDA');
    expect(byTicker.status).toBe(200);
    const card = await byTicker.json();
    expect(card.found).toBe(true);
    expect(card.match.canonical_entity).toBe('NVIDIA');
    expect(card.power.ai_power_index).toBe(8.6);
    expect(card.power.rank).toBeGreaterThan(0);
    expect(card.four_forces).toHaveLength(4);
    expect(card.four_forces.reduce((sum, force) => sum + force.weighted_contribution, 0)).toBe(8.6);
    expect(card.entity_clarity.ecc).toBeTypeOf('number');
    expect(card.scarcity.ticker).toBe('NVDA');
    expect(card.scarcity.snapshot_date).toBe('2026-07-16');
    expect(card.scarcity.speg).toBe(0.27);
    expect(card.scarcity.calculation_method).toBe('forward_fiscal_eps_midpoint_proxy');
    expect(card.scarcity.forward_pe).toBe(24.69);
    expect(card.reality_gap.ai_narrative_score).toBe(100);
    expect(card.reality_gap.ai_capability_score).toBe(97);
    expect(card.reality_gap.reality_gap).toBe(-3);
    expect(card.reality_gap.classification).toBe('narrative_capability_aligned');
    expect(card.reality_gap.evidence[0].url).toContain('investor.nvidia.com');
    expect(card.coverage.reality_gap.status).toBe('scored');

    const byAlias = await (await req('/power-lens?query=Alphabet')).json();
    expect(byAlias.match.canonical_entity).toBe('Google');
    expect(byAlias.match.matched_on).toBe('alias_or_ticker');

    const skHynix = await (await req('/power-lens?query=SKHY')).json();
    expect(skHynix.match.canonical_entity).toBe('SK Hynix');
    expect(skHynix.scarcity.ticker).toBe('000660.KS');
    expect(skHynix.scarcity.input_confidence).toBe('low');

    const [wdc] = await (await req('/speg?ticker=WDC')).json();
    expect(wdc.speg_display).toBe('≤0.38');
    expect(wdc.growth_is_lower_bound).toBe(true);

    const notFound = await (await req('/power-lens?query=NVIDA')).json();
    expect(notFound.found).toBe(false);
    expect(notFound.suggestions).toContain('NVIDIA');
    expect((await req('/power-lens')).status).toBe(400);

    const appleGap = await (await req('/reality-gap?query=AAPL')).json();
    expect(appleGap.found).toBe(true);
    expect(appleGap.results).toHaveLength(1);
    expect(appleGap.results[0].entity_name).toBe('Apple');
    expect(appleGap.results[0].reality_gap).toBe(-26);
    expect(appleGap.results[0].classification).toBe('narrative_outrunning_deployment');

    const rankedGaps = await (await req('/reality-gap?limit=2')).json();
    expect(rankedGaps.results.map((row) => row.entity_name)).toEqual(['Apple', 'Adobe']);
    expect(rankedGaps.methodology.scoring_anchors.capability_components).toHaveLength(5);
    expect(rankedGaps.methodology.confidence_policy.high).toContain('quantified');

    const openApi = await (await req('/.well-known/openapi.json')).json();
    const gapParameters = openApi.paths['/reality-gap'].get.parameters;
    expect(gapParameters.find((parameter) => parameter.name === 'query').required).toBe(false);
    expect(gapParameters.find((parameter) => parameter.name === 'classification').schema.enum).toContain('quiet_compounder');
    expect(gapParameters.find((parameter) => parameter.name === 'limit').schema.maximum).toBe(100);
    expect(openApi.paths['/power-lens'].get.parameters.find((parameter) => parameter.name === 'query').required).toBe(true);

    const unscored = await (await req('/power-lens?query=TSM')).json();
    expect(unscored.reality_gap).toBeNull();
    expect(unscored.coverage.reality_gap.status).toBe('not_scored');
  });
});

describe('resources', () => {
  it('lists registry-derived public resource projection', async () => {
    const { json } = await rpc('resources/list');
    const simplified = json.result.resources.map(({ uri, name, title, description, mimeType }) => ({ uri, name, title, description, mimeType })).sort((a, b) => a.uri.localeCompare(b.uri));
    expect(simplified).toEqual(mcpResourceProjection().sort((a, b) => a.uri.localeCompare(b.uri)));
    expect(simplified.map((resource) => resource.uri).sort()).toEqual(resourceUris());
  });

  it('reads every route-backed resource equal to REST and content index equal to resolver', async () => {
    for (const resource of MCP_RESOURCES.filter((entry) => entry.includeInDiscovery)) {
      const { json } = await rpc('resources/read', { uri: resource.uri }, resource.uri);
      const readPayload = JSON.parse(json.result.contents[0].text);
      if (resource.uri === 'exmxc://content/index') {
        expect(readPayload).toEqual(contentIndexResource());
      } else if (resource.route) {
        const rest = await req(resource.route);
        expect(readPayload).toEqual(await rest.json());
      }
    }
  });
});

describe('ADS, audit, cache, and registry', () => {
  it('hardens ADS benchmark and paid rejection paths without Anthropic fetches', async () => {
    const calls = mockExternalFetch();
    const benchmark1 = await (await req('/api/ai-jobs-signal')).json();
    const benchmark2 = await (await req('/api/ai-jobs-signal')).json();
    expect(benchmark1).toEqual(benchmark2);
    expect((await req('/api/ai-jobs-signal?mode=signal')).status).toBe(405);
    expect((await req('/api/ai-jobs-signal', { method: 'POST', body: '{not-json' })).status).toBe(401);
    expect((await req('/api/ai-jobs-signal', { method: 'POST', headers: { authorization: 'Bearer undefined' }, body: JSON.stringify({ query: 'x', count: 1 }) })).status).toBe(401);
    expect(calls.filter((url) => url.includes('api.anthropic.com'))).toHaveLength(0);
  });

  it('validates and mocks audit targets', async () => {
    mockExternalFetch();
    expect((await req('/audit/run?url=http%3A%2F%2Fexample.com')).status).toBe(400);
    expect((await req('/audit/run?url=https%3A%2F%2Flocalhost')).status).toBe(400);
    const ok = await req('/audit/run?url=https%3A%2F%2Fexample.com');
    expect(ok.status).toBe(200);
    expect((await ok.json()).success).toBe(true);
  });

  it('asserts route-class cache headers', async () => {
    expect((await req('/health')).headers.get('cache-control')).toBe('no-store');
    expect((await req('/')).headers.get('cache-control')).toBe('no-cache');
    expect((await req('/.well-known/openapi.json')).headers.get('cache-control')).toBe('no-cache');
    expect((await req('/entities')).headers.get('cache-control')).toBe('public, max-age=3600');
    expect((await req('/power-lens?query=NVDA')).headers.get('cache-control')).toBe('public, max-age=3600');
    expect((await req('/api/ai-jobs-signal')).headers.get('cache-control')).toBe('public, max-age=3600');
    expect((await req('/audit/run?url=http%3A%2F%2Flocalhost')).headers.get('cache-control')).toBe('no-store');
  });

  it('detects registry packet drift', async () => {
    const packet = (await import('../registry/packet.json', { with: { type: 'json' } })).default;
    expect(packet.version).toBe(BUILD.version);
    expect(packet.tools.map((tool) => tool.name).sort()).toEqual(toolIds());
  });
});
