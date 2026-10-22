/* =========================================================
   COMPETITION-ROUTER.JS — competition.html sidebar layout.
   Populates sidebar head, cover, logo, and socials.
   ========================================================= */
(function(){
  function init(){
    if(typeof HoopData === 'undefined') return;
    if(!document.body || !document.body.classList) return;
    if(!document.body.classList.contains('competition-page')) return;

    const data = HoopData.load();
    const comp = HoopData.activeCompetition(data);

    if(!comp){
      const root = document.querySelector('.competition-root');
      if(root) root.innerHTML = '<div style="padding:60px 20px;text-align:center"><h1 style="font-family:Bebas Neue;font-size:32px">No competitions yet</h1><p style="color:#6b7280;margin-top:8px">An admin needs to create one.</p></div>';
      return;
    }

    HoopData.setActiveCompetitionId(comp.id);
    document.title = comp.name + ' — ' + (data.site.title || 'Hoop Connect');

    // Sidebar head
    const sidebarName = document.getElementById('compSidebarName');
    const sidebarSeason = document.getElementById('compSidebarSeason');
    const sidebarDesc = document.getElementById('compSidebarDesc');
    if(sidebarName) sidebarName.textContent = comp.name;
    if(sidebarSeason) sidebarSeason.textContent = (comp.season || 'Competition');
    if(sidebarDesc) sidebarDesc.textContent = comp.tagline || '';

    // Cover image
    const sidebarCover = document.getElementById('compSidebarCover');
    if(sidebarCover){
      const raw = comp.coverImg || '';
      const safe = (typeof hoopSafeUrl === 'function') ? hoopSafeUrl(raw) : raw;
      if(safe){
        sidebarCover.src = safe;
        sidebarCover.alt = comp.name || '';
      } else {
        sidebarCover.parentElement.style.display = 'none';
      }
    }

    // Logo initials (or comp.logo if provided)
    const sidebarLogo = document.getElementById('compSidebarLogo');
    if(sidebarLogo){
      if(comp.logo){
        sidebarLogo.innerHTML = '<img src="' + comp.logo + '" alt="">';
      } else {
        const initials = (comp.name || 'HC')
          .split(/\s+/)
          .map(w => w[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase();
        sidebarLogo.textContent = initials;
      }
    }

    // Sidebar socials
    const socialsWrap = document.getElementById('compSidebarSocials');
    if(socialsWrap){
      const s = comp.socials || {};
      const icons = {
        tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
        youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.5 15.5v-7l6.5 3.5-6.5 3.5z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>'
      };
      const links = [];
      ['tiktok','instagram','x','youtube','facebook'].forEach(k=>{
        const url = (s[k]||'').trim();
        if(!url) return;
        const safe = (typeof hoopSafeUrl === 'function') ? hoopSafeUrl(url) : url;
        if(!safe) return;
        links.push(`<a href="${safe}" target="_blank" rel="noopener" aria-label="${k}" class="comp-social">${icons[k]}</a>`);
      });
      if(links.length){
        socialsWrap.innerHTML = links.join('');
        socialsWrap.style.display = '';
      } else {
        socialsWrap.style.display = 'none';
      }
    }

    // Page hero
    const eyebrow = document.querySelector('.page-hero .eyebrow');
    const heroTitle = document.querySelector('.page-hero .font-display');
    const heroP = document.querySelector('.page-hero p');
    if(eyebrow) eyebrow.innerHTML = '<span class="live"></span> ' + comp.name + (comp.season ? ' ' + comp.season : '');
    if(heroTitle){
      const words = (comp.name||'').split(/\s+/);
      const last = words.pop();
      heroTitle.innerHTML = words.join(' ') + ' <span class="accent">' + last + '</span>';
    }
    if(heroP) heroP.textContent = comp.description || comp.tagline || '';

    // Sidebar nav links get ?id=
    document.querySelectorAll('#compSidebarNav a').forEach(a=>{
      const href = a.getAttribute('href') || '';
      const m = href.match(/^competition\.html#(\w+)$/);
      if(m){
        a.dataset.page = m[1];
        a.setAttribute('href', 'competition.html?id=' + encodeURIComponent(comp.id) + '#' + m[1]);
      }
    });

    // Preserve ?id= on internal links
    document.querySelectorAll('a[href]').forEach(a=>{
      const href = a.getAttribute('href');
      if(!href) return;
      if(href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) return;
      if(href.startsWith('competition.html')) return;
      if(/^(news|clips|index|about|contact|donate)\.html/.test(href)){
        const sep = href.includes('?') ? '&' : '?';
        a.setAttribute('href', href + sep + 'id=' + encodeURIComponent(comp.id));
      }
    });

    const sections = document.querySelectorAll('[data-comp-section]');
    const validPages = ['overview','teams','scores','bracket','watch'];

    function currentPage(){
      const hash = (location.hash || '').replace('#','');
      return validPages.includes(hash) ? hash : 'overview';
    }

    function showPage(page){
      sections.forEach(s=>{
        if(!s) return;
        s.style.display = (s.dataset.compSection === page) ? '' : 'none';
      });
      document.querySelectorAll('#compSidebarNav a[data-page]').forEach(a=>{
        if(!a) return;
        a.classList.toggle('active', a.dataset.page === page);
      });
      try{
        document.dispatchEvent(new CustomEvent('comp:page', {detail:{page, comp}}));
      }catch(e){}
    }

    window.addEventListener('hashchange', ()=>showPage(currentPage()));
    showPage(currentPage());
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();