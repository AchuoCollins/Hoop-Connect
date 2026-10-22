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
      if(rgb) setVar('--navy-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
      if(rgb) setVar('--royal-rgb', `${rgb.r},${rgb.g},${rgb.b}`);
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
      if(parts.length > 1){
        document.title = parts[0] + ' — ' + s.title;
      } else {
        document.title = s.title;
      }
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

    /* -------- Logo text (all .logo elements) -------- */
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

    /* -------- Footer contact info -------- */
    if(s.contactEmail){
      document.querySelectorAll('.footer-col .contact, .contact-card a[href^="mailto"]').forEach(el=>{
        if(el.tagName === 'A' && el.href.startsWith('mailto:')){
          el.href = 'mailto:' + s.contactEmail;
          el.textContent = s.contactEmail;
        } else {
          el.innerHTML = el.innerHTML.replace(/[\w.\-]+@[\w.\-]+/, s.contactEmail);
        }
      });
    }
    if(s.contactPhone){
      document.querySelectorAll('.footer-col .contact, .contact-card a[href^="tel"]').forEach(el=>{
        if(el.tagName === 'A' && el.href.startsWith('tel:')){
          el.href = 'tel:' + s.contactPhone.replace(/\s+/g,'');
          el.textContent = s.contactPhone;
        } else {
          el.innerHTML = el.innerHTML.replace(/\+237[^<\s]*(\s*[Xx]{3})*/, s.contactPhone);
        }
      });
    }
    if(s.contactLocation){
      document.querySelectorAll('.footer-col .contact').forEach(el=>{
        if(/(Buea|Molyko|Cameroon)/i.test(el.textContent)){
          el.innerHTML = el.innerHTML.replace(/(Buea|Molyko|Cameroon)[^<]*/i, s.contactLocation);
        }
      });
    }

    /* -------- Social links -------- */
    if(s.socialTikTok){
      document.querySelectorAll('a[aria-label="TikTok"]').forEach(a=>{ a.href = s.socialTikTok; });
    }
    if(s.socialInstagram){
      document.querySelectorAll('a[aria-label="Instagram"]').forEach(a=>{ a.href = s.socialInstagram; });
    }
  }

  /* Run once immediately with whatever is in cache (avoids flash of unstyled/default). */
  try { applySiteSettings(); } catch(e){ console.warn('[site-settings] initial:', e); }

  /* Re-run when the real Supabase data finishes loading. */
  if(typeof HoopData.ready === 'function'){
    HoopData.ready().then(() => {
      try { applySiteSettings(); } catch(e){ console.warn('[site-settings] ready:', e); }
    });
  }

  /* Re-run when realtime updates arrive, so an admin edit shows up live. */
  document.addEventListener('hoop:data-updated', () => {
    try { applySiteSettings(); } catch(e){ console.warn('[site-settings] realtime:', e); }
  });

  /* Expose for manual re-apply if needed. */
  window.hoopApplySiteSettings = applySiteSettings;
})();