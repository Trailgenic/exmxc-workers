// Weekly AI citation tracker.
// Asks a fixed list of questions to AI answer engines that search the web,
// then records which websites each answer cites and whether our site is one of them.
// Method and decisions: docs/citation-tracker.md
//
// Usage: node scripts/track-ai-citations.mjs --site exmxc [--dry-run]
// Engines run only when their key is present: OPENAI_API_KEY, PERPLEXITY_API_KEY, ANTHROPIC_API_KEY.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const site = arg('site', 'exmxc');
const dryRun = args.includes('--dry-run');
const date = arg('date', new Date().toISOString().slice(0, 10));
const config = JSON.parse(await readFile(`data/citation_tracker/${site}.json`, 'utf8'));

const TIMEOUT = 120_000;

function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return null; }
}

function matchesDomain(host, domain) {
  return host === domain || host.endsWith(`.${domain}`);
}

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT),
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

const engines = {
  chatgpt: {
    key: () => process.env.OPENAI_API_KEY,
    async ask(question, key) {
      const payload = await postJson('https://api.openai.com/v1/responses', { authorization: `Bearer ${key}` }, {
        model: process.env.CITATION_OPENAI_MODEL || 'gpt-5.6-luna',
        tools: [{ type: 'web_search' }],
        input: question,
        store: false
      });
      const parts = (payload.output || [])
        .filter((item) => item?.type === 'message')
        .flatMap((item) => item.content || [])
        .filter((part) => part?.type === 'output_text');
      const text = parts.map((p) => p.text || '').join('\n');
      const urls = parts.flatMap((p) => (p.annotations || []).filter((a) => a?.type === 'url_citation').map((a) => a.url));
      return { text, urls };
    }
  },
  perplexity: {
    key: () => process.env.PERPLEXITY_API_KEY,
    async ask(question, key) {
      const payload = await postJson('https://api.perplexity.ai/chat/completions', { authorization: `Bearer ${key}` }, {
        model: process.env.CITATION_PERPLEXITY_MODEL || 'sonar',
        messages: [{ role: 'user', content: question }]
      });
      const text = payload.choices?.[0]?.message?.content || '';
      const urls = [
        ...(payload.citations || []),
        ...(payload.search_results || []).map((r) => r?.url)
      ].filter(Boolean);
      return { text, urls };
    }
  },
  claude: {
    key: () => process.env.ANTHROPIC_API_KEY,
    async ask(question, key) {
      const payload = await postJson('https://api.anthropic.com/v1/messages', {
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      }, {
        model: process.env.CITATION_ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
        messages: [{ role: 'user', content: question }]
      });
      const blocks = payload.content || [];
      const textBlocks = blocks.filter((b) => b?.type === 'text');
      const text = textBlocks.map((b) => b.text || '').join('');
      const urls = textBlocks.flatMap((b) => (b.citations || []).map((c) => c?.url)).filter(Boolean);
      return { text, urls };
    }
  }
};

function score(answer) {
  const domains = [...new Set(answer.urls.map(hostOf).filter(Boolean))];
  const lower = answer.text.toLowerCase();
  return {
    cited_domains: domains,
    cited_own: domains.some((h) => config.own_domains.some((d) => matchesDomain(h, d))),
    mentioned_brand: config.brand_terms.some((t) => lower.includes(t.toLowerCase())),
    watch_cited: config.watch_domains.filter((d) => domains.some((h) => matchesDomain(h, d)))
  };
}

function rollup(rows, type) {
  const set = rows.filter((r) => r.type === type && !r.error);
  const cited = set.filter((r) => r.cited_own).length;
  const mentioned = set.filter((r) => r.mentioned_brand).length;
  return {
    answered: set.length,
    errors: rows.filter((r) => r.type === type && r.error).length,
    cited_own: cited,
    mentioned_brand: mentioned,
    cited_rate: set.length ? Number((cited / set.length).toFixed(3)) : null,
    mentioned_rate: set.length ? Number((mentioned / set.length).toFixed(3)) : null
  };
}

const active = Object.entries(engines).filter(([, e]) => e.key());
if (!active.length && !dryRun) throw new Error('No engine keys present. Set OPENAI_API_KEY, PERPLEXITY_API_KEY or ANTHROPIC_API_KEY.');
console.log(`site=${site} date=${date} engines=${active.map(([n]) => n).join(',') || 'none'} questions=${config.questions.length}`);
if (dryRun) process.exit(0);

const results = {};
for (const [name, engine] of active) {
  const rows = [];
  for (const q of config.questions) {
    try {
      const answer = await engine.ask(q.text, engine.key());
      rows.push({ id: q.id, type: q.type, question: q.text, ...score(answer) });
    } catch (err) {
      rows.push({ id: q.id, type: q.type, question: q.text, error: String(err.message || err).slice(0, 300) });
    }
  }
  results[name] = rows;
}

const domainCounts = {};
for (const rows of Object.values(results)) {
  for (const r of rows) for (const d of r.cited_domains || []) domainCounts[d] = (domainCounts[d] || 0) + 1;
}
const topDomains = Object.entries(domainCounts).sort((a, b) => b[1] - a[1]).slice(0, 25)
  .map(([domain, citations]) => ({ domain, citations }));

const summary = Object.fromEntries(Object.entries(results).map(([name, rows]) => [name, {
  unbranded: rollup(rows, 'unbranded'),
  branded: rollup(rows, 'branded')
}]));

const run = { site, date, summary, top_cited_domains: topDomains, results };
await mkdir(`data/citation_tracker/runs/${site}`, { recursive: true });
await writeFile(`data/citation_tracker/runs/${site}/${date}.json`, `${JSON.stringify(run, null, 2)}\n`);

const boardPath = 'data/citation_tracker/scoreboard.json';
let board = [];
try { board = JSON.parse(await readFile(boardPath, 'utf8')); } catch { board = []; }
board = board.filter((row) => !(row.site === site && row.date === date));
for (const [engine, s] of Object.entries(summary)) board.push({ site, date, engine, ...s });
board.sort((a, b) => (a.date + a.site + a.engine).localeCompare(b.date + b.site + b.engine));
await writeFile(boardPath, `${JSON.stringify(board, null, 2)}\n`);

console.log(JSON.stringify({ summary, top_cited_domains: topDomains.slice(0, 10) }, null, 2));
