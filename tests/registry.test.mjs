import assert from 'node:assert/strict';
import { DATA_TOOLS, MCP_RESOURCES, MCP_PROTOCOL_VERSIONS } from '../lib/registry.js';
assert.equal(new Set(DATA_TOOLS.map(t=>t.id)).size, DATA_TOOLS.length);
assert.ok(MCP_PROTOCOL_VERSIONS.includes('2025-11-25'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://datasets/index'));
assert.ok(MCP_RESOURCES.some(r=>r.uri === 'exmxc://content/index'));
console.log('registry invariants pass');
