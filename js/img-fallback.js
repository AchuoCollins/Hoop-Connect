/* =========================================================
   IMG-FALLBACK.JS — if an image fails to load (dead URL,
   expired TikTok cover, etc.) swap it for a neutral placeholder
   instead of showing the browser's broken-image icon.
   Capture-phase listener: 'error' on <img> doesn't bubble, and
   this catches images added later by render.js too.
   ========================================================= */
(function(){
  const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<rect width="400" height="300" fill="#e2e8f0"/>' +
    '<g fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="60" y="70" width="280" height="180" rx="12"/>' +
    '<circle cx="150" cy="140" r="24"/>' +
    '<path d="M60 210l80-70 60 50 60-60 80 80"/>' +
    '</g></svg>'
  );
  document.addEventListener('error', (e)=>{
    const img = e.target;
    if(!img || img.tagName !== 'IMG') return;
    if(img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = '1';
    img.src = PLACEHOLDER;
  }, true);
})();
