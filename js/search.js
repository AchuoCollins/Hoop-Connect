/* =========================================================
   SEARCH.JS — searches the ACTIVE competition's teams,
   news, clips and matchups. Null-safe.
   ========================================================= */
(function(){
  const input = document.querySelector('.search input');
  if(!input || typeof HoopData === 'undefined') return;
  const wrap = input.closest('.search');
  if(!wrap) return;

  function esc(s){
    return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  const panel = document.createElement('div');
  panel.className = 'search-results';
  wrap.appendChild(panel);

  function findResults(q){
    q = q.trim().toLowerCase();
    if(!q) return [];
    const data = HoopData.load();
    const comp = HoopData.activeCompetition(data);
    if(!comp) return [];
    const teams = comp.teams || [];
    const games = comp.games || [];
    const clips = comp.clips || [];
    const out = [];
    const compId = comp.id;

    teams.forEach(t=>{
      if((t.name||'').toLowerCase().includes(q)){
        out.push({type:'Team', label:t.name, href:'competition.html?id='+encodeURIComponent(compId)+'#teams'});
      }
    });
    games.forEach(g=>{
      const a = HoopData.teamById(teams, g.teamA).name;
      const b = HoopData.teamById(teams, g.teamB).name;
      const label = a + ' vs ' + b;
      if(label.toLowerCase().includes(q)){
        out.push({type:'Match', label, href:'competition.html?id='+encodeURIComponent(compId)+'#scores'});
      }
    });
    clips.forEach(c=>{
      if((c.cap||'').toLowerCase().includes(q)){
        out.push({type:'Clip', label:c.cap, href:'clips.html?id='+encodeURIComponent(compId)});
      }
    });
    return out.slice(0, 8);
  }

  function render(list, query){
    if(!query.trim()){ panel.innerHTML = ''; panel.classList.remove('show'); return; }
    panel.innerHTML = list.length
      ? list.map(r=>`<a href="${r.href}"><span class="sr-type">${esc(r.type)}</span>${esc(r.label)}</a>`).join('')
      : `<div class="sr-empty">No matches for "${esc(query.trim())}"</div>`;
    panel.classList.add('show');
  }

  let timer;
  input.addEventListener('input', ()=>{
    clearTimeout(timer);
    const q = input.value;
    timer = setTimeout(()=>render(findResults(q), q), 120);
  });
  input.addEventListener('focus', ()=>{ if(input.value.trim()) render(findResults(input.value), input.value); });
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      const first = panel.querySelector('a');
      if(first) window.location.href = first.getAttribute('href');
    } else if(e.key === 'Escape'){
      panel.classList.remove('show');
      input.blur();
    }
  });
  document.addEventListener('click', (e)=>{
    if(wrap && !wrap.contains(e.target)) panel.classList.remove('show');
  });
})();