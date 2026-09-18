import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getPowerRankings, POWER_EDITIONS, POWER_METHODOLOGY, powerScore } from '../lib/ai-power-rankings.js';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(powerScore({compute:80,interface:60,alignment:40,energy:20}),65);
assert.throws(()=>powerScore({compute:101,interface:50,alignment:50,energy:50}));
assert.equal(getPowerRankings({edition:'missing'}).status,404);
assert.equal(getPowerRankings({year:'2028'}).status,400);
assert.equal(hash(await readFile('data/ai_power_rankings/methodology.json')),POWER_EDITIONS.methodology_sha256);
assert.equal(POWER_METHODOLOGY.id,'ai-power-rankings-1.0.0');
for(const item of POWER_EDITIONS.editions) {
  assert.equal(hash(await readFile(`data/ai_power_rankings/editions/${item.edition_id}.json`)),item.sha256);
  for(const year of [2026,2027,2030]) {
    const data=getPowerRankings({edition:item.edition_id,year});
    assert.equal(data.rows.length,50);assert.equal(new Set(data.rows.map(r=>r.id)).size,50);
    assert.deepEqual(data.rows.map(r=>r.assessments[year].rank),Array.from({length:50},(_,i)=>i+1));
    assert.ok(data.rows.every((r,i)=>i===0||data.rows[i-1].assessments[year].score_unrounded>=r.assessments[year].score_unrounded));
    assert.ok(data.rows.every(r=>r.sources.length&&r.thesis&&r.reconsider_if));
  }
}
// Independent approved baseline table: preserve all 150 displayed scores and ranks.
const report=await readFile('docs/ai-power-rankings-baseline-2026-09-18.md','utf8');
const approved=report.split('\n').filter(l=>/^\| \d+ \|/.test(l)).slice(0,50);
const baseline=getPowerRankings({edition:'2026-09-18'});
assert.equal(approved.length,50);
for(const line of approved) {
  const cells=line.split('|').slice(1,-1).map(s=>s.trim());
  const row=baseline.rows.find(r=>r.company===cells[1]);assert.ok(row);
  for(const [year,rankIndex,scoreIndex] of [[2026,0,2],[2027,3,4],[2030,5,6]]) {
    assert.equal(row.assessments[year].rank,Number(cells[rankIndex]));
    assert.equal(row.assessments[year].score.toFixed(1),cells[scoreIndex]);
  }
}
// Request sorting must not mutate the baseline or another horizon.
getPowerRankings({year:2030});assert.equal(getPowerRankings().rows[2].company,'Amazon');
const html=await readFile('webflow/ai-power-index-footer.html','utf8');
assert.equal((html.match(/<th scope="row"/g)||[]).length,50);
assert.ok(html.length<50000);
console.log('AI Power: 50 companies, all 150 approved ranks/scores, immutable hashes, sorting and error cases verified.');
