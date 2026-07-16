import { readdir, readFile } from 'node:fs/promises';
for (const dir of ['data','schema','registry']) for (const f of await readdir(dir)) if (f.endsWith('.json')) JSON.parse(await readFile(`${dir}/${f}`,'utf8'));
console.log('json valid');
