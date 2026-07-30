import { readdir, readFile } from "node:fs/promises";

const files = (await readdir("webflow"))
  .filter((file) => file.endsWith(".html"))
  .sort();

let scriptCount = 0;
for (const file of files) {
  const html = await readFile(`webflow/${file}`, "utf8");
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    scriptCount += 1;
    const attributes = match[1];
    const source = match[2];
    if (/application\/ld\+json/i.test(attributes)) {
      JSON.parse(source);
    } else {
      // Parse browser JavaScript without executing DOM or network behavior.
      new Function(source);
    }
  }
}

console.log(`webflow valid: ${files.length} files, ${scriptCount} scripts`);
