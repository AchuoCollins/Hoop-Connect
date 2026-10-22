/* =========================================================
   RENDER.JS — draws the ACTIVE competition's data into
   whichever containers exist on the current page.
   ========================================================= */
function hoopSafeUrl(url){
  url = String(url||'').trim();
  if(!url) return '';
  try{
    const u = new URL(url, window.location.href);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? url : '';
  }catch(e){ return ''; }
}
function hoopEsc(str){
  return String(str==null?'':str).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function hoopSortedTeams(teams){
  return [...teams].sort((a,b)=> (b.wins-b.losses) - (a.wins-a.losses) || b.wins-a.wins);
}

const HOOP_ICONS = {
  eye: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  up: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v11H3V10h4zM7 10l4-8a3 3 0 0 1 3 3v4h6a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.6 21H7"/></svg>',
  down: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 14V3h4v11h-4zM17 14l-4 8a3 3 0 0 1-3-3v-4H4a2 2 0 0 1-2-2.3l1.4-8A2 2 0 0 1 5.4 3H17"/></svg>',
  msg: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  download: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 11l5 5 5-5M4 21h16"/></svg>',
  zoom: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  tiktok: '<svg class="hicon" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
  play: '<svg class="hicon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
};

function hoopFormatCount(n){
  n = Number(n) || 0;
  if(n >= 10000){
    const k = n/1000;
    return (k>=100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/,'')) + 'k';
  }
  return n.toLocaleString('en-US');
}
function hoopEngageClass(kind, key){
  if(typeof HoopEngagement==='undefined') return '';
  const on = kind==='like' ? HoopEngagement.hasLiked(key) : HoopEngagement.hasDisliked(key);
  return on ? ' active' : '';
}
function hoopTeamBadge(t, sizeClass){
  const cls = sizeClass ? ' '+sizeClass : '';
  if(t.logo){
    return `<div class="logo${cls}" style="background:#fff;padding:2px"><img src="${hoopEsc(t.logo)}" alt="${hoopEsc(t.name)}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit" /></div>`;
  }
  return `<div class="logo${cls}" style="background:${hoopEsc(t.color)}">${hoopEsc(t.id)}</div>`;
}

function hoopRenderCompetitionCards(data){
  const el = document.getElementById('competitionsGrid');
  if(!el) return;
  const active = (data.competitions||[]).filter(c=>c.active);
  if(!active.length){
    el.innerHTML = '<p style="color:var(--muted);font-size:14px">No competitions yet.</p>';
    return;
  }
  el.classList.add('competitions-list');
  el.classList.remove('is-grid');

  el.innerHTML = active.map(c=>{
    const initials = (c.name||'HC').split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
    const cover = c.coverImg || '';
    const live = (c.games||[]).some(g=>g.status==='live');
    return `<a href="competition.html?id=${encodeURIComponent(c.id)}" class="competition-card">
      <div class="competition-card-media">
        <img src="${hoopEsc(cover)}" alt="${hoopEsc(c.name)}" />
        ${live ? '<span class="competition-card-badge">Live Now</span>' : ''}
        <div class="hc-sidebar-logo" style="position:absolute;left:14px;bottom:-22px;font-size:22px;width:56px;height:56px">${hoopEsc(initials)}</div>
      </div>
      <div class="competition-card-body">
        ${c.season ? `<span class="tag">${hoopEsc(c.season)}</span>` : ''}
        <h3>${hoopEsc(c.name)}</h3>
        <p>${hoopEsc(c.description || c.tagline || '')}</p>
        <span class="competition-card-cta">View Competition
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </span>
      </div>
    </a>`;
  }).join('');
}

function hoopRenderTeamPills(data, comp){
  const el = document.getElementById('teamsScroll');
  if(!el) return;
  el.innerHTML = comp.teams.map(t=>`
    <div class="team-pill">
      ${hoopTeamBadge(t)}
      <div class="name">${hoopEsc(t.name)}</div>
      <div class="rec">${t.wins}W · ${t.losses}L</div>
    </div>`).join('') || '<p style="color:var(--muted);font-size:14px;padding:10px 0">No teams registered yet.</p>';
}

function hoopRenderTeamCards(data, comp){
  const el = document.getElementById('teamsGrid');
  if(!el) return;
  const sorted = hoopSortedTeams(comp.teams);
  el.innerHTML = sorted.map((t,i)=>{
    const players = t.players || [];
    return `<div class="team-card">
      <span class="seed">${i<8 ? 'Seed '+(i+1) : 'Non-playoff'}</span>
      ${hoopTeamBadge(t)}
      <div class="name">${hoopEsc(t.name)}</div>
      <div class="rec">${t.wins}W · ${t.losses}L${t.city?' · '+hoopEsc(t.city):''}</div>
      ${players.length ? `<div class="roster">${players.length} player${players.length===1?'':'s'}: ${players.slice(0,4).map(p=>hoopEsc(p.name)).join(', ')}${players.length>4?'…':''}</div>` : ''}
    </div>`;
  }).join('') || '<p style="color:var(--muted);font-size:14px;padding:10px 0">No teams registered yet.</p>';
}

function hoopRenderStandings(data, comp){
  const bodies = [document.getElementById('standingsBody'), document.getElementById('standingsFullBody')];
  const sorted = hoopSortedTeams(comp.teams);
  const leaderDiff = sorted.length ? (sorted[0].wins - sorted[0].losses) : 0;
  const html = sorted.map((t,i)=>{
    const gb = i===0 ? '—' : (( (leaderDiff - (t.wins-t.losses)) /2 ).toFixed(1));
    return `<tr>
      <td class="pos${i<3?' top':''}">${i+1}</td>
      <td><div class="team-cell">${hoopTeamBadge(t,'team-logo')}${hoopEsc(t.name)}</div></td>
      <td class="w">${t.wins}</td><td class="l">${t.losses}</td><td class="gb">${gb}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="color:var(--muted);font-size:14px;padding:10px 0">No teams registered yet.</td></tr>`;
  bodies.forEach(b=>{ if(b) b.innerHTML = html; });
}

function hoopFormatDate(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr+'T00:00:00');
  if(isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
}
function hoopWatchLink(url){
  url = hoopSafeUrl(url);
  return url ? ` · <a href="${hoopEsc(url)}" target="_blank" rel="noopener" style="color:var(--royal);font-weight:600">Watch</a>` : '';
}
function hoopTickerCardHTML(game, teams){
  if(game.status==='upcoming'){
    const teamA = game.teamA ? HoopData.teamById(teams, game.teamA).name : 'TBD';
    const teamB = game.teamB ? HoopData.teamById(teams, game.teamB).name : 'TBD';
    const label = [hoopFormatDate(game.date), game.time].filter(Boolean).join(' · ');
    const timeLine = [game.round, game.venue].filter(Boolean).join(' · ');
    return `<div class="ticker-upcoming">
      <div class="label">${hoopEsc(label)}</div>
      <div class="match">${hoopEsc(teamA)} vs. ${hoopEsc(teamB)}</div>
      <div class="time">${hoopEsc(timeLine)}${hoopWatchLink(game.streamUrl)}</div>
    </div>`;
  }
  const teamA = HoopData.teamById(teams, game.teamA);
  const teamB = HoopData.teamById(teams, game.teamB);
  const isLive = game.status==='live';
  return `<div class="ticker-card${isLive?' live':''}">
    <div class="ticker-top">${isLive?'<span class="live-dot">LIVE</span>':'<span>FINAL</span>'}<span>${hoopEsc(game.court||'')}</span></div>
    <div class="ticker-teams">
      <div class="ticker-team"><span class="name">${hoopEsc(teamA.name)}</span><span class="score"${isLive?` data-team="${game.id}-A"`:''}>${game.scoreA}</span></div>
      <span class="ticker-vs">—</span>
      <div class="ticker-team"><span class="name">${hoopEsc(teamB.name)}</span><span class="score"${isLive?` data-team="${game.id}-B"`:''}>${game.scoreB}</span></div>
    </div>
    <div class="ticker-meta"><span class="${isLive?'q':''}">${hoopEsc(game.meta||'')}</span><span>${hoopEsc(game.note||'')}${hoopWatchLink(game.streamUrl)}</span></div>
  </div>`;
}
function hoopRenderTicker(data, comp){
  const el = document.getElementById('tickerTrack');
  if(!el) return;
  el.innerHTML = comp.games.map(g=>hoopTickerCardHTML(g, comp.teams)).join('') || `<p style="color:var(--muted);font-size:14px;padding:10px 0">No games yet.</p>`;
}

function hoopRenderScoresPage(data, comp){
  const liveEl = document.getElementById('liveGrid');
  const finalEl = document.getElementById('finalGrid');
  const upEl = document.getElementById('upcomingGrid');
  if(!liveEl && !finalEl && !upEl) return;
  const byStatus = s => comp.games.filter(g=>g.status===s).map(g=>hoopTickerCardHTML(g, comp.teams)).join('') || '<p style="color:var(--muted);font-size:14px">Nothing here right now.</p>';
  if(liveEl) liveEl.innerHTML = byStatus('live');
  if(finalEl) finalEl.innerHTML = byStatus('final');
  if(upEl) upEl.innerHTML = byStatus('upcoming');
}

function hoopRenderFeatured(data, comp){
  const el = document.getElementById('featuredArticle');
  if(!el) return;
  const item = comp.news.find(n=>n.featured) || comp.news[0];
  if(!item){ el.innerHTML = '<p style="color:var(--muted);font-size:14px;padding:10px 0">No articles yet.</p>'; return; }
  el.innerHTML = `
    <div class="featured-img"><img src="${hoopEsc(item.img)}" alt="${hoopEsc(item.title)}" /></div>
    <div class="featured-body">
      <span class="tag">${hoopEsc(item.kicker)}</span>
      <h2>${hoopEsc(item.title)}</h2>
      <p>${hoopEsc(item.body||'')}</p>
      <div class="meta-row">
        <span class="stat">${HOOP_ICONS.eye} ${hoopFormatCount(item.views)} views</span>
        <button class="stat stat-engage${hoopEngageClass('like','news:'+item.id)}" data-engage-like="news:${hoopEsc(item.id)}">${HOOP_ICONS.up}<span>${hoopFormatCount(item.likes)}</span></button>
        <button class="stat stat-engage${hoopEngageClass('dislike','news:'+item.id)}" data-engage-dislike="news:${hoopEsc(item.id)}">${HOOP_ICONS.down}<span>${hoopFormatCount(item.dislikes||0)}</span></button>
        <span class="stat">${HOOP_ICONS.msg} ${hoopFormatCount(item.comments)} comments</span>
      </div>
    </div>`;
}

function hoopFeedCardHTML(item, revealClass, tilt){
  const rc = (tilt?' tilt3d':'') + (revealClass ? ' '+revealClass : '');
  return `<article class="feed-card${rc}" data-cat="${hoopEsc(item.cat)}">
    <div class="thumb">
      <img src="${hoopEsc(item.img)}" alt="${hoopEsc(item.title)}" />
      <div class="play"></div>
      <span class="dur">${hoopEsc(item.dur||'')}</span>
      <span class="cat">${hoopEsc(item.cat)}</span>
    </div>
    <div class="body">
      <div class="kicker">${hoopEsc(item.kicker||'')}</div>
      <h3>${hoopEsc(item.title)}</h3>
      <div class="stats">
        <span>${HOOP_ICONS.eye} ${hoopFormatCount(item.views)}</span>
        <button class="stat-engage${hoopEngageClass('like','news:'+item.id)}" data-engage-like="news:${hoopEsc(item.id)}">${HOOP_ICONS.up}<span>${hoopFormatCount(item.likes)}</span></button>
        <button class="stat-engage${hoopEngageClass('dislike','news:'+item.id)}" data-engage-dislike="news:${hoopEsc(item.id)}">${HOOP_ICONS.down}<span>${hoopFormatCount(item.dislikes||0)}</span></button>
        <span>${HOOP_ICONS.msg} ${hoopFormatCount(item.comments)}</span>
      </div>
    </div>
  </article>`;
}
function hoopRenderFeed(data, comp){
  const el = document.getElementById('feedGrid');
  if(!el) return;
  const scope = el.dataset.scope || '';
  const revealClass = el.dataset.revealClass || '';
  const tilt = el.dataset.tilt === 'true';
  let items = comp.news.filter(n=>!n.featured);
  if(scope === 'home' || scope === 'comp-overview') items = items.slice(0,4);
  el.innerHTML = items.map(i=>hoopFeedCardHTML(i, revealClass, tilt)).join('') || '<p style="color:var(--muted);font-size:14px;padding:10px 0">No articles yet.</p>';
}

function hoopClipHTML(clip, revealClass){
  const sizeClass = clip.size ? ' '+clip.size : '';
  const rc = revealClass ? ' '+revealClass : '';
  const key = 'clip:'+clip.id;
  const safeSourceUrl = hoopSafeUrl(clip.sourceUrl);
  const isVideo = !!safeSourceUrl;
  const overlay = isVideo
    ? `<a class="clip-link" href="${hoopEsc(safeSourceUrl)}" target="_blank" rel="noopener" aria-label="Watch on TikTok"></a>
    <span class="clip-badge">${HOOP_ICONS.tiktok} TikTok</span>
    <div class="play-sm"></div>`
    : `<div class="play-sm zoom">${HOOP_ICONS.zoom}</div>
    <button type="button" class="clip-dl" data-download aria-label="Download image" title="Download image">${HOOP_ICONS.download}</button>`;
  return `<div class="clip${sizeClass}${rc}"${isVideo ? '' : ' data-lightbox'} data-caption="${hoopEsc(clip.cap)}">
    <img src="${hoopEsc(clip.img)}" alt="${hoopEsc(clip.cap)}" />
    ${overlay}
    <span class="views">${HOOP_ICONS.eye} ${hoopFormatCount(clip.views)}</span>
    <div class="cap">${hoopEsc(clip.cap)}</div>
    <div class="clip-stats">
      <button class="stat-engage${hoopEngageClass('like',key)}" data-engage-like="${key}">${HOOP_ICONS.up}<span>${hoopFormatCount(clip.likes||0)}</span></button>
      <button class="stat-engage${hoopEngageClass('dislike',key)}" data-engage-dislike="${key}">${HOOP_ICONS.down}<span>${hoopFormatCount(clip.dislikes||0)}</span></button>
      <span class="cstat">${HOOP_ICONS.msg} ${hoopFormatCount(clip.comments||0)}</span>
    </div>
  </div>`;
}
function hoopRenderClips(data, comp){
  const el = document.getElementById('clipsGrid');
  if(!el) return;
  const limit = el.dataset.limit ? parseInt(el.dataset.limit,10) : comp.clips.length;
  const revealClass = el.dataset.revealClass || '';
  el.innerHTML = comp.clips.slice(0,limit).map(c=>hoopClipHTML(c, revealClass)).join('') || '<p style="color:var(--muted);font-size:14px;padding:10px 0">No clips yet.</p>';
}

function hoopBracketMatchHTML(m, teams){
  if(m.bye){
    const who = m.teamA || m.teamB;
    const t = who ? HoopData.teamById(teams, who) : null;
    return `<div class="ticker-card bracket-bye">
      <div class="ticker-top"><span>BYE</span><span>Seed ${m.teamA ? m.seedA : m.seedB}</span></div>
      <div class="ticker-teams"><div class="ticker-team"><span class="name">${hoopEsc(t ? t.name : 'TBD')}</span></div></div>
      <div class="ticker-meta"><span>Advances automatically</span><span></span></div>
    </div>`;
  }
  const teamA = m.teamA ? HoopData.teamById(teams, m.teamA) : null;
  const teamB = m.teamB ? HoopData.teamById(teams, m.teamB) : null;
  const nameA = teamA ? teamA.name : 'TBD';
  const nameB = teamB ? teamB.name : 'TBD';
  const seedLabel = (m.seedA && m.seedB) ? `(${m.seedA}) vs (${m.seedB})` : '';
  const isLive = m.status === 'live';
  const isFinal = m.status === 'final';
  const winner = typeof HoopBracket!=='undefined' ? HoopBracket.winnerOf(m) : '';
  const aClass = winner ? (winner===m.teamA ? ' winner' : ' loser') : '';
  const bClass = winner ? (winner===m.teamB ? ' winner' : ' loser') : '';
  const badge = isLive ? '<span class="live-dot">LIVE</span>' : isFinal ? '<span>FINAL</span>' : '<span>UPCOMING</span>';
  const teamsHtml = (isLive||isFinal)
    ? `<div class="ticker-teams">
        <div class="ticker-team${aClass}"><span class="name">${hoopEsc(nameA)}</span><span class="score">${m.scoreA}</span></div>
        <span class="ticker-vs">—</span>
        <div class="ticker-team${bClass}"><span class="name">${hoopEsc(nameB)}</span><span class="score">${m.scoreB}</span></div>
      </div>`
    : `<div class="ticker-teams">
        <div class="ticker-team"><span class="name">${hoopEsc(nameA)}</span></div>
        <span class="ticker-vs">vs</span>
        <div class="ticker-team"><span class="name">${hoopEsc(nameB)}</span></div>
      </div>`;
  return `<div class="ticker-card${isLive?' live':''}">
    <div class="ticker-top">${badge}<span>${hoopEsc(m.court||'')}</span></div>
    ${teamsHtml}
    <div class="ticker-meta"><span>${hoopEsc(seedLabel)}</span><span>${hoopEsc(m.note||'')}</span></div>
  </div>`;
}
function hoopRenderBracket(data, comp){
  const el = document.getElementById('bracketRounds');
  if(!el || typeof HoopBracket==='undefined') return;
  const nqWrap = document.getElementById('bracketNonQualifiersWrap');
  const nqEl = document.getElementById('bracketNonQualifiers');
  const bracket = comp.bracket;
  if(!HoopBracket.exists(bracket)){
    el.style.removeProperty('--rounds');
    el.innerHTML = '<p class="bracket-empty">The bracket hasn\'t been created yet.</p>';
    if(nqWrap) nqWrap.style.display = 'none';
    return;
  }
  const rounds = HoopBracket.computeRounds(bracket);
  el.style.setProperty('--rounds', rounds.length);
  el.innerHTML = rounds.map((round,ri)=>{
    const isFinalRound = ri === rounds.length-1;
    return `<div class="bracket-round${isFinalRound?' round-final':''}">
      <h3>${hoopEsc(round.name)}</h3>
      <div class="bracket-round-body">${round.matches.map(m=>hoopBracketMatchHTML(m, comp.teams)).join('')}</div>
    </div>`;
  }).join('');

  if(nqEl){
    const nonQualifiers = HoopBracket.nonQualifiers(comp.teams, bracket);
    if(!nonQualifiers.length){
      if(nqWrap) nqWrap.style.display = 'none';
    } else {
      if(nqWrap) nqWrap.style.display = '';
      nqEl.innerHTML = nonQualifiers.map(t=>`
        <div class="team-pill">
          ${hoopTeamBadge(t)}
          <div class="name">${hoopEsc(t.name)}</div>
          <div class="rec">${t.wins}W · ${t.losses}L</div>
        </div>`).join('');
    }
  }
}

function hoopRenderAll(){
  const data = HoopData.load();
  const comp = HoopData.activeCompetition(data);
  hoopRenderCompetitionCards(data);
  if(comp){
    hoopRenderTeamPills(data, comp);
    hoopRenderTeamCards(data, comp);
    hoopRenderStandings(data, comp);
    hoopRenderTicker(data, comp);
    hoopRenderScoresPage(data, comp);
    hoopRenderFeatured(data, comp);
    hoopRenderFeed(data, comp);
    hoopRenderClips(data, comp);
    hoopRenderBracket(data, comp);
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', hoopRenderAll);
} else {
  hoopRenderAll();
}