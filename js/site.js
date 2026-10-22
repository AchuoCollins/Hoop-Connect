/* =========================================================
   SITE.JS — shared lightweight behavior for subpages.
   ========================================================= */

(function initReveal(){
  const els = document.querySelectorAll('.reveal-lite');
  if(!els.length) return;

  const isFile = window.location.protocol === 'file:';
  const hasIO = 'IntersectionObserver' in window;
  if(isFile || !hasIO) return;

  els.forEach(el=>{ if(el) el.classList.add('will-reveal'); });

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting && entry.target){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  },{threshold:0.15});
  els.forEach(el=>{ if(el) io.observe(el); });

  setTimeout(()=>{ els.forEach(el=>{ if(el) el.classList.add('is-visible'); }); }, 2000);
})();

(function initFeedTabs(){
  const tabs = document.querySelectorAll('#feedTabs button');
  if(!tabs.length) return;
  tabs.forEach(btn=>{
    if(!btn) return;
    btn.addEventListener('click',()=>{
      const cards = document.querySelectorAll('#feedGrid .feed-card');
      tabs.forEach(b=>{ if(b) b.classList.remove('active'); });
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(c=>{
        if(!c) return;
        c.style.display = (f==='all' || c.dataset.cat===f) ? '' : 'none';
      });
    });
  });
})();

(function initLiveScores(){
  const scoreEls = document.querySelectorAll('.score[data-team]');
  if(!scoreEls.length) return;
  const entries = [...scoreEls];
  setInterval(()=>{
    const el = entries[Math.floor(Math.random()*entries.length)];
    if(!el) return;
    const cur = parseInt(el.textContent,10);
    if(isNaN(cur)) return;
    const add = Math.random()>0.5 ? 2 : 3;
    el.textContent = cur + add;
    if(el.classList){
      el.classList.add('flash');
      setTimeout(()=>{ if(el.classList) el.classList.remove('flash'); },400);
    }
  },8000);
})();