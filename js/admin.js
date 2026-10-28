/* =========================================================
   ADMIN.JS — CRUD dashboard for HoopData
   Bracket is per-division (Men / Women / Mixed)
   ========================================================= */
let data = HoopData.load();

let activeCompId = HoopData.activeCompetitionId() || (data.competitions[0] && data.competitions[0].id);
function activeComp(){
  return HoopData.getCompetition(data, activeCompId) || data.competitions[0];
}
function refreshCompSelect(){
  const sel = document.getElementById('adminCompSelect');
  if(!sel) return;
  sel.innerHTML = data.competitions.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  sel.value = activeCompId;
}
window.hoopRefreshCompSelect = refreshCompSelect;
const compSelectEl = document.getElementById('adminCompSelect');
if(compSelectEl){
  compSelectEl.addEventListener('change', (e)=>{
    activeCompId = e.target.value;
    HoopData.setActiveCompetitionId(activeCompId);
    refreshCompSelect();
    refreshAll();
  });
}

async function persist(){
  const ok = await HoopData.save(data);
  if(!ok) toast("Couldn't save to the server. Check your connection and try again.", true);
  return ok;
}

function toast(msg, isError){
  const el = document.getElementById('adminToast');
  el.textContent = msg;
  el.classList.toggle('error', !!isError);
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.classList.remove('show'), isError ? 4500 : 2200);
}
function esc(str){
  return String(str==null?'':str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ---------- TAB SWITCHING ---------- */
document.querySelectorAll('.admin-tab-btn[data-panel]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.admin-tab-btn[data-panel]').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.panel).classList.add('active');
  });
});

/* ---------- EXPORT / IMPORT ---------- */
document.getElementById('exportDataBtn').addEventListener('click', (e)=>{
  e.preventDefault();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'hoop-connect-backup-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  toast('Backup downloaded');
});
document.getElementById('importDataBtn').addEventListener('click', (e)=>{
  e.preventDefault();
  document.getElementById('importDataFile').click();
});
document.getElementById('importDataFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  e.target.value = '';
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try{ parsed = JSON.parse(reader.result); }
    catch(err){ toast('That file is not valid JSON', true); return; }
    if(!Array.isArray(parsed.competitions)){
      toast('That file doesn\'t look like a Hoop Connect backup (missing competitions)', true);
      return;
    }
    if(!confirm('Import this backup? It replaces everything currently in Teams, Live Scores, Schedule, Bracket, Clips and Watch Live.')) return;
    data = {
      site: Object.assign({}, parsed.site || {}),
      competitions: parsed.competitions
    };
    if(!(await persist())) return;
    refreshAll();
    toast('Backup imported');
  };
  reader.onerror = () => toast('Could not read that file', true);
  reader.readAsText(file);
});

/* ---------- RESET ---------- */
document.getElementById('resetDataBtn').addEventListener('click', async (e)=>{
  e.preventDefault();
  if(!confirm('Reset ALL data (teams, games, clips) back to the site defaults? This cannot be undone.')) return;
  await HoopData.resetToDefaults();
  data = HoopData.load();
  activeCompId = data.competitions[0].id;
  refreshCompSelect();
  renderTeamsTable(); renderGamesTable(); renderClipsTable();
  renderBracketPanel(); renderBracketChecklist(); loadWatchForm();
  populateTeamSelects();
  toast('Data reset to defaults');
});

/* =========================================================
   TEAMS
   ========================================================= */
const teamForm = document.getElementById('teamForm');

function hoopEnsureBracketsMap(comp){
  if(!comp.brackets){
    comp.brackets = {};
    if(comp.bracket) comp.brackets.Men = comp.bracket;
  }
  comp.bracket = comp.brackets.Men || null;
  return comp.brackets;
}

function renderTeamsTable(){
  const body = document.getElementById('teamsTableBody');
  body.innerHTML = activeComp().teams.map(t=>{
    const players = t.players || [];
    const thumb = t.logo
      ? `<img src="${esc(t.logo)}" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:contain;background:#fff;border:1px solid var(--line)">`
      : `<span class="swatch" style="background:${esc(t.color)}"></span>`;
    return `<tr>
      <td>${thumb}</td>
      <td>${esc(t.id)}</td>
      <td>${esc(t.name)}</td>
      <td>${esc(t.gender || 'Men')}</td>
      <td>${t.wins}</td>
      <td>${t.losses}</td>
      <td>${players.length}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit" data-edit-team="${esc(t.id)}">Edit</button>
        <button type="button" class="admin-btn-delete" data-delete-team="${esc(t.id)}">Delete</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="color:var(--muted)">No teams yet.</td></tr>';

  body.querySelectorAll('[data-edit-team]').forEach(btn=>{
    btn.addEventListener('click',()=>loadTeamIntoForm(btn.dataset.editTeam));
  });
  body.querySelectorAll('[data-delete-team]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const id = btn.dataset.deleteTeam;
      const comp = activeComp();
      const map = hoopEnsureBracketsMap(comp);
      const involved = comp.games.filter(g=>g.teamA===id || g.teamB===id);
      const inBracketDivision = Object.keys(map).find(div=>{
        const b = map[div];
        return HoopBracket.exists(b) && b.seeds.includes(id);
      });
      const inBracket = !!inBracketDivision;
      let warn = 'Delete this team?';
      if(involved.length) warn += '\n\n\u2022 ' + involved.length + ' game(s) involving it will be deleted (and any records they added to other teams undone).';
      if(inBracket) warn += '\n\u2022 It is in the ' + inBracketDivision + ' bracket, so that bracket will be deleted and must be recreated.';
      if(!confirm(warn)) return;
      involved.forEach(g=>{ revertRecord(g); });
      comp.games = comp.games.filter(g=>g.teamA!==id && g.teamB!==id);
      if(inBracket){
        delete map[inBracketDivision];
        comp.bracket = map.Men || null;
      }
      comp.teams = comp.teams.filter(t=>t.id!==id);
      comp.watch = comp.watch || {};
      if(!comp.games.some(x=>x.status==='live')) comp.watch.live = false;
      if(!(await persist())) return; refreshAll();
      toast('Team deleted' + (involved.length || inBracket ? ' \u2014 related games/bracket cleaned up' : ''));
    });
  });
}

/* ---- logo upload ---- */
let teamLogoDataUrl = '';
function setTeamLogoPreview(dataUrl){
  teamLogoDataUrl = dataUrl || '';
  const img = document.getElementById('teamLogoPreview');
  const placeholder = document.getElementById('teamLogoPlaceholder');
  if(teamLogoDataUrl){
    img.src = teamLogoDataUrl; img.style.display = '';
    placeholder.style.display = 'none';
  } else {
    img.src = ''; img.style.display = 'none';
    placeholder.style.display = '';
  }
}
document.getElementById('teamLogoFile').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast('Please use an image under 2MB'); e.target.value=''; return; }
  toast('Uploading…');
  try{
    const url = await hoopUploadImage(file, 'team');
    setTeamLogoPreview(url);
    toast('Uploaded');
  }catch(err){
    toast('Upload failed: ' + err.message, true);
  }
});
document.getElementById('teamLogoRemove').addEventListener('click', ()=>{
  setTeamLogoPreview('');
  document.getElementById('teamLogoFile').value = '';
});

/* ---- roster mini-editor ---- */
let rosterPlayers = [];
let editingPlayerIndex = null;
function renderRosterTable(){
  const body = document.getElementById('rosterTableBody');
  body.innerHTML = rosterPlayers.map((p,i)=>`
    <tr>
      <td>${esc(p.number||'—')}</td>
      <td>${esc(p.name)}</td>
      <td>${esc(p.position||'—')}</td>
      <td>${esc(p.height||'—')}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit" data-edit-player="${i}">Edit</button>
        <button type="button" class="admin-btn-delete" data-remove-player="${i}">Remove</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" style="color:var(--muted)">No players added yet.</td></tr>';

  body.querySelectorAll('[data-edit-player]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const i = parseInt(btn.dataset.editPlayer,10);
      const p = rosterPlayers[i];
      document.getElementById('playerNumber').value = p.number||'';
      document.getElementById('playerName').value = p.name||'';
      document.getElementById('playerPosition').value = p.position||'';
      document.getElementById('playerHeight').value = p.height||'';
      editingPlayerIndex = i;
      document.getElementById('playerAddBtn').textContent = 'Update Player';
    });
  });
  body.querySelectorAll('[data-remove-player]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      rosterPlayers.splice(parseInt(btn.dataset.removePlayer,10),1);
      if(editingPlayerIndex!==null) resetPlayerFields();
      renderRosterTable();
    });
  });
}
function resetPlayerFields(){
  document.getElementById('playerNumber').value = '';
  document.getElementById('playerName').value = '';
  document.getElementById('playerPosition').value = '';
  document.getElementById('playerHeight').value = '';
  editingPlayerIndex = null;
  document.getElementById('playerAddBtn').textContent = '+ Add Player';
}
document.getElementById('playerAddBtn').addEventListener('click', ()=>{
  const name = document.getElementById('playerName').value.trim();
  if(!name){ toast('Player name is required'); return; }
  const player = {
    number: document.getElementById('playerNumber').value.trim(),
    name: name,
    position: document.getElementById('playerPosition').value,
    height: document.getElementById('playerHeight').value.trim()
  };
  if(editingPlayerIndex!==null){ rosterPlayers[editingPlayerIndex] = player; }
  else { rosterPlayers.push(player); }
  resetPlayerFields();
  renderRosterTable();
});

function loadTeamIntoForm(id){
  const t = activeComp().teams.find(x=>x.id===id);
  if(!t) return;
  document.getElementById('teamFormTitle').textContent = 'Edit Team';
  document.getElementById('teamEditingId').value = t.id;
  document.getElementById('teamId').value = t.id;
  document.getElementById('teamId').disabled = true;
  document.getElementById('teamColor').value = t.color;
  document.getElementById('teamName').value = t.name;
  document.getElementById('teamCity').value = t.city || '';
  document.getElementById('teamWins').value = t.wins;
  document.getElementById('teamLosses').value = t.losses;
  const genderEl = document.getElementById('teamGender');
  if(genderEl) genderEl.value = t.gender || 'Men';

  setTeamLogoPreview(t.logo || '');
  rosterPlayers = (t.players || []).map(p=>Object.assign({}, p));
  resetPlayerFields();
  renderRosterTable();
  window.scrollTo({top:document.getElementById('teamForm').offsetTop-20, behavior:'smooth'});
}
function resetTeamForm(){
  teamForm.reset();
  document.getElementById('teamFormTitle').textContent = 'Add Team';
  document.getElementById('teamEditingId').value = '';
  document.getElementById('teamId').disabled = false;
  document.getElementById('teamColor').value = '#0a1f44';
  document.getElementById('teamLogoFile').value = '';
  setTeamLogoPreview('');
  rosterPlayers = [];
  resetPlayerFields();
  renderRosterTable();
}
document.getElementById('teamFormCancel').addEventListener('click', resetTeamForm);
teamForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const editingId = document.getElementById('teamEditingId').value;
  const id = document.getElementById('teamId').value.trim().toUpperCase();
  const name = document.getElementById('teamName').value.trim();
  const city = document.getElementById('teamCity').value.trim();
  const color = document.getElementById('teamColor').value;
  const genderEl = document.getElementById('teamGender');
  const gender = genderEl ? genderEl.value : 'Men';
  const wins = parseInt(document.getElementById('teamWins').value,10) || 0;
  const losses = parseInt(document.getElementById('teamLosses').value,10) || 0;
  const logo = teamLogoDataUrl;
  const players = rosterPlayers.map(p=>Object.assign({}, p));
  if(!id || !name){ toast('Team ID and name are required'); return; }

  if(editingId){
    const t = activeComp().teams.find(x=>x.id===editingId);
    if(t){ t.name=name; t.color=color; t.wins=wins; t.losses=losses; t.city=city; t.logo=logo; t.players=players; t.gender=gender; }
  } else {
    if(activeComp().teams.some(t=>t.id===id)){ toast('A team with that ID already exists'); return; }
    activeComp().teams.push({id, name, color, wins, losses, city, logo, players, gender});
  }
  if(!(await persist())) return; renderTeamsTable(); populateTeamSelects(); renderBracketChecklist(); resetTeamForm();
  toast('Team saved');
});

/* =========================================================
   LIVE SCORES + SCHEDULE
   ========================================================= */
const scForm = document.getElementById('scForm');

function populateTeamSelects(){
  const opts = '<option value="">TBD</option>' + activeComp().teams.map(t=>`<option value="${esc(t.id)}">${esc(t.name)} (${esc(t.gender || 'Men')})</option>`).join('');
  ['scTeamA','scTeamB'].forEach(id=>{
    const sel = document.getElementById(id);
    const cur = sel.value;
    sel.innerHTML = opts;
    sel.value = cur;
  });
}

function teamName(id){ return id ? HoopData.teamById(activeComp().teams, id).name : 'TBD'; }

function renderGamesTable(){
  const ls = document.getElementById('lsTableBody');
  const order = {live:0, upcoming:1, final:2};
  const all = [...activeComp().games].sort((x,y)=>{
    if(order[x.status] !== order[y.status]) return order[x.status]-order[y.status];
    return ((x.date||'9999')+(x.time||'')).localeCompare((y.date||'9999')+(y.time||''));
  });

  ls.innerHTML = all.map(g=>{
    const info = g.status==='upcoming'
      ? esc([g.date,g.time].filter(Boolean).join(' \u00b7 ') || 'TBD')
      : `${g.scoreA||0} \u2013 ${g.scoreB||0}${g.meta ? ' ('+esc(g.meta)+')' : ''}`;
    const label = g.status==='upcoming' ? 'Go live' : g.status==='live' ? 'Open scoreboard' : 'View';
    return `<tr data-open-game="${esc(g.id)}">
      <td><span class="status-pill ${esc(g.status)}">${esc(g.status)}</span></td>
      <td>${esc(teamName(g.teamA))} vs ${esc(teamName(g.teamB))}</td>
      <td>${info}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit">${label}</button>
        <button type="button" class="admin-btn-delete" data-delete-game="${esc(g.id)}">Delete</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="color:var(--muted)">No games yet \u2014 schedule one on the Schedule tab.</td></tr>';

  const sc = document.getElementById('scTableBody');
  const upcoming = activeComp().games.filter(g=>g.status==='upcoming')
    .sort((a,b)=> ((a.date||'9999')+(a.time||'')).localeCompare((b.date||'9999')+(b.time||'')));
  sc.innerHTML = upcoming.map(g=>`
    <tr>
      <td>${esc([g.date,g.time].filter(Boolean).join(' · ') || 'TBD')}</td>
      <td>${esc(teamName(g.teamA))} vs ${esc(teamName(g.teamB))}</td>
      <td>${esc([g.venue,g.round].filter(Boolean).join(' · ') || '—')}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit" data-edit-sc="${esc(g.id)}">Edit</button>
        <button type="button" class="admin-btn-delete" data-delete-game="${esc(g.id)}">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">Nothing scheduled yet.</td></tr>';

  document.querySelectorAll('[data-open-game]').forEach(r=>r.addEventListener('click',(e)=>{
    if(e.target.closest('button')) return;
    openScoreboard(r.dataset.openGame);
  }));

  document.querySelectorAll('[data-edit-sc]').forEach(b=>b.addEventListener('click',()=>loadScheduleIntoForm(b.dataset.editSc)));

  document.querySelectorAll('[data-delete-game]').forEach(b=>b.addEventListener('click', async (e)=>{
    e.stopPropagation();
    if(!confirm('Are you sure you want to delete this game? This cannot be undone.')) return;
    activeComp().games = activeComp().games.filter(g=>g.id!==b.dataset.deleteGame);
    if(!(await persist())) return;
    renderGamesTable();
    refreshAll();
    toast('Game deleted');
  }));
}

function refreshAll(){
  populateTeamSelects();
  renderTeamsTable();
  renderGamesTable();
  renderBracketPanel();
  renderBracketChecklist();
  loadWatchForm();
}

/* =========================================================
   GAME ↔ BRACKET SYNC — now division-aware
   ========================================================= */
function findGameBracketHit(g){
  const comp = activeComp();
  const map = hoopEnsureBracketsMap(comp);
  for(const div of Object.keys(map)){
    const bracket = map[div];
    if(!HoopBracket.exists(bracket) || !g.teamA || !g.teamB) continue;
    for(const round of HoopBracket.computeRounds(bracket)){
      for(const m of round.matches){
        if(m.bye || !m.teamA || !m.teamB) continue;
        const same = (m.teamA===g.teamA && m.teamB===g.teamB) || (m.teamA===g.teamB && m.teamB===g.teamA);
        if(!same) continue;
        if(m.status==='final' && m.key!==g.bracketKey) continue;
        return { division: div, match: m, bracket };
      }
    }
  }
  return null;
}

function clearDownstreamInDivision(division, key){
  const comp = activeComp();
  const map = hoopEnsureBracketsMap(comp);
  const bracket = map[division];
  if(!HoopBracket.exists(bracket)) return;
  let [r, i] = key.split('-').map(Number);
  const total = Math.log2(HoopBracket.bracketSize(bracket.seeds.length));
  while(r + 1 < total){ r += 1; i = Math.floor(i/2); delete bracket.results[r + '-' + i]; }
}

function syncGameToBracket(g){
  const comp = activeComp();
  const map = hoopEnsureBracketsMap(comp);
  if(!Object.keys(map).length){ delete g.bracketKey; delete g.bracketDivision; return false; }

  if(g.status === 'upcoming'){
    if(g.bracketKey && g.bracketDivision && map[g.bracketDivision]){
      const old = map[g.bracketDivision].results[g.bracketKey];
      if(old && old.status==='final') clearDownstreamInDivision(g.bracketDivision, g.bracketKey);
      delete map[g.bracketDivision].results[g.bracketKey];
    }
    delete g.bracketKey;
    delete g.bracketDivision;
    return false;
  }

  const hit = findGameBracketHit(g);
  if(!hit) return false;

  const { division, match, bracket } = hit;
  const prev = bracket.results[match.key];
  const wasFinal = !!(prev && prev.status==='final');
  const nowFinal = g.status === 'final';
  const sameOrder = match.teamA === g.teamA;
  bracket.results[match.key] = {
    scoreA: (sameOrder ? g.scoreA : g.scoreB) || 0,
    scoreB: (sameOrder ? g.scoreB : g.scoreA) || 0,
    status: nowFinal ? 'final' : 'live',
    court: g.court || (prev && prev.court) || '',
    note: (prev && prev.note) || ''
  };
  if(wasFinal && !nowFinal) clearDownstreamInDivision(division, match.key);
  g.bracketKey = match.key;
  g.bracketDivision = division;
  return true;
}

function applyRecord(g){
  revertRecord(g);
  if(g.bracketKey || g.scoreA === g.scoreB) return null;
  const w = g.scoreA > g.scoreB ? g.teamA : g.teamB;
  const l = g.scoreA > g.scoreB ? g.teamB : g.teamA;
  const tw = activeComp().teams.find(t=>t.id===w), tl = activeComp().teams.find(t=>t.id===l);
  if(tw) tw.wins += 1;
  if(tl) tl.losses += 1;
  g.recorded = {w, l};
  return g.recorded;
}
function revertRecord(g){
  if(!g.recorded) return;
  const tw = activeComp().teams.find(t=>t.id===g.recorded.w), tl = activeComp().teams.find(t=>t.id===g.recorded.l);
  if(tw) tw.wins = Math.max(0, tw.wins - 1);
  if(tl) tl.losses = Math.max(0, tl.losses - 1);
  delete g.recorded;
}
function syncWatch(g, event){
  activeComp().watch = activeComp().watch || {title:'', url:'', tiktokUrl:'', live:false, description:''};
  if(event === 'live'){
    activeComp().watch.live = true;
    activeComp().watch.title = teamName(g.teamA) + ' vs ' + teamName(g.teamB);
    if(g.streamUrl) activeComp().watch.url = g.streamUrl;
  } else if(!activeComp().games.some(x=>x.status==='live')){
    activeComp().watch.live = false;
  }
}

/* =========================================================
   SCOREBOARD MODAL
   ========================================================= */
const scoreModal = document.getElementById('scoreModal');
let openGameId = null;

function currentGame(){ return activeComp().games.find(g=>g.id===openGameId); }

function refreshScoreboard(){
  const g = currentGame();
  if(!g) return;
  document.getElementById('smNameA').textContent = teamName(g.teamA);
  document.getElementById('smNameB').textContent = teamName(g.teamB);
  document.getElementById('smScoreA').textContent = g.scoreA||0;
  document.getElementById('smScoreB').textContent = g.scoreB||0;
  document.getElementById('smMeta').value = g.meta||'';
  const pill = document.getElementById('scoreModalPill');
  pill.textContent = g.status;
  pill.className = 'status-pill ' + g.status;
  const isFinal = g.status==='final';
  scoreModal.querySelectorAll('[data-add]').forEach(b=>{ b.disabled = isFinal; });
  document.getElementById('smMeta').disabled = isFinal;
  document.getElementById('smEnd').textContent = isFinal ? 'Reopen game' : 'End game (Final)';
  document.getElementById('smBack').style.display = isFinal ? 'none' : '';
  const note = document.getElementById('smNote');
  if(g.bracketKey){
    note.textContent = 'Playoff game (' + (g.bracketDivision || 'Men') + "'s bracket) \u2014 the score is mirrored into the bracket and the winner advances. It does not change team records.";
  } else if(g.status === 'final' && g.recorded){
    note.textContent = 'Recorded: ' + teamName(g.recorded.w) + ' +1 win, ' + teamName(g.recorded.l) + ' +1 loss.';
  } else {
    note.textContent = 'Regular-season game \u2014 when you end it, the winner gets a win and the loser a loss in the standings.';
  }
}

function openScoreboard(id){
  const g = activeComp().games.find(x=>x.id===id);
  if(!g) return;
  if(g.status==='upcoming'){
    if(!g.teamA || !g.teamB){ toast('Set both teams on the Schedule tab before going live'); return; }
    g.status = 'live'; g.scoreA = 0; g.scoreB = 0;
    g.court = g.venue || g.court || '';
    g.meta = g.meta || 'Q1 \u00b7 10:00';
    g.note = g.note || '';
    syncGameToBracket(g); syncWatch(g, 'live');
    persist().then(ok => { if(ok) refreshAll(); });
  }
  openGameId = id;
  refreshScoreboard();
  scoreModal.style.display = '';
}
function closeScoreboard(){
  scoreModal.style.display = 'none';
  openGameId = null;
  renderGamesTable();
}

scoreModal.querySelectorAll('[data-add]').forEach(btn=>{
  btn.addEventListener('click', async ()=>{
    const g = currentGame();
    if(!g || g.status==='final') return;
    const [side, amt] = btn.dataset.add.split(':');
    const key = side==='A' ? 'scoreA' : 'scoreB';
    g[key] = Math.max(0, (g[key]||0) + parseInt(amt,10));
    syncGameToBracket(g);
    if(!(await persist())) return; refreshScoreboard(); renderBracketPanel();
  });
});
document.getElementById('smMeta').addEventListener('change', async (e)=>{
  const g = currentGame();
  if(!g) return;
  g.meta = e.target.value.trim();
  if(!(await persist())) return;
});
document.getElementById('smEnd').addEventListener('click', async ()=>{
  const g = currentGame();
  if(!g) return;
  let msg;
  if(g.status === 'final'){
    revertRecord(g);
    g.status = 'live';
    syncGameToBracket(g); syncWatch(g, 'live');
    msg = 'Game reopened \u2014 its result was undone';
  } else {
    g.status = 'final';
    g.meta = 'Full time';
    const inBracket = syncGameToBracket(g);
    const rec = applyRecord(g);
    syncWatch(g, 'off');
    msg = inBracket ? 'Final \u2014 bracket updated, winner advances'
        : rec ? 'Final \u2014 ' + teamName(rec.w) + ' +1 win, ' + teamName(rec.l) + ' +1 loss'
        : 'Game marked Final (tied \u2014 no record change)';
  }
  if(!(await persist())) return; refreshScoreboard(); refreshAll();
  toast(msg);
});
document.getElementById('smBack').addEventListener('click', async ()=>{
  const g = currentGame();
  if(!g) return;
  if(!confirm('Move this game back to the schedule? Its score will be cleared.')) return;
  revertRecord(g);
  g.status = 'upcoming'; g.scoreA = 0; g.scoreB = 0;
  syncGameToBracket(g); syncWatch(g, 'off');
  if(!(await persist())) return; closeScoreboard(); refreshAll();
  toast('Game moved back to schedule');
});
document.getElementById('scoreModalClose').addEventListener('click', closeScoreboard);
scoreModal.addEventListener('click', (e)=>{ if(e.target===scoreModal) closeScoreboard(); });
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && scoreModal.style.display!=='none') closeScoreboard(); });

/* =========================================================
   SCHEDULE FORM
   ========================================================= */
function loadScheduleIntoForm(id){
  const g = activeComp().games.find(x=>x.id===id);
  if(!g) return;
  document.getElementById('scFormTitle').textContent = 'Edit Scheduled Game';
  document.getElementById('scEditingId').value = g.id;
  document.getElementById('scTeamA').value = g.teamA||'';
  document.getElementById('scTeamB').value = g.teamB||'';
  document.getElementById('scDate').value = g.date||'';
  document.getElementById('scTime').value = g.time||'';
  document.getElementById('scVenue').value = g.venue||'';
  document.getElementById('scRound').value = g.round||'';
  document.getElementById('scStreamUrl').value = g.streamUrl||'';
  window.scrollTo({top:scForm.offsetTop-20, behavior:'smooth'});
}
function resetScheduleForm(){
  scForm.reset();
  document.getElementById('scFormTitle').textContent = 'Schedule a Game';
  document.getElementById('scEditingId').value = '';
}
document.getElementById('scFormCancel').addEventListener('click', resetScheduleForm);
scForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const editingId = document.getElementById('scEditingId').value;
  const teamA = document.getElementById('scTeamA').value;
  const teamB = document.getElementById('scTeamB').value;
  if(teamA && teamB && teamA === teamB){ toast('Team A and Team B must be different'); return; }
  const payload = {
    status: 'upcoming',
    teamA, teamB,
    date: document.getElementById('scDate').value,
    time: document.getElementById('scTime').value,
    venue: document.getElementById('scVenue').value.trim(),
    round: document.getElementById('scRound').value.trim(),
    streamUrl: document.getElementById('scStreamUrl').value.trim()
  };
  if(editingId){
    const idx = activeComp().games.findIndex(g=>g.id===editingId);
    if(idx>-1) activeComp().games[idx] = Object.assign({id:editingId}, payload);
  } else {
    activeComp().games.push(Object.assign({id:HoopData.uid('g')}, payload));
  }
  if(!(await persist())) return; renderGamesTable(); resetScheduleForm();
  toast('Game scheduled');
});

/* =========================================================
   BRACKET — per division
   ========================================================= */
let bracketDivision = 'Men';

function divisionRank(d){
  const r = { Men: 0, Women: 1, Mixed: 2 };
  return (r[d] != null) ? r[d] : 99;
}

function activeDivisionTeams(){
  return (activeComp().teams || []).filter(t => (t.gender || 'Men') === bracketDivision);
}

function currentBracket(){
  const comp = activeComp();
  const map = hoopEnsureBracketsMap(comp);
  return map[bracketDivision] || null;
}

function setCurrentBracket(bracket){
  const comp = activeComp();
  const map = hoopEnsureBracketsMap(comp);
  if(bracket === null) delete map[bracketDivision];
  else map[bracketDivision] = bracket;
  comp.bracket = map.Men || null;
}

function renderBracketDivisionSelect(){
  const sel = document.getElementById('bracketDivisionSelect');
  if(!sel) return;
  const comp = activeComp();
  const divisions = [...new Set((comp.teams || []).map(t => t.gender || 'Men'))]
    .sort((a,b) => divisionRank(a) - divisionRank(b));

  const previous = sel.value || bracketDivision;
  if(divisions.length){
    sel.innerHTML = divisions.map(d=>{
      const label = d === 'Mixed' ? 'Mixed / Co-ed' : d + "'s Division";
      return `<option value="${d}">${label}</option>`;
    }).join('');
    bracketDivision = divisions.includes(previous) ? previous : divisions[0];
    sel.value = bracketDivision;
  } else {
    sel.innerHTML = '<option value="Men">Men\'s Division</option>';
    bracketDivision = 'Men';
  }
}

const bracketDivisionSelectEl = document.getElementById('bracketDivisionSelect');
if(bracketDivisionSelectEl){
  bracketDivisionSelectEl.addEventListener('change', (e)=>{
    bracketDivision = e.target.value;
    renderBracketPanel();
    renderBracketChecklist();
  });
}

function renderBracketMatchEditor(m){
  const teamAObj = m.teamA ? HoopData.teamById(activeComp().teams, m.teamA) : null;
  const teamBObj = m.teamB ? HoopData.teamById(activeComp().teams, m.teamB) : null;
  const nameA = teamAObj ? teamAObj.name : 'TBD';
  const nameB = teamBObj ? teamBObj.name : 'TBD';
  if(m.bye){
    const who = teamAObj || teamBObj;
    return `<div class="admin-form" data-bracket-key="${m.key}" style="padding:16px;opacity:0.7">
      <div style="font-weight:700;margin-bottom:2px">${esc(who ? who.name : 'TBD')}</div>
      <p style="font-size:12px;color:var(--muted)">Bye — advances automatically.</p>
    </div>`;
  }
  const seedLabel = (m.seedA && m.seedB) ? `(${m.seedA}) vs (${m.seedB})` : '';
  const locked = !m.teamA || !m.teamB;
  return `<div class="admin-form" data-bracket-key="${m.key}" style="padding:16px">
    <div style="font-weight:700;margin-bottom:2px">${esc(nameA)} vs ${esc(nameB)}</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:10px">${esc(seedLabel)}</div>
    ${locked ? '<p style="font-size:12px;color:var(--muted)">Waiting on the previous round to finish.</p>' : `
    <div class="admin-form-row">
      <div class="admin-field"><label>Score A</label><input type="number" min="0" data-f="scoreA" value="${m.scoreA}"></div>
      <div class="admin-field"><label>Score B</label><input type="number" min="0" data-f="scoreB" value="${m.scoreB}"></div>
    </div>
    <div class="admin-field">
      <label>Status</label>
      <select data-f="status">
        <option value="upcoming" ${m.status==='upcoming'?'selected':''}>Upcoming</option>
        <option value="live" ${m.status==='live'?'selected':''}>Live</option>
        <option value="final" ${m.status==='final'?'selected':''}>Final</option>
      </select>
    </div>
    <div class="admin-form-row">
      <div class="admin-field"><label>Court</label><input type="text" data-f="court" value="${esc(m.court||'')}"></div>
      <div class="admin-field"><label>Note</label><input type="text" data-f="note" value="${esc(m.note||'')}"></div>
    </div>
    <button type="button" class="admin-btn-primary" data-save-match style="width:100%;justify-content:center">Save Match</button>`}
  </div>`;
}

function renderBracketPanel(){
  renderBracketDivisionSelect();
  const el = document.getElementById('bracketPanelBody');
  if(!el) return;
  const bracket = currentBracket();
  if(!HoopBracket.exists(bracket)){
    el.innerHTML = '<p style="color:var(--muted);font-size:14px">No bracket for this division yet — create one above.</p>';
    return;
  }
  const rounds = HoopBracket.computeRounds(bracket);
  el.innerHTML = rounds.map(round=>`
    <h3 style="font-family:'Bebas Neue';font-size:20px;color:var(--navy);letter-spacing:0.03em;margin:0 0 12px">${esc(round.name)}</h3>
    <div class="admin-form-row" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:28px">
      ${round.matches.map(m=>renderBracketMatchEditor(m)).join('')}
    </div>
  `).join('');

  el.querySelectorAll('[data-bracket-key]').forEach(card=>{
    const key = card.dataset.bracketKey;
    const saveBtn = card.querySelector('[data-save-match]');
    if(!saveBtn) return;
    saveBtn.addEventListener('click', async ()=>{
      const bracket = currentBracket();
      if(!bracket) return;
      bracket.results[key] = {
        scoreA: parseInt(card.querySelector('[data-f="scoreA"]').value,10) || 0,
        scoreB: parseInt(card.querySelector('[data-f="scoreB"]').value,10) || 0,
        status: card.querySelector('[data-f="status"]').value,
        court: card.querySelector('[data-f="court"]').value.trim(),
        note: card.querySelector('[data-f="note"]').value.trim()
      };
      if(!(await persist())) return;
      renderBracketPanel();
      toast('Bracket updated');
    });
  });
}

function bracketWantedCount(){
  const teams = activeDivisionTeams();
  const max = Math.min(HOOP_BRACKET_MAX, teams.length);
  let n = parseInt(document.getElementById('bracketTeamCount').value, 10);
  if(isNaN(n)) n = HOOP_BRACKET_MIN;
  return Math.max(HOOP_BRACKET_MIN, Math.min(n, Math.max(max, HOOP_BRACKET_MIN)));
}

function renderBracketChecklist(){
  const el = document.getElementById('bracketTeamChecklist');
  if(!el) return;
  const teams = activeDivisionTeams();
  const countInput = document.getElementById('bracketTeamCount');
  countInput.max = Math.max(HOOP_BRACKET_MIN, Math.min(HOOP_BRACKET_MAX, teams.length));
  const bracket = currentBracket();
  const current = HoopBracket.exists(bracket) ? new Set(bracket.seeds) : new Set();
  if(HoopBracket.exists(bracket)) countInput.value = bracket.seeds.length;
  el.innerHTML = teams.map(t=>`
    <label class="admin-field-check" style="border:1px solid var(--line-strong);border-radius:8px;padding:8px 10px">
      <input type="checkbox" data-bracket-pick="${esc(t.id)}" ${current.has(t.id)?'checked':''} />
      <span style="font-size:13px">${esc(t.name)} <span style="color:var(--muted)">(${t.wins}-${t.losses})</span></span>
    </label>`).join('') || '<p style="color:var(--muted);font-size:13px">No teams in this division yet.</p>';
  el.querySelectorAll('[data-bracket-pick]').forEach(cb=>cb.addEventListener('change', updateBracketSelectionCount));
  updateBracketSelectionCount();
}

function updateBracketSelectionCount(){
  const teams = activeDivisionTeams();
  const want = bracketWantedCount();
  const checked = document.querySelectorAll('#bracketTeamChecklist [data-bracket-pick]:checked').length;
  const label = document.getElementById('bracketSelectedCount');
  const hint = document.getElementById('bracketCountHint');
  const p = HoopBracket.bracketSize(want);
  const byes = p - want;
  hint.textContent = teams.length < HOOP_BRACKET_MIN
    ? 'Add at least 2 teams to this division first.'
    : `${want} teams \u2192 ${Math.log2(p)} round${Math.log2(p)===1?'':'s'}` + (byes ? `, ${byes} bye${byes===1?'':'s'} for the top seeds` : ', no byes');
  label.textContent = checked + ' of ' + want + ' selected';
  label.style.color = checked===want ? 'var(--muted)' : '#dc2626';
  document.getElementById('bracketUseSelectionBtn').disabled = teams.length < HOOP_BRACKET_MIN || checked !== want;
  document.getElementById('bracketRegenBtn').disabled = teams.length < HOOP_BRACKET_MIN;
  document.getElementById('bracketDeleteBtn').style.display = HoopBracket.exists(currentBracket()) ? '' : 'none';
}

const bracketTeamCountEl = document.getElementById('bracketTeamCount');
if(bracketTeamCountEl) bracketTeamCountEl.addEventListener('input', updateBracketSelectionCount);

async function bracketSaved(msg){
  if(!(await persist())) return;
  renderBracketPanel();
  renderBracketChecklist();
  toast(msg);
}
function confirmReplaceBracket(){
  return !HoopBracket.exists(currentBracket()) ||
    confirm('This replaces the ' + bracketDivision + ' bracket and wipes every recorded result. Continue?');
}
document.getElementById('bracketUseSelectionBtn').addEventListener('click', async ()=>{
  const ids = [...document.querySelectorAll('#bracketTeamChecklist [data-bracket-pick]:checked')].map(cb=>cb.dataset.bracketPick);
  if(ids.length < HOOP_BRACKET_MIN || ids.length !== bracketWantedCount()) return;
  if(!confirmReplaceBracket()) return;
  setCurrentBracket(HoopBracket.createFromSelection(activeDivisionTeams(), ids));
  await bracketSaved(bracketDivision + ' bracket created');
});
document.getElementById('bracketRegenBtn').addEventListener('click', async ()=>{
  if(!confirmReplaceBracket()) return;
  setCurrentBracket(HoopBracket.createFromStandings(activeDivisionTeams(), bracketWantedCount()));
  await bracketSaved(bracketDivision + ' bracket created from standings');
});
document.getElementById('bracketDeleteBtn').addEventListener('click', async ()=>{
  if(!confirm('Delete the ' + bracketDivision + ' bracket? The public Bracket page for this division will be empty until you create a new one.')) return;
  setCurrentBracket(null);
  await bracketSaved(bracketDivision + ' bracket deleted');
});

/* =========================================================
   CLIPS
   ========================================================= */
const clipForm = document.getElementById('clipForm');
function renderClipsTable(){
  const body = document.getElementById('clipsTableBody');
  body.innerHTML = activeComp().clips.map(c=>`
    <tr>
      <td>${c.img?`<img src="${esc(c.img)}" alt="" style="width:44px;height:32px;object-fit:cover;border-radius:4px">`:''}</td>
      <td>${esc(c.cap)} <span style="font-size:11px;color:var(--muted)">${c.sourceUrl ? '\u00b7 TikTok' : '\u00b7 Image'}</span></td>
      <td>${c.views||0}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit" data-edit-clip="${esc(c.id)}">Edit</button>
        <button type="button" class="admin-btn-delete" data-delete-clip="${esc(c.id)}">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">No clips yet.</td></tr>';

  body.querySelectorAll('[data-edit-clip]').forEach(btn=>{
    btn.addEventListener('click',()=>loadClipIntoForm(btn.dataset.editClip));
  });
  body.querySelectorAll('[data-delete-clip]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Delete this clip?')) return;
      activeComp().clips = activeComp().clips.filter(c=>c.id!==btn.dataset.deleteClip);
      if(!(await persist())) return; renderClipsTable();
      toast('Clip deleted');
    });
  });
}

function setClipSourceMode(mode){
  document.querySelector(`input[name="clipSourceMode"][value="${mode}"]`).checked = true;
  document.getElementById('clipUploadMode').style.display = mode==='upload' ? '' : 'none';
  document.getElementById('clipLinkMode').style.display = mode==='link' ? '' : 'none';
}
document.querySelectorAll('input[name="clipSourceMode"]').forEach(radio=>{
  radio.addEventListener('change', ()=>setClipSourceMode(radio.value));
});
function setClipPreview(imgUrl){
  const wrap = document.getElementById('clipImgPreviewWrap');
  const img = document.getElementById('clipImgPreview');
  if(imgUrl){ img.src = imgUrl; wrap.style.display = ''; }
  else { img.src = ''; wrap.style.display = 'none'; }
}
document.getElementById('clipImageFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast('Please use an image under 2MB'); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('clipResolvedImg').value = reader.result;
    document.getElementById('clipResolvedSourceUrl').value = '';
    setClipPreview(reader.result);
  };
  reader.readAsDataURL(file);
});
document.getElementById('clipCoverFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ toast('Please use an image under 2MB'); e.target.value=''; return; }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('clipResolvedImg').value = reader.result;
    setClipPreview(reader.result);
    const st = document.getElementById('clipFetchStatus');
    st.style.color = '#3fa66e'; st.textContent = 'Cover image set.';
  };
  reader.readAsDataURL(file);
});
document.getElementById('clipFetchPreviewBtn').addEventListener('click', async ()=>{
  const url = document.getElementById('clipSourceUrlInput').value;
  const status = document.getElementById('clipFetchStatus');
  status.style.color = 'var(--muted)';
  status.textContent = 'Fetching preview...';
  try{
    const {thumbnail, sourceUrl, persisted} = await HoopEmbed.resolveTikTokThumbnail(url);
    document.getElementById('clipResolvedImg').value = thumbnail;
    document.getElementById('clipResolvedSourceUrl').value = sourceUrl;
    setClipPreview(thumbnail);
    status.style.color = persisted ? '#3fa66e' : '#b45309';
    status.textContent = persisted
      ? 'Cover image found and saved.'
      : "Cover found, but TikTok's image link will expire in a few days \u2014 upload a cover image below to keep it permanent.";
  }catch(err){
    status.style.color = '#dc2626';
    status.textContent = err.message;
  }
});

function loadClipIntoForm(id){
  const c = activeComp().clips.find(x=>x.id===id);
  if(!c) return;
  document.getElementById('clipFormTitle').textContent = 'Edit Clip';
  document.getElementById('clipEditingId').value = c.id;
  document.getElementById('clipCap').value = c.cap||'';
  document.getElementById('clipViews').value = c.views||0;
  document.getElementById('clipLikes').value = c.likes||0;
  document.getElementById('clipDislikes').value = c.dislikes||0;
  document.getElementById('clipComments').value = c.comments||0;
  document.getElementById('clipSize').value = c.size||'';
  document.getElementById('clipResolvedImg').value = c.img||'';
  document.getElementById('clipResolvedSourceUrl').value = c.sourceUrl||'';
  if(c.sourceUrl){
    setClipSourceMode('link');
    document.getElementById('clipSourceUrlInput').value = c.sourceUrl;
    document.getElementById('clipFetchStatus').textContent = '';
  } else {
    setClipSourceMode('upload');
  }
  setClipPreview(c.img||'');
  window.scrollTo({top:document.getElementById('clipForm').offsetTop-20, behavior:'smooth'});
}
function resetClipForm(){
  clipForm.reset();
  document.getElementById('clipFormTitle').textContent = 'Add Clip';
  document.getElementById('clipEditingId').value = '';
  document.getElementById('clipResolvedImg').value = '';
  document.getElementById('clipResolvedSourceUrl').value = '';
  document.getElementById('clipFetchStatus').textContent = '';
  document.getElementById('clipImageFile').value = '';
  document.getElementById('clipCoverFile').value = '';
  setClipSourceMode('upload');
  setClipPreview('');
}
document.getElementById('clipFormCancel').addEventListener('click', resetClipForm);
clipForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const editingId = document.getElementById('clipEditingId').value;
  const cap = document.getElementById('clipCap').value.trim();
  if(!cap){ toast('Caption is required'); return; }
  const img = document.getElementById('clipResolvedImg').value;
  const mode = document.querySelector('input[name="clipSourceMode"]:checked').value;
  const tiktokUrl = document.getElementById('clipSourceUrlInput').value.trim();
  if(mode==='link'){
    let host = '';
    try{ host = new URL(tiktokUrl).hostname; }catch(err){}
    if(!/(^|\.)tiktok\.com$/.test(host)){ toast('Paste a valid TikTok video link'); return; }
    if(!img){ toast('Fetch the TikTok cover image or upload a cover first'); return; }
  } else if(!img){ toast('Upload an image first'); return; }
  const payload = {
    cap: cap,
    views: parseInt(document.getElementById('clipViews').value,10) || 0,
    likes: parseInt(document.getElementById('clipLikes').value,10) || 0,
    dislikes: parseInt(document.getElementById('clipDislikes').value,10) || 0,
    comments: parseInt(document.getElementById('clipComments').value,10) || 0,
    size: document.getElementById('clipSize').value,
    img: img,
    sourceUrl: mode==='link' ? tiktokUrl : ''
  };

  if(editingId){
    const idx = activeComp().clips.findIndex(c=>c.id===editingId);
    if(idx>-1) activeComp().clips[idx] = Object.assign({id:editingId}, payload);
  } else {
    activeComp().clips.push(Object.assign({id:HoopData.uid('c')}, payload));
  }
  if(!(await persist())) return; renderClipsTable(); resetClipForm();
  toast('Clip saved');
});

/* =========================================================
   WATCH LIVE
   ========================================================= */
const watchForm = document.getElementById('watchForm');
function loadWatchForm(){
  const w = activeComp().watch || {};
  document.getElementById('watchTitle').value = w.title || '';
  document.getElementById('watchUrl').value = w.url || '';
  document.getElementById('watchTiktokUrl').value = w.tiktokUrl || '';
  document.getElementById('watchLive').value = w.live ? '1' : '0';
  document.getElementById('watchDesc').value = w.description || '';
  updateWatchHint();
}
function updateWatchHint(){
  const yt = document.getElementById('watchUrl').value.trim();
  const ytHint = document.getElementById('watchUrlHint');
  ytHint.textContent = !yt ? '' : HoopEmbed.extractYouTubeId(yt)
    ? 'YouTube link detected \u2014 the player will embed on the page.'
    : "That doesn't look like a YouTube video or live link.";
  const tt = document.getElementById('watchTiktokUrl').value.trim();
  const ttHint = document.getElementById('watchTiktokHint');
  ttHint.textContent = !tt ? '' : HoopEmbed.extractTikTokVideoId(tt)
    ? 'TikTok video detected \u2014 it will embed as a replay.'
    : /tiktok\.com/.test(tt)
      ? 'TikTok live \u2014 visitors get a "Watch live on TikTok" button (TikTok blocks embedding lives).'
      : "That doesn't look like a TikTok link.";
}
document.getElementById('watchUrl').addEventListener('input', updateWatchHint);
document.getElementById('watchTiktokUrl').addEventListener('input', updateWatchHint);
watchForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  activeComp().watch = {
    title: document.getElementById('watchTitle').value.trim(),
    url: document.getElementById('watchUrl').value.trim(),
    tiktokUrl: document.getElementById('watchTiktokUrl').value.trim(),
    live: document.getElementById('watchLive').value === '1',
    description: document.getElementById('watchDesc').value.trim()
  };
  if(!(await persist())) return;
  toast('Watch Live page updated');
});
document.getElementById('watchClear').addEventListener('click', async ()=>{
  if(!confirm('Clear the stream? The Watch Live page will show "No stream right now".')) return;
  activeComp().watch = {title:'', url:'', tiktokUrl:'', live:false, description:''};
  if(!(await persist())) return; loadWatchForm();
  toast('Stream cleared');
});

/* =========================================================
   SITE SETTINGS
   ========================================================= */
const settingsForm = document.getElementById('settingsForm');
function loadSettingsForm(){
  const s = data.site || {};
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.value = v == null ? '' : v; };
  set('setTitle', s.title);
  set('setTagline', s.tagline);
  set('setPrimaryColor', s.primaryColor || '#0a1f44');
  set('setAccentColor', s.accentColor || '#ff7a3d');
  set('setHeroTitle', s.heroTitle);
  set('setHeroSubtitle', s.heroSubtitle);
  set('setFooterPhone', s.footerPhone);
  set('setEmail', s.contactEmail);
  set('setLocation', s.contactLocation);
  set('setTikTok', s.socialTikTok);
  set('setInstagram', s.socialInstagram);
  set('setMeta', s.metaDescription);
  set('setAboutIntro', s.aboutIntro);
  set('setAboutHow', s.aboutHowItWorks);
  set('setAboutBehind', s.aboutBehindIt);
  set('setDonateIntro', s.donateIntro);
  set('setContactIntro', s.contactIntro);
}
settingsForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const getVal = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

  const footerPhone = getVal('setFooterPhone');
  if(footerPhone){
    const digits = footerPhone.replace(/\D/g, '');
    if(digits.length !== 12 || !digits.startsWith('237')){
      toast('Footer phone must start with +237 and be followed by 9 digits (e.g. +237 677 123 456)', true);
      return;
    }
  }

  data.site = Object.assign({}, data.site, {
    title: getVal('setTitle'),
    tagline: getVal('setTagline'),
    primaryColor: (document.getElementById('setPrimaryColor')||{}).value || '#0a1f44',
    accentColor: (document.getElementById('setAccentColor')||{}).value || '#ff7a3d',
    heroTitle: getVal('setHeroTitle'),
    heroSubtitle: getVal('setHeroSubtitle'),
    footerPhone: footerPhone,
    contactEmail: getVal('setEmail'),
    contactLocation: getVal('setLocation'),
    socialTikTok: getVal('setTikTok'),
    socialInstagram: getVal('setInstagram'),
    metaDescription: getVal('setMeta'),
    aboutIntro: getVal('setAboutIntro'),
    aboutHowItWorks: getVal('setAboutHow'),
    aboutBehindIt: getVal('setAboutBehind'),
    donateIntro: getVal('setDonateIntro'),
    contactIntro: getVal('setContactIntro')
  });
  if(!(await persist())) return;
  toast('Site settings saved — open tabs update live');
});
document.getElementById('settingsReset').addEventListener('click', async ()=>{
  if(!confirm('Reset all site settings to defaults?')) return;
  data.site = Object.assign({}, HOOP_DEFAULTS.site);
  if(!(await persist())) return;
  loadSettingsForm();
  toast('Settings reset');
});

/* =========================================================
   COMPETITIONS
   ========================================================= */
const competitionForm = document.getElementById('competitionForm');
function renderCompetitionsTable(){
  const body = document.getElementById('competitionsTableBody');
  body.innerHTML = (data.competitions||[]).map(c=>`
    <tr>
      <td>${c.coverImg ? `<img src="${esc(c.coverImg)}" alt="" style="width:44px;height:32px;object-fit:cover;border-radius:4px">` : ''}</td>
      <td>${esc(c.name)}</td>
      <td>${esc(c.season||'')}</td>
      <td>${c.active ? '<span class="status-pill live">active</span>' : '<span class="status-pill">hidden</span>'}</td>
      <td class="admin-row-actions">
        <button type="button" class="admin-btn-edit" data-edit-comp="${esc(c.id)}">Edit</button>
        <button type="button" class="admin-btn-delete" data-delete-comp="${esc(c.id)}">Delete</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" style="color:var(--muted)">No competitions yet.</td></tr>';

  body.querySelectorAll('[data-edit-comp]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const c = (data.competitions||[]).find(x=>x.id===btn.dataset.editComp);
      if(!c) return;
      document.getElementById('competitionFormTitle').textContent = 'Edit Competition';
      document.getElementById('competitionEditingId').value = c.id;
      document.getElementById('compId').value = c.id;
      document.getElementById('compId').disabled = true;
      document.getElementById('compSeason').value = c.season||'';
      document.getElementById('compName').value = c.name||'';
      document.getElementById('compTagline').value = c.tagline||'';
      document.getElementById('compDescription').value = c.description||'';
      document.getElementById('compActive').checked = !!c.active;
      document.getElementById('compCover').value = c.coverImg||'';
      const soc = c.socials || {};
      const socTiktok = document.getElementById('compTiktok');
      const socIg = document.getElementById('compInstagram');
      const socX = document.getElementById('compX');
      const socYt = document.getElementById('compYoutube');
      const socFb = document.getElementById('compFacebook');
      if(socTiktok) socTiktok.value = soc.tiktok || '';
      if(socIg) socIg.value = soc.instagram || '';
      if(socX) socX.value = soc.x || '';
      if(socYt) socYt.value = soc.youtube || '';
      if(socFb) socFb.value = soc.facebook || '';
      window.scrollTo({top:competitionForm.offsetTop-20, behavior:'smooth'});
    });
  });
  body.querySelectorAll('[data-delete-comp]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      if(!confirm('Delete this competition? Its page will remain but the homepage card will disappear.')) return;
      data.competitions = (data.competitions||[]).filter(c=>c.id!==btn.dataset.deleteComp);
      if(!(await persist())) return;
      renderCompetitionsTable();
      toast('Competition deleted');
    });
  });
}
function resetCompetitionForm(){
  competitionForm.reset();
  document.getElementById('competitionFormTitle').textContent = 'Add Competition';
  document.getElementById('competitionEditingId').value = '';
  document.getElementById('compId').disabled = false;
}
document.getElementById('competitionFormCancel').addEventListener('click', resetCompetitionForm);
competitionForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const editingId = document.getElementById('competitionEditingId').value;
  const id = document.getElementById('compId').value.trim().toLowerCase();
  const name = document.getElementById('compName').value.trim();
  if(!id || !name){ toast('ID and name are required'); return; }
  const getVal = (elId) => { const el = document.getElementById(elId); return el ? el.value.trim() : ''; };
  const payload = {
    id,
    name,
    season: document.getElementById('compSeason').value.trim(),
    tagline: document.getElementById('compTagline').value.trim(),
    description: document.getElementById('compDescription').value.trim(),
    active: document.getElementById('compActive').checked,
    coverImg: document.getElementById('compCover').value.trim(),
    socials: {
      tiktok: getVal('compTiktok'),
      instagram: getVal('compInstagram'),
      x: getVal('compX'),
      youtube: getVal('compYoutube'),
      facebook: getVal('compFacebook')
    }
  };
  data.competitions = data.competitions || [];
  if(editingId){
    const idx = data.competitions.findIndex(c=>c.id===editingId);
    if(idx>-1){
      data.competitions[idx] = Object.assign({}, data.competitions[idx], payload);
    }
  } else {
    if(data.competitions.some(c=>c.id===id)){ toast('A competition with that ID already exists'); return; }
    data.competitions.push(Object.assign({
      teams: [], games: [], clips: [],
      bracket: null,
      brackets: {},
      watch: {title:'', url:'', tiktokUrl:'', live:false, description:''}
    }, payload));
  }
  if(!(await persist())) return;
  renderCompetitionsTable();
  resetCompetitionForm();
  if(typeof refreshCompSelect === 'function') refreshCompSelect();
  toast('Competition saved');
});

/* ---------- INIT ---------- */
HoopData.ready().then(() => {
  data = HoopData.load();
  activeCompId = HoopData.activeCompetitionId() || (data.competitions[0] && data.competitions[0].id);
  refreshCompSelect();
  loadWatchForm();
  loadSettingsForm();
  populateTeamSelects();
  renderTeamsTable();
  renderRosterTable();
  renderGamesTable();
  renderBracketPanel();
  renderBracketChecklist();
  renderClipsTable();
  renderCompetitionsTable();
});