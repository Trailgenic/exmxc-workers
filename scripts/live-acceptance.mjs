import { BUILD, DATA_TOOLS, MCP_PROTOCOL_VERSIONS, MCP_RESOURCES } from '../lib/registry.js';
const BASE = process.env.BASE || 'https://mcp.exmxc.ai';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function raw(path, init = {}, retry = true) {
  const response = await fetch(BASE + path, init);
  const contentType = response.headers.get('content-type') || '';
  if (retry && (response.status === 429 || contentType.includes('text/html'))) {
    await sleep(11000);
    return raw(path, init, false);
  }
  let json = null;
  if (contentType.includes('application/json')) json = await response.json();
  return { response, json, contentType };
}
async function rpc(id, method, params, { protocolHeader, accept = 'application/json' } = {}) {
  await sleep(1100);
  const headers = { 'content-type': 'application/json', accept };
  if (protocolHeader) headers['mcp-protocol-version'] = protocolHeader;
  return raw('/mcp', { method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
}
let pass = 0;
let fail = 0;
const ok = (condition, message) => { condition ? pass++ : fail++; console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`); };

for (const version of MCP_PROTOCOL_VERSIONS) {
  const init = await rpc(`init-${version}`, 'initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'acceptance', version: BUILD.version } });
  ok(init.json?.result?.protocolVersion === version && init.json?.result?.serverInfo?.version === BUILD.version, `initialize negotiates payload ${version}`);
}
ok((await rpc('bad-header', 'ping', {}, { protocolHeader: '2099-01-01' })).response.status === 400, 'invalid subsequent MCP-Protocol-Version header -> 400');
ok((await rpc('bad-accept', 'ping', {}, { accept: 'text/event-stream' })).response.status === 406, 'event-stream-only accept rejected');
const list = await rpc(2, 'tools/list', {});
const tools = (list.json?.result?.tools || []).map((tool) => tool.name).sort();
ok(JSON.stringify(tools) === JSON.stringify(DATA_TOOLS.map((tool) => tool.id).sort()), 'tools/list equals registry');
const resources = await rpc(3, 'resources/list', {});
ok(JSON.stringify((resources.json?.result?.resources || []).map((resource) => resource.uri).sort()) === JSON.stringify(MCP_RESOURCES.filter((resource) => resource.includeInDiscovery).map((resource) => resource.uri).sort()), 'resources/list equals registry');
const restDatasets = await raw('/datasets');
const mcpDatasets = await rpc(4, 'resources/read', { uri: 'exmxc://datasets/index' });
ok(JSON.stringify(JSON.parse(mcpDatasets.json.result.contents[0].text)) === JSON.stringify(restDatasets.json), 'dataset index resource matches REST');
ok((await raw('/mcp', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } })).response.status === 403, 'disallowed origin preflight rejected');
ok((await raw('/?cb=' + Date.now())).response.headers.get('cache-control')?.includes('no-cache'), 'root discovery no-cache');
ok((await raw('/api/ai-jobs-signal')).json?.mode === 'benchmark', 'ADS benchmark only');
const auditOk = await raw('/audit/run?url=https%3A%2F%2Fexample.com');
ok(auditOk.response.status < 500 && auditOk.contentType.includes('application/json'), 'audit valid controlled HTTPS target returns JSON without server error');
ok((await raw('/audit/run?url=http%3A%2F%2Flocalhost')).response.status >= 400, 'audit rejects invalid target');
const powerLens = await raw('/power-lens?query=NVDA');
ok(powerLens.json?.found === true && powerLens.json?.match?.canonical_entity === 'NVIDIA', 'Power Lens resolves ticker to deterministic company card');
ok((await raw('/power-lens')).response.status === 400, 'Power Lens rejects missing query');
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
