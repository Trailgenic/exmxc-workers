import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getPowerRankings } from '../lib/ai-power-rankings.js';
import { packLens,unpackLens,renderLensProfile,lensProfileUrl } from '../lib/power-lens-view.js';
const data=getPowerRankings();
const restored=unpackLens(packLens(data));
for(const [i,row] of data.rows.entries()) {
  const recovered=restored.rows[i];
  for(const field of ['id','company','thesis','research_premise','reconsider_if','sources'])assert.deepEqual(recovered[field],row[field]);
  for(const y of data.years)for(const field of ['rank','score','forces','kind','target_date'])assert.deepEqual(recovered.assessments[y][field],row.assessments[y][field]);
  const html=renderLensProfile(recovered,restored);
  assert.ok(html.includes('What would change our mind'));
  for(const y of data.years)assert.ok(html.includes(`#${row.assessments[y].rank}<span>${row.assessments[y].score.toFixed(1)}`));
  assert.equal((html.match(/<span class="pl-bar"/g)||[]).length,12);
}
const hostile=structuredClone(restored.rows[0]);hostile.thesis='<script>alert(1)</script>';hostile.sources=[{url:'javascript:alert(1)',title:'unsafe'}];
const safe=renderLensProfile(hostile,restored);assert.ok(!safe.includes('<script>'));assert.ok(!safe.includes('javascript:'));
const head=await readFile('webflow/power-lens-head.html','utf8');
const footer=await readFile('webflow/power-lens-footer.html','utf8');
assert.ok(head.length<50000&&footer.length<50000);
const embedded=JSON.parse(head.match(/id="power-lens-data">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(unpackLens(embedded),restored);
const index=await readFile('webflow/ai-power-index-footer.html','utf8');
for(const row of data.rows)assert.ok(index.includes(lensProfileUrl(row.id,data.edition_id).replace('&','&amp;')));
assert.ok(!/Evidence-backed|v2\.0 Pilot|No universal score/i.test(head+footer));
console.log('Power Lens: 50 profiles, all scores/forces/notes, edition links, embedded snapshot, and escaping verified.');
