(() => {
  const root=document.querySelector('#power-lens');
  if(!root)return;
  const api='https://mcp.exmxc.ai/ai-power/rankings';
  const saved=unpackLens(JSON.parse(document.querySelector('#power-lens-data').textContent));
  const companySelect=root.querySelector('[data-company-select]'), editionSelect=root.querySelector('[data-edition-select]');
  const profile=root.querySelector('[data-profile]'), status=root.querySelector('[role=status]'), historyBox=root.querySelector('[data-history]');
  const cache=new Map([[saved.edition_id,saved]]);
  let ledger=JSON.parse(root.dataset.ledger), current=saved, company=saved.rows[0].id, sequence=0, historySequence=0;
  const aliases={nvda:'nvidia',msft:'microsoft',tsm:'tsmc',ceg:'constellation-energy',goog:'alphabet',googl:'alphabet',google:'alphabet',amzn:'amazon',aapl:'apple',xai:'spacex'};
  function resolve(value) {
    const q=String(value||'').trim().toLowerCase();
    return saved.rows.find(r=>r.id===q||r.company.toLowerCase()===q)?.id||aliases[q]||q;
  }
  function urlState() {
    const url=new URL(location.href);url.search='';url.searchParams.set('company',company);url.searchParams.set('edition',current.edition_id);history.replaceState(null,'',url);
  }
  function historyTable(snapshots) {
    return '<div class="apr-scroll" tabindex="0" role="region" aria-label="Monthly company ranking history"><table class="apr-table pl-history-table"><caption>Monthly judgments for the same target years · Rank / score</caption><thead><tr><th scope="col">Edition</th>'+lensYears.map(y=>'<th scope="col">'+y+'</th>').join('')+'</tr></thead><tbody>'+snapshots.map(s=>{
      const r=s.rows.find(x=>x.id===company);return '<tr><th scope="row"><a href="'+lensEscape(lensProfileUrl(company,s.edition_id))+'">'+lensEscape(s.edition_id)+'</a></th>'+lensYears.map(y=>'<td>'+(r?'#'+r.assessments[y].rank+' / '+r.assessments[y].score.toFixed(1):'Not in edition')+'</td>').join('')+'</tr>';
    }).join('')+'</tbody></table></div>';
  }
  function render() {
    ++historySequence;
    const row=current.rows.find(r=>r.id===company);
    companySelect.value=company;editionSelect.value=current.edition_id;
    root.querySelector('[data-as-of]').textContent='As of '+current.as_of+' · Methodology 1.0.0';
    root.querySelector('[data-index-link]').href='/ai-power-index?edition='+encodeURIComponent(current.edition_id);
    root.querySelector('[data-data-link]').href=api+'?edition='+encodeURIComponent(current.edition_id);
    root.querySelector('[data-permalink]').href=lensProfileUrl(company,current.edition_id);
    if(!row){profile.innerHTML='<h2>Company unavailable</h2><p>Choose one of the 50 companies above to read its profile.</p>';historyBox.replaceChildren();status.textContent='That company is not in this edition.';return;}
    profile.innerHTML=renderLensProfile(row,current);
    document.title=row.company+' — Power Lens | exmxc';
    root.querySelector('[data-change-note]').textContent=current.change_note;
    historyBox.innerHTML=historyTable([current])+(ledger.editions.length===1?'<p class="apr-note">September 2026 is the first edition. Monthly comparisons will appear as new editions are published.</p>':'<div class="pl-actions"><button type="button" data-load-history>Load all monthly editions</button></div>');
    historyBox.querySelector('[data-load-history]')?.addEventListener('click',loadHistory);
    status.textContent=row.company+' · '+current.edition_id+' edition.';
  }
  async function read(url) {
    const response=await fetch(url,{signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('Unavailable');return response.json();
  }
  async function snapshot(id) {
    if(cache.has(id))return cache.get(id);
    const result=await read(api+'?edition='+encodeURIComponent(id));
    if(result.edition_id!==id||result.methodology_id!==saved.methodology_id||result.rows?.length!==50)throw new Error('Invalid edition');
    cache.set(id,result);return result;
  }
  async function choose(id,requestedCompany) {
    const token=++sequence;
    status.textContent='Loading profile…';editionSelect.disabled=true;
    try {
      if(!ledger.editions.some(e=>e.edition_id===id))throw new Error('Unknown edition');
      const data=await snapshot(id);if(token!==sequence)return;
      current=data;company=requestedCompany;render();urlState();
    }catch(_){if(token!==sequence)return;render();editionSelect.value=current.edition_id;companySelect.value=company;status.textContent='Could not load that edition. The visible profile remains '+current.edition_id+'.';urlState();}
    finally{if(token===sequence)editionSelect.disabled=false;}
  }
  async function loadHistory() {
    const token=++historySequence;
    historyBox.textContent='Loading monthly history…';
    const results=await Promise.allSettled([...ledger.editions].reverse().map(e=>snapshot(e.edition_id)));
    if(token!==historySequence)return;
    const available=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const missed=results.filter(r=>r.status==='rejected').length;
    historyBox.innerHTML=historyTable(available)+(missed?'<p class="apr-error">'+missed+' edition(s) could not be loaded. Reload the page to retry; unavailable editions are not shown.</p>':'<p class="apr-note">Each row preserves the judgment made in that monthly edition. Forecast revisions are not realized performance.</p>');
  }
  companySelect.addEventListener('change',()=>choose(current.edition_id,companySelect.value));
  editionSelect.addEventListener('change',()=>choose(editionSelect.value,company));
  root.querySelector('[data-copy]').addEventListener('click',async()=>{
    const url=new URL(lensProfileUrl(company,current.edition_id),location.origin).href;
    try{await navigator.clipboard.writeText(url);status.textContent='Profile link copied.';}catch(_){status.textContent='Use the permanent profile link below to share this edition.';}
  });
  const initial=new URL(location.href), requestedCompany=resolve(initial.searchParams.get('company')||initial.searchParams.get('q')||company), requestedEdition=initial.searchParams.get('edition');
  company=requestedCompany;render();
  if(requestedEdition&&requestedEdition!==current.edition_id)profile.innerHTML='<p>Loading the requested monthly edition…</p>';
  read(api+'/editions').then(next=>{
    if(!next.editions?.length||!next.editions.some(e=>e.edition_id===next.latest))throw new Error('Invalid archive');
    ledger=next;editionSelect.replaceChildren(...[...ledger.editions].reverse().map(e=>new Option(e.label,e.edition_id)));editionSelect.value=current.edition_id;
    // Do not override a user selection made while the archive was loading.
    if(sequence===0) return choose(requestedEdition||ledger.latest,requestedCompany);
  }).catch(()=>{
    if(sequence!==0)return;
    if(requestedEdition&&requestedEdition!==current.edition_id){render();status.textContent='Requested edition unavailable. Showing saved edition '+current.edition_id+'.';}
    else status.textContent='Showing saved edition '+current.edition_id+'. Monthly archive temporarily unavailable.';
    urlState();
  });
})();
