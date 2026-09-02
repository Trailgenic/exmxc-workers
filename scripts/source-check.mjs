import { readdir, readFile } from 'node:fs/promises';
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (path.includes('/node_modules/') || path.startsWith('./workers/root-discovery')) continue;
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (/\.(js|mjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}
const files = await walk('.');
for (const file of files) {
  const text = await readFile(file, 'utf8');
  if (/WebMCP\s+(?:endpoint|transport)/i.test(text)) {
    throw new Error(`WebMCP must not be described as the server transport in ${file}`);
  }
  if (/ANTHROPIC_API_KEY\s*=|ADS_SIGNAL_KEY\s*=/.test(text)) throw new Error(`Secret assignment found in ${file}`);
}
console.log(`checked ${files.length} source files`);
