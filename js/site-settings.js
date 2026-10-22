/* =========================================================
   SITE-SETTINGS.JS — reads data.site and applies it to the page.
   Include on every public page AFTER data.js.
   ========================================================= */
(function(){
  if(typeof HoopData === 'undefined') return;
  const data = HoopData.load();
  const s = data.site || {};

  if(s.primaryColor){
    document.documentElement.style.setProperty('--navy', s.primaryColor);
    document.documentElement.style.setProperty('--royal', s.primaryColor);
  }
  if(s.accentColor){
    document.documentElement.style.setProperty('--gold', s.accentColor);
    document.documentElement.style.setProperty('--accent', s.accentColor);
  }

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

  document.querySelectorAll('.footer-col .contact').forEach(el=>{
    const txt = el.textContent;
    if(s.contactEmail && /@/.test(txt)){
      el.innerHTML = el.innerHTML.replace(/[\w.\-]+@[\w.\-]+/, s.contactEmail);
    } else if(s.contactPhone && /\+237|6XX/.test(txt)){
      el.innerHTML = el.innerHTML.replace(/\+237[^<\s]*(\s*[Xx]{3})*/, s.contactPhone);
    } else if(s.contactLocation && /(Buea|Molyko)/i.test(txt)){
      el.innerHTML = el.innerHTML.replace(/(Buea|Molyko)[^<]*/i, s.contactLocation);
    }
  });

  if(s.socialTikTok){
    document.querySelectorAll('a[aria-label="TikTok"]').forEach(a=>{ a.href = s.socialTikTok; });
  }
  if(s.socialInstagram){
    document.querySelectorAll('a[aria-label="Instagram"]').forEach(a=>{ a.href = s.socialInstagram; });
  }
})();