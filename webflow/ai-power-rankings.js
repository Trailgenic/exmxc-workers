(() => {
  const root = document.querySelector('#ai-power-rankings');
  if (!root) return;
  const table = root.querySelector('table'), body = table.tBodies[0];
  const select = root.querySelector('select'), status = root.querySelector('[role=status]');
  const api = 'https://mcp.exmxc.ai/ai-power/rankings';
  const years = ['2026','2027','2030'];
  let edition = root.dataset.edition, year = '2026', requestId = 0;
  const originalUrl = new URL(location.href);
  function urlState() {
    const url = new URL(location.href);
    url.searchParams.set('year',year); url.searchParams.set('edition',edition);
    history.replaceState(null,'',url);
  }
  function sort(target, updateUrl = true) {
    year = years.includes(String(target)) ? String(target) : '2026';
    [...body.rows].sort((a,b) => Number(a.dataset['rank'+year])-Number(b.dataset['rank'+year])).forEach(row => body.appendChild(row));
    root.querySelectorAll('[data-sort-year]').forEach(button => {
      const active = button.dataset.sortYear === year;
      button.setAttribute('aria-pressed',String(active));
      if (active) button.parentElement.setAttribute('aria-sort','descending');
      else button.parentElement.removeAttribute('aria-sort');
    });
    root.querySelectorAll('[data-year]').forEach(cell => cell.classList.toggle('apr-active',cell.dataset.year===year));
    status.textContent = 'Sorted by '+year+' power, highest first. 50 companies.';
    if (updateUrl) urlState();
  }
  async function read(url) {
    const response = await fetch(url,{signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error('Unavailable');
    return response.json();
  }
  function render(snapshot) {
    if (!Array.isArray(snapshot.rows) || snapshot.rows.length !== 50 || snapshot.methodology_id !== 'ai-power-rankings-1.0.0') throw new Error('Invalid edition');
    const fragment = document.createDocumentFragment();
    for (const row of snapshot.rows) {
      const tr = document.createElement('tr'), name = document.createElement('th');
      name.scope='row'; name.className='apr-company'; const link=document.createElement('a'); link.textContent=row.company; link.href='/power-lens?company='+encodeURIComponent(row.id)+'&edition='+encodeURIComponent(snapshot.edition_id); name.appendChild(link); tr.appendChild(name);
      for (const y of years) {
        const value = row.assessments[y];
        if (!Number.isInteger(value.rank) || !Number.isFinite(value.score)) throw new Error('Invalid scores');
        tr.dataset['rank'+y]=String(value.rank);
        for (const content of ['#'+value.rank, value.score.toFixed(1)]) {
          const cell=document.createElement('td');cell.dataset.year=y;cell.textContent=content;tr.appendChild(cell);
        }
      }
      fragment.appendChild(tr);
    }
    body.replaceChildren(fragment);edition=snapshot.edition_id;select.value=edition;
    root.querySelector('[data-as-of]').textContent='As of '+snapshot.as_of+' · Monthly editions';
    root.querySelector('[data-change-note]').textContent=snapshot.change_note;
    root.querySelector('[data-json-link]').href=api+'?edition='+encodeURIComponent(edition);
    for (const y of years) {
      const kind=snapshot.rows[0].assessments[y].kind;
      root.querySelector('[data-kind="'+y+'"]').textContent=kind==='forecast'?'Forecast':kind==='historical_assessment'?'Historical':'Assessment';
    }
  }
  async function load(target) {
    const sequence=++requestId;
    status.textContent='Loading edition…';select.disabled=true;
    try {
      const snapshot=await read(api+'?edition='+encodeURIComponent(target));
      if(sequence!==requestId)return;
      render(snapshot);sort(year);
    } catch (_) {
      if(sequence!==requestId)return;
      select.value=edition;urlState();
      status.textContent='Could not load that edition. Showing '+edition+'; year sorting is still available.';
    } finally { if(sequence===requestId)select.disabled=false; }
  }
  root.querySelectorAll('[data-sort-year]').forEach(button => button.addEventListener('click',() => sort(button.dataset.sortYear)));
  select.addEventListener('change',() => load(select.value));
  sort(originalUrl.searchParams.get('year'),false);
  read(api+'/editions').then(ledger => {
    const requested=originalUrl.searchParams.get('edition');
    select.replaceChildren(...ledger.editions.map(item => new Option(item.label,item.edition_id)));
    select.value=edition;
    const target=requested || ledger.latest;
    if (!ledger.editions.some(item=>item.edition_id===target)) {
      status.textContent='Edition unavailable. Showing '+edition+'.';urlState();return;
    }
    if(target!==edition)load(target);else urlState();
  }).catch(() => { status.textContent='Showing saved edition '+edition+'. The archive is temporarily unavailable; year sorting still works.'; });
})();
