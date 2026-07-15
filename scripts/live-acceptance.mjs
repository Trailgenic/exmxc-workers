import { BUILD, DATA_TOOLS, MCP_PROTOCOL_VERSIONS, MCP_RESOURCES } from '../lib/registry.js';
const BASE = process.env.BASE || 'https://mcp.exmxc.ai';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function raw(path, init = {}, retry = true) {
  const r = await fetch(BASE + path, init);
  const ct = r.headers.get('content-type') || '';
  if (retry && (r.status === 429 || ct.includes('text/html'))) { await sleep(11000); return raw(path, init, false); }
  let d = null; if (ct.includes('application/json')) d = await r.json();
  return { r, d };
}
async function rpc(id, method, params, protocolVersion = MCP_PROTOCOL_VERSIONS[0], accept = 'application/json') {
  await sleep(1100);
  return raw('/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept, 'mcp-protocol-version': protocolVersion }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) });
}
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); };
for (const version of MCP_PROTOCOL_VERSIONS) { const init = await rpc(`init-${version}`, 'initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'acceptance', version: BUILD.version } }, version); ok(init.d?.result?.protocolVersion === version && init.d?.result?.serverInfo?.version === BUILD.version, `initialize negotiates ${version}`); }
ok((await rpc('bad-accept', 'ping', {}, MCP_PROTOCOL_VERSIONS[0], 'text/event-stream')).r.status === 406, 'event-stream-only accept rejected');
const list = await rpc(2, 'tools/list', {}); const tools = (list.d?.result?.tools || []).map((t) => t.name).sort(); ok(JSON.stringify(tools) === JSON.stringify(DATA_TOOLS.map((t) => t.id).sort()), 'tools/list equals registry');
const resources = await rpc(3, 'resources/list', {}); ok(JSON.stringify((resources.d?.result?.resources || []).map((r) => r.uri).sort()) === JSON.stringify(MCP_RESOURCES.filter((r) => r.includeInDiscovery).map((r) => r.uri).sort()), 'resources/list equals registry');
const restDatasets = await raw('/datasets'); const mcpDatasets = await rpc(4, 'resources/read', { uri: 'exmxc://datasets/index' }); ok(JSON.stringify(JSON.parse(mcpDatasets.d.result.contents[0].text)) === JSON.stringify(restDatasets.d), 'dataset index resource matches REST');
ok((await raw('/mcp', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } })).r.status === 403, 'disallowed origin preflight rejected');
ok((await raw('/?cb=' + Date.now())).r.headers.get('cache-control')?.includes('no-cache'), 'root discovery no-cache');
ok((await raw('/api/ai-jobs-signal')).d?.mode === 'benchmark', 'ADS benchmark only');
ok((await raw('/audit/run?url=http%3A%2F%2Flocalhost')).r.status >= 400, 'audit rejects invalid target');
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
