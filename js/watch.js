/* =========================================================
   WATCH.JS — renders the Watch Live section for the active
   competition.
   ========================================================= */
function hoopRenderWatch(){
  const data = HoopData.load();
  const comp = HoopData.activeCompetition(data);
  if(!comp) return;

  const player = document.getElementById('watchPlayer');
  const info = document.getElementById('watchInfo');
  const games = document.getElementById('watchGames');
  if(!player) return;

  const w = comp.watch || {};
  const safeUrl = hoopSafeUrl(w.url);
  const ytId = safeUrl ? HoopEmbed.extractYouTubeId(safeUrl) : null;
  const ttUrl = hoopSafeUrl(w.tiktokUrl);
  const ttVideoId = ttUrl ? HoopEmbed.extractTikTokVideoId(ttUrl) : null;
  const title = w.title || 'Live stream';

  const ttIcon = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>';
  const ttButton = url => `<a class="cta-gold" href="${hoopEsc(url)}" target="_blank" rel="noopener">${ttIcon} Watch live on TikTok</a>`;

  let extraTikTokButton = false;

  if(ytId){
    player.innerHTML = `<div class="watch-frame">
      <iframe src="https://www.youtube.com/embed/${encodeURIComponent(ytId)}?rel=0"
        title="${hoopEsc(title)}" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"></iframe>
    </div>`;
    extraTikTokButton = !!ttUrl;
  } else if(ttVideoId){
    player.innerHTML = `<div class="watch-frame portrait">
      <iframe src="https://www.tiktok.com/embed/v2/${encodeURIComponent(ttVideoId)}"
        title="${hoopEsc(title)}" allowfullscreen allow="encrypted-media"></iframe>
    </div>`;
  } else if(ttUrl){
    player.innerHTML = `<div class="watch-empty"><strong>${hoopEsc(title)}</strong>
      We're streaming on TikTok.<br><span style="display:inline-block;margin-top:16px">${ttButton(ttUrl)}</span></div>`;
  } else {
    player.innerHTML = `<div class="watch-empty"><strong>No stream right now</strong>
      Check the schedule below — the player appears here as soon as we go live.</div>`;
  }

  if(info){
    if(safeUrl || ttUrl || w.title || w.description){
      info.innerHTML = `<div class="watch-bar">
          <h2>${hoopEsc(title)}</h2>
          <span class="watch-badge${w.live ? ' on' : ''}">${w.live ? 'LIVE NOW' : 'OFFLINE'}</span>
          ${extraTikTokButton ? `<span style="margin-left:auto">${ttButton(ttUrl)}</span>` : ''}
        </div>
        ${w.description ? `<p class="watch-desc">${hoopEsc(w.description)}</p>` : ''}`;
    } else {
      info.innerHTML = '';
    }
  }

  if(games){
    const list = comp.games.filter(g=>g.status==='live' || g.status==='upcoming')
      .sort((a,b)=> (a.status==='live'?0:1)-(b.status==='live'?0:1)
        || ((a.date||'9999')+(a.time||'')).localeCompare((b.date||'9999')+(b.time||'')));
    games.innerHTML = list.length
      ? list.map(g=>hoopTickerCardHTML(g, comp.teams)).join('')
      : '<p style="color:var(--muted);font-size:14px">No live or upcoming games right now.</p>';
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', hoopRenderWatch);
} else {
  hoopRenderWatch();
}