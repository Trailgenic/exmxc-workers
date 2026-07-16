import { readFile } from 'node:fs/promises';
import { DATA_TOOLS, BUILD } from '../lib/registry.js';
const packet = JSON.parse(await readFile('registry/packet.json','utf8'));
if (packet.version !== BUILD.version) throw new Error('registry packet version drift');
if (JSON.stringify(packet.tools.map(t=>t.name).sort()) !== JSON.stringify(DATA_TOOLS.map(t=>t.id).sort())) throw new Error('registry packet tools drift');
console.log('registry packet current');
