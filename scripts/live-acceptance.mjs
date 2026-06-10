const BASE = process.env.BASE || "https://mcp.exmxc.ai";
const call = async (p, m = "GET", b = null) => {
  const r = await fetch(BASE + p, {
    method: m,
    headers: b ? { "content-type": "application/json" } : {},
    body: b ? JSON.stringify(b) : undefined
  });
  let d = null; try { d = await r.json(); } catch {}
  return { status: r.status, allow: r.headers.get("Allow"), cors: r.headers.get("access-control-allow-origin"), d };
};
const rpc = (id, method, params) => call("/mcp", "POST", { jsonrpc: "2.0", id, method, params });
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + m); };

const init = await rpc(1, "initialize", { protocolVersion: "2025-06-18" });
ok(init.d?.result?.serverInfo?.name === "exmxc" && init.d.result.protocolVersion === "2025-06-18", "initialize echoes version + serverInfo");
const inited = await call("/mcp", "POST", { jsonrpc: "2.0", method: "notifications/initialized" });
ok(inited.status === 202, "notifications/initialized -> 202");
const list = await rpc(2, "tools/list", {});
const tools = (list.d?.result?.tools || []).map(t => t.name).sort();
ok(tools.length === 8, "tools/list returns 8 tools");
ok(tools.includes("ex.eei.audit.run"), "tools/list includes ex.eei.audit.run");
const ent = await rpc(3, "tools/call", { name: "ex.entities.get", arguments: { industry: "Energy" } });
const entRows = JSON.parse(ent.d.result.content[0].text);
ok(Array.isArray(entRows) && entRows.length > 0 && entRows.every(e => e.industry === "Energy"), "tools/call ex.entities.get filters");
const top = await rpc(4, "tools/call", { name: "ex.ai_power.analysis.top", arguments: { limit: 3 } });
const topRows = JSON.parse(top.d.result.content[0].text);
ok(topRows.results.length === 3 && topRows.results[0].ai_power_index >= topRows.results[2].ai_power_index, "ai_power top sorts + limits");
ok((await rpc(5, "tools/call", { name: "ex.nope" })).d?.error?.code === -32602, "unknown tool -> -32602");
ok((await rpc(6, "frobnicate", {})).d?.error?.code === -32601, "unknown method -> -32601");
const getMcp = await call("/mcp", "GET");
ok(getMcp.status === 405 && getMcp.allow === "POST", "GET /mcp -> 405 Allow: POST");

const caps = await call("/capabilities.json");
const reg = await call("/.well-known/tool-registry.json");
const capIds = (caps.d.tools || []).map(t => t.id).sort();
const regIds = (reg.d.tools || []).map(t => t.id).sort();
ok(JSON.stringify(capIds) === JSON.stringify(tools) && JSON.stringify(regIds) === JSON.stringify(tools), "tool ids consistent across capabilities/registry/tools-list");
ok(capIds.includes("ex.eei.audit.run") && regIds.includes("ex.eei.audit.run"), "capabilities and registry include ex.eei.audit.run");
ok(reg.d?.registry_version === "2.0" && regIds.length === 8, "tool-registry has version 2.0 and 8 tools");
const registryText = JSON.stringify(reg.d);
ok(!registryText.includes('"url":"https://exmxc.ai/doctrine"') && !registryText.includes('"url":"https://exmxc.ai/about"'), "tool-registry excludes stale /doctrine and /about URLs");
const auditMissingUrl = await call("/audit/run");
ok(auditMissingUrl.status === 200 && auditMissingUrl.d?.success === false && typeof auditMissingUrl.d?.error === "string", "GET /audit/run without url returns JSON error");

ok((await call("/index")).d?.total_entities === 745, "/index total_entities == 745");
const sch = await call("/datasets/ai_power_index/schema");
ok(sch.d?.$schema && (sch.d.title || "").includes("AI Power Index"), "ai_power_index/schema returns a JSON Schema");
ok(!!(await call("/datasets/four_forces")).d?.exposures, "/datasets/four_forces returns exposures");
const oa = await call("/.well-known/openapi.json");
ok(oa.d?.servers?.[0]?.url === "https://mcp.exmxc.ai" && oa.d.paths?.["/entities"] && oa.d.paths?.["/speg"], "openapi server + /entities + /speg");
ok(!!oa.d?.paths?.["/audit/run"], "openapi includes /audit/run");
ok((await call("/x", "OPTIONS")).status === 204, "OPTIONS -> 204");
ok(caps.cors === "*", "CORS present");
ok((await call("/health")).d?.uptime === null, "health uptime not fabricated");
ok((await call("/nope")).status === 404, "unknown path -> 404");

ok((await call("/.well-known/mcp.json")).d?.mcp_transport === "https://mcp.exmxc.ai/mcp", "canonical /.well-known/mcp.json advertises mcp_transport");
// apex is intentionally not served (Webflow on DNS-only apex); informational only, never fails CI
const apex = await fetch("https://exmxc.ai/.well-known/mcp.json").then(r => r.ok).catch(() => false);
console.log(apex ? "INFO apex discovery present" : "INFO apex discovery intentionally absent (canonical = mcp.exmxc.ai)");

console.log(`
${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
