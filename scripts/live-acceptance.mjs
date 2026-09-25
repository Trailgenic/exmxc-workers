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
const commerce = await raw('/ai-commerce/signal');
ok(
  commerce.response.status === 200
    && commerce.json?.methodology_id === 'ai-commerce-v1.0.0'
    && commerce.json?.coverage?.verified_episode_count === 0
    && commerce.json?.coverage?.transaction_event_count === 0
    && commerce.json?.benchmarks?.length === 4
    && commerce.json?.benchmarks?.every(row => row.denominator && row.source_url),
  'AI commerce separates sourced benchmarks from unobserved transactions'
);
ok(commerce.json?.search_interest?.source === 'Google Trends'
  && commerce.json?.search_interest?.last_complete_week === '2026-09-13'
  && JSON.stringify(commerce.json?.search_interest?.series?.map(row => row.points.at(-1).index)) === '[13,5]'
  && commerce.json?.search_interest?.excluded_incomplete_weeks?.includes('2026-09-20'),
  'AI commerce exposes reproducible completed-week Google Trends series');
ok((await raw('/ai-commerce/methodology')).json?.publication_policy?.transaction_rule?.includes('explicit'), 'AI commerce methodology requires purchase evidence');
ok((await raw('/schemas/ai-commerce-episode-v1')).json?.$id === 'https://mcp.exmxc.ai/schemas/ai-commerce-episode-v1', 'AI commerce episode schema is live');
ok((await raw('/consumer-intent/pulse')).response.status === 410, 'legacy wallet endpoint is retired');
ok((await raw('/api/ai-jobs-signal')).json?.mode === 'benchmark', 'ADS benchmark only');
const auditOk = await raw('/audit/run?url=https%3A%2F%2Fexample.com');
ok(
  auditOk.response.status === 200
    && auditOk.json?.methodology === 'Entity Clarity evidence v2.1-pilot'
    && auditOk.json?.assessment?.assessment_mode === 'automated_deterministic'
    && typeof auditOk.json?.assessment?.score === 'number'
    && ['adequate', 'limited'].includes(auditOk.json?.assessment?.content_adequacy?.status),
  'audit returns automated Entity Clarity v2.1 with static-content adequacy'
);
ok((await raw('/audit/run?url=http%3A%2F%2Flocalhost')).response.status >= 400, 'audit rejects invalid target');
const powerLens = await raw('/power-lens?query=NVDA');
ok(powerLens.json?.found === true && powerLens.json?.model_status === 'legacy_exposure_scaffold' && powerLens.json?.current_authority === false, 'Legacy Power Lens v1 exposes its compatibility boundary');
ok((await raw('/power-lens')).response.status === 400, 'Power Lens rejects missing query');
const powerLensV2 = await raw('/power-lens/v2?query=NVDA');
ok(powerLensV2.json?.found === true && powerLensV2.json?.match?.canonical_entity === 'NVIDIA' && powerLensV2.json?.coverage?.composite_score_available === false, 'Power Lens v2 returns an evidence profile without a composite');
ok((await raw('/power-lens/v2')).response.status === 400, 'Power Lens v2 rejects missing query');
const powerProfilesV2 = await raw('/datasets/ai_power_profiles_v2');
ok(powerProfilesV2.json?.total_profiles === 20 && powerProfilesV2.json?.release_status === 'staging', 'AI Power v2 staging release declares 20 pilot profiles');
ok((await raw('/schemas/ai-power-source-manifest-v2')).json?.$id === 'https://mcp.exmxc.ai/schemas/ai-power-source-manifest/v2', 'AI Power v2 source manifest schema is live');
const spegIndex = await raw('/speg/index/v1');
ok(
  spegIndex.json?.release_id === 'speg-index-2026-09-17-v1'
    && spegIndex.json?.release_state === 'released'
    && spegIndex.json?.coverage?.candidate_count === 10
    && spegIndex.json?.coverage?.include_recommendations === 5
    && spegIndex.json?.coverage?.released_members === 5
    && spegIndex.json?.coverage?.qualified_member_count === 5
    && spegIndex.json?.membership_mutated === true
    && spegIndex.json?.profiles?.filter((profile) => profile?.decision?.membership_state === 'member').length === 5
    && spegIndex.json?.profiles?.filter((profile) => profile?.decision?.research_decision === 'watchlist').every((profile) => profile?.decision?.membership_state === null)
    && spegIndex.json?.profiles?.every((profile) => profile?.valuation?.sds_used_as_valuation_input === false),
  'sPEG Index v1 exposes five released members without valuation coupling'
);
const spegRc1 = await raw('/speg/index/v1/releases/speg-index-2026-09-17-rc1');
ok(
  spegRc1.json?.release_state === 'draft'
    && spegRc1.json?.coverage?.released_members === 0
    && spegRc1.json?.membership_mutated === false
    && spegRc1.json?.profiles?.every((profile) => profile?.decision?.membership_state === null),
  'sPEG Index exact RC1 remains a non-membership draft'
);
const spegIndexResource = await rpc(5, 'resources/read', { uri: 'exmxc://datasets/speg-index/v1' });
ok(JSON.stringify(JSON.parse(spegIndexResource.json.result.contents[0].text)) === JSON.stringify(spegIndex.json), 'sPEG Index MCP resource matches REST');
ok((await raw('/speg/index/v1/profiles/not-a-company')).response.status === 404, 'sPEG Index rejects unknown issuer');
ok((await raw('/speg/index/v1/releases/not-a-release')).response.status === 404, 'sPEG Index rejects unknown release');
ok((await raw('/schemas/speg-index-profile-v1')).json?.$id === 'https://mcp.exmxc.ai/schemas/speg-index-profile/v1', 'sPEG Index profile schema is live');
const realityGap = await raw('/reality-gap?query=AAPL');
ok(realityGap.json?.found === true && realityGap.json?.results?.[0]?.classification === 'narrative_outrunning_deployment', 'Reality Gap resolves Apple with versioned classification');
ok((await raw('/datasets/reality_gap_index')).json?.rows?.length === 10, 'Reality Gap raw dataset exposes ten-company V1 benchmark');
const consequence = await raw('/strategic-consequence?scenario=power_binding_constraint&query=NVDA&limit=3');
ok(
  consequence.json?.found === true
    && consequence.json?.model_status === 'experimental_legacy_v1'
    && consequence.json?.scenario?.id === 'power_binding_constraint'
    && consequence.json?.entity_result?.entity_name === 'NVIDIA'
    && consequence.json?.first_order?.most_advantaged?.[0]?.entity_name === 'Constellation Energy',
  'Strategic Consequence Engine propagates canonical power scenario with entity-specific result'
);
ok((await raw('/strategic-consequence')).response.status === 400, 'Strategic Consequence Engine rejects missing scenario');
ok((await raw('/datasets/strategic_consequence_scenarios')).json?.scenarios?.length === 6, 'Strategic Consequence scenario library exposes six canonical counterfactuals');
ok((await raw('/schemas/strategic-consequence')).json?.$id === 'https://mcp.exmxc.ai/schemas/strategic-consequence', 'Strategic Consequence response schema is live');
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
