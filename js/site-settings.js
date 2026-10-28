/* =========================================================
   SITE-SETTINGS.JS — applies data.site to public pages.
   Include AFTER data.js.
   ========================================================= */
(function(){
  if(typeof HoopData === 'undefined') return;

  function hexToRgb(hex){
    hex = String(hex || '').replace('#','').trim();
    if(hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const m = /^([a-f0-9]{6})$/i.exec(hex);
    if(!m) return null;
    const n = parseInt(m[1],16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  }
  function setVar(name, val){ document.documentElement.style.setProperty(name, val); }

  function applySiteSettings(){
    const data = HoopData.load();
    const s = data.site || {};

    /* -------- Colors -------- */
    if(s.primaryColor){
      setVar('--navy', s.primaryColor);
      setVar('--navy-mid', s.primaryColor);
      setVar('--royal', s.primaryColor);
      setVar('--royal-deep', s.primaryColor);
      const rgb = hexToRgb(s.primaryColor);
      if(rgb){
        setVar('--navy-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
        setVar('--royal-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
      }
    }
    if(s.accentColor){
      setVar('--gold', s.accentColor);
      setVar('--gold-deep', s.accentColor);
      setVar('--accent', s.accentColor);
      const rgb = hexToRgb(s.accentColor);
      if(rgb) setVar('--gold-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
    }

    /* -------- Title & meta -------- */
    if(s.title){
      const current = document.title || '';
      const parts = current.split('—').map(x=>x.trim());
      document.title = parts.length > 1 ? parts[0] + ' — ' + s.title : s.title;
    }
    if(s.metaDescription){
      let meta = document.querySelector('meta[name="description"]');
      if(!meta){
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', s.metaDescription);
    }

    /* -------- Logo text -------- */
    if(s.title){
      document.querySelectorAll('.logo').forEach(el=>{
        const mark = el.querySelector('.logo-mark');
        if(!mark) return;
        const words = s.title.trim().split(/\s+/);
        const last = words.pop();
        const first = words.join(' ');
        el.innerHTML = '';
        el.appendChild(mark);
        el.appendChild(document.createTextNode(first + ' '));
        const span = document.createElement('span');
        span.className = 'accent';
        span.textContent = last;
        el.appendChild(span);
      });
    }

    /* -------- Hero -------- */
    const heroTitleEl = document.querySelector('.page-hero .font-display');
    const heroP = document.querySelector('.page-hero p');
    if(heroTitleEl && s.heroTitle){
      const words = s.heroTitle.trim().split(/\s+/);
      const last = words.pop();
      heroTitleEl.innerHTML = '';
      heroTitleEl.appendChild(document.createTextNode(words.join(' ') + ' '));
      const span = document.createElement('span');
      span.className = 'accent';
      span.textContent = last;
      heroTitleEl.appendChild(span);
    }
    if(heroP && s.heroSubtitle) heroP.textContent = s.heroSubtitle;

    /* -------- Footer: ONE phone contact -------- */
    document.querySelectorAll('[data-footer-phone]').forEach(el=>{
      if(s.footerPhone) el.textContent = s.footerPhone;
    });

    /* Footer brand blurb */
    document.querySelectorAll('[data-footer-blurb]').forEach(el=>{
      if(s.tagline) el.textContent = s.tagline + '. Every game. Every clip. Every team — connected.';
    });

    /* -------- Page intros -------- */
    const intros = {
      'about': s.aboutIntro,
      'about-how': s.aboutHowItWorks,
      'about-behind': s.aboutBehindIt,
      'donate': s.donateIntro,
      'contact': s.contactIntro
    };
    Object.keys(intros).forEach(k=>{
      const v = intros[k];
      if(!v) return;
      document.querySelectorAll(`[data-page-intro="${k}"]`).forEach(el=>{ el.textContent = v; });
    });

    /* -------- Contact page markers -------- */
    if(s.contactEmail) document.querySelectorAll('[data-contact-email]').forEach(el=>{
      if(el.tagName === 'A'){ el.href = 'mailto:' + s.contactEmail; el.textContent = s.contactEmail; }
      else el.textContent = s.contactEmail;
    });
    if(s.footerPhone) document.querySelectorAll('[data-contact-phone]').forEach(el=>{
      const tel = s.footerPhone.replace(/[^\d+]/g,'');
      if(el.tagName === 'A'){ el.href = 'tel:' + tel; el.textContent = s.footerPhone; }
      else el.textContent = s.footerPhone;
    });
    if(s.contactLocation) document.querySelectorAll('[data-contact-location]').forEach(el=>{
      el.textContent = s.contactLocation;
    });

    /* -------- Social links -------- */
    if(s.socialTikTok) document.querySelectorAll('a[aria-label="TikTok"]').forEach(a=>{ a.href = s.socialTikTok; });
    if(s.socialInstagram) document.querySelectorAll('a[aria-label="Instagram"]').forEach(a=>{ a.href = s.socialInstagram; });
  }

  try { applySiteSettings(); } catch(e){ console.warn('[site-settings] initial:', e); }
  if(typeof HoopData.ready === 'function'){
    HoopData.ready().then(() => {
      try { applySiteSettings(); } catch(e){ console.warn('[site-settings] ready:', e); }
    });
  }
  document.addEventListener('hoop:data-updated', () => {
    try { applySiteSettings(); } catch(e){ console.warn('[site-settings] realtime:', e); }
  });

  window.hoopApplySiteSettings = applySiteSettings;
})();