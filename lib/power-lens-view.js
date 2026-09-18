// Shared by the static build and browser; scores always come from the ranked edition.
export const lensYears = ['2026', '2027', '2030'];
export const lensForces = ['compute', 'interface', 'alignment', 'energy'];
export const lensEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function packLens(snapshot) {
  return {edition_id:snapshot.edition_id,as_of:snapshot.as_of,methodology_id:snapshot.methodology_id,change_note:snapshot.change_note,
    rows:snapshot.rows.map(r=>[r.id,r.company,lensYears.map(y=>{const a=r.assessments[y];return [a.rank,a.score,lensForces.map(f=>a.forces[f]),a.kind,a.target_date];}),r.research_premise,r.thesis,r.reconsider_if,r.sources])};
}
export function unpackLens(packed) {
  return {...packed,rows:packed.rows.map(([id,company,values,research_premise,thesis,reconsider_if,sources])=>({id,company,research_premise,thesis,reconsider_if,sources,
    assessments:Object.fromEntries(lensYears.map((y,i)=>{const [rank,score,forces,kind,target_date]=values[i];return [y,{rank,score,forces:Object.fromEntries(lensForces.map((f,j)=>[f,forces[j]])),kind,target_date}];}))}))};
}
export function lensProfileUrl(id,edition) {
  return '/power-lens?company='+encodeURIComponent(id)+'&edition='+encodeURIComponent(edition);
}
export function renderLensProfile(row,snapshot) {
  const e=lensEscape, first=row.assessments['2026'], last=row.assessments['2030'];
  const delta=Number((last.score-first.score).toFixed(1));
  const movement=first.rank-last.rank;
  const scoreMove=delta===0?'holds at '+last.score.toFixed(1):`${delta>0?'rises':'falls'} from ${first.score.toFixed(1)} to ${last.score.toFixed(1)}`;
  const rankMove=movement===0?`holds at #${last.rank}`:`moves from #${first.rank} to #${last.rank}`;
  const forceMoves=lensForces.filter(f=>first.forces[f]!==last.forces[f]).map(f=>`${f[0].toUpperCase()+f.slice(1)} ${first.forces[f]} → ${last.forces[f]}`).join('; ');
  const safeSource=s=>{try {return new URL(s.url).protocol==='https:';}catch {return false;}};
  return `<header class="pl-profile-head"><div class="apr-kicker">Company profile · ${e(snapshot.as_of)}</div><h2 id="profile-company">${e(row.company)}</h2><p class="apr-note">Scores out of 100 · Ranks within the 50-company cohort</p></header>
  <div class="pl-horizons">${lensYears.map(y=>{const a=row.assessments[y];return `<section class="pl-horizon" aria-label="${y} ranking"><div class="apr-kicker">${y} · ${a.kind==='forecast'?'Forecast':a.kind==='historical_assessment'?'Historical':'Assessment'}</div><div class="pl-rank">#${a.rank}<span>${a.score.toFixed(1)} <small>/ 100</small></span></div><p class="apr-note">Target date ${e(a.target_date)}</p></section>`;}).join('')}</div>
  <section class="pl-thesis"><h3>Our power thesis</h3><p>${e(row.thesis)}</p></section>
  <section><h3>Four Forces breakdown</h3><p class="apr-note">Each force uses the same fixed 0–100 scale. The strongest force and breadth of control determine the Power Score.</p><div class="apr-scroll" tabindex="0" role="region" aria-label="Company force scores"><table class="apr-table pl-force-table"><caption>${e(row.company)} · Four Forces</caption><thead><tr><th scope="col">Force</th>${lensYears.map(y=>`<th scope="col">${y}</th>`).join('')}</tr></thead><tbody>${lensForces.map(f=>`<tr><th scope="row">${f[0].toUpperCase()+f.slice(1)}</th>${lensYears.map(y=>`<td><span class="pl-bar" aria-hidden="true" style="--power:${row.assessments[y].forces[f]}%"></span>${row.assessments[y].forces[f]}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
  <div class="pl-two"><section><h3>Our forecast</h3><p>Across our 2026–2030 view, the Power Score ${scoreMove}; the rank ${rankMove}.</p><p>${forceMoves?e(forceMoves)+'.':'All four force scores hold through 2030.'}</p><p class="apr-note">The thesis above explains our call. Rank can fall even when power grows if other companies gain faster.</p></section><section><h3>What would change our mind</h3><p>${e(row.reconsider_if)}</p></section></div>
  <section><h3>Research behind the judgment</h3><p>${e(row.research_premise)}</p><ul class="pl-sources">${row.sources.filter(safeSource).map(s=>`<li><a href="${e(s.url)}" target="_blank" rel="noopener noreferrer">${e(s.title)}</a><span class="apr-note">${e(s.date_label)} · Accessed ${e(s.accessed_on)}</span></li>`).join('')}</ul><p class="apr-note">Sources inform the factual premises. Force scores, ranks, and forecasts are exmxc’s judgments as of this edition.</p></section>`;
}
