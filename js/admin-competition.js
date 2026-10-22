/* =========================================================
   ADMIN-COMPETITIONS.JS — CRUD for competitions
   ========================================================= */
(function(){
  if(!document.getElementById('panel-competitions')) return;

  function getData(){ return HoopData.load(); }
  function saveData(d){ return HoopData.save(d); }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  function renderTable(){
    const d = getData();
    const body = document.getElementById('competitionsTableBody');
    if(!body) return;
    body.innerHTML = d.competitions.map(c=>`
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
      btn.addEventListener('click', ()=>loadIntoForm(btn.dataset.editComp));
    });
    body.querySelectorAll('[data-delete-comp]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.deleteComp;
        const d = getData();
        if(d.competitions.length <= 1){
          alert("You can't delete the last competition — create another one first.");
          return;
        }
        if(!confirm('Delete "'+id+'"? All its teams, games, news, clips, and bracket will be removed.')) return;
        d.competitions = d.competitions.filter(c=>c.id!==id);
        if(!saveData(d)){ alert("Couldn't save — storage might be full."); return; }
        renderTable();
        if(window.hoopRefreshCompSelect) window.hoopRefreshCompSelect();
      });
    });
  }

  function loadIntoForm(id){
    const d = getData();
    const c = d.competitions.find(x=>x.id===id);
    if(!c) return;
    document.getElementById('competitionFormTitle').textContent = 'Edit Competition';
    document.getElementById('compEditingId').value = c.id;
    document.getElementById('compId').value = c.id;
    document.getElementById('compId').disabled = true;
    document.getElementById('compSeason').value = c.season||'';
    document.getElementById('compName').value = c.name||'';
    document.getElementById('compTagline').value = c.tagline||'';
    document.getElementById('compDescription').value = c.description||'';
    document.getElementById('compCover').value = c.coverImg||'';
    document.getElementById('compActive').checked = !!c.active;
  }

  function resetForm(){
    document.getElementById('competitionForm').reset();
    document.getElementById('competitionFormTitle').textContent = 'Add Competition';
    document.getElementById('compEditingId').value = '';
    document.getElementById('compId').disabled = false;
  }

  document.getElementById('competitionFormCancel').addEventListener('click', resetForm);
  document.getElementById('competitionForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const d = getData();
    const editingId = document.getElementById('compEditingId').value;
    const id = document.getElementById('compId').value.trim().toLowerCase();
    const name = document.getElementById('compName').value.trim();
    if(!id || !name){ alert('ID and name are required'); return; }
    if(!/^[a-z0-9_-]+$/.test(id)){ alert('ID must be lowercase letters, numbers, dashes or underscores'); return; }

    if(editingId){
      const c = d.competitions.find(x=>x.id===editingId);
      if(c){
        c.name = name;
        c.season = document.getElementById('compSeason').value.trim();
        c.tagline = document.getElementById('compTagline').value.trim();
        c.description = document.getElementById('compDescription').value.trim();
        c.coverImg = document.getElementById('compCover').value.trim();
        c.active = document.getElementById('compActive').checked;
      }
    } else {
      if(d.competitions.some(c=>c.id===id)){ alert('A competition with that ID already exists'); return; }
      d.competitions.push({
        id, name,
        season: document.getElementById('compSeason').value.trim(),
        tagline: document.getElementById('compTagline').value.trim(),
        description: document.getElementById('compDescription').value.trim(),
        coverImg: document.getElementById('compCover').value.trim(),
        active: document.getElementById('compActive').checked,
        teams: [], games: [], news: [], clips: [],
        bracket: null,
        watch: {title:'', url:'', tiktokUrl:'', live:false, description:''}
      });
    }
    if(!saveData(d)){ alert("Couldn't save — storage might be full."); return; }
    renderTable();
    resetForm();
    if(window.hoopRefreshCompSelect) window.hoopRefreshCompSelect();
  });

  renderTable();
  window.hoopRenderCompetitionsTable = renderTable;
})();