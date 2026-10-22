/* =========================================================
   LIGHTBOX.JS — click an image clip to see it full size.
   Uses event delegation, so it works on tiles rendered at any time.
   ========================================================= */
(function(){
  let box = null;

  function slug(text){
    return (text || 'clip').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'clip';
  }
  function extFor(type){
    const map = {'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'image/svg+xml':'svg'};
    return map[type] || 'png';
  }
  /* Saves the image to the visitor's device. Falls back to opening it in a new tab
     if the image lives on a site that doesn't allow direct download. */
  async function download(src, caption){
    try{
      const blob = await (await fetch(src)).blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hoop-connect-' + slug(caption) + '.' + extFor(blob.type);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
    }catch(e){
      window.open(src, '_blank', 'noopener');
    }
  }

  function close(){
    if(box){ box.remove(); box = null; }
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e){ if(e.key === 'Escape') close(); }

  function open(src, caption){
    close();
    box = document.createElement('div');
    box.className = 'lightbox';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">&times;</button>'
      + '<img alt="" />'
      + '<div class="lightbox-cap"></div>'
      + '<button type="button" class="lightbox-dl">' + (typeof HOOP_ICONS !== 'undefined' ? HOOP_ICONS.download : '') + ' Download</button>';
    box.querySelector('img').src = src;
    box.querySelector('img').alt = caption || '';
    box.querySelector('.lightbox-cap').textContent = caption || '';
    box.querySelector('.lightbox-dl').addEventListener('click', ()=>download(src, caption));
    box.addEventListener('click', (e)=>{
      if(e.target !== box.querySelector('img') && !e.target.closest('.lightbox-dl')) close();
    });
    document.body.appendChild(box);
    document.addEventListener('keydown', onKey);
  }

  document.addEventListener('click', (e)=>{
    const dl = e.target.closest('[data-download]');
    if(dl){
      const t = dl.closest('.clip');
      const im = t && t.querySelector('img');
      if(im) download(im.src, t.dataset.caption);
      return;
    }
    const tile = e.target.closest('.clip[data-lightbox]');
    if(!tile || e.target.closest('button, a')) return;
    const img = tile.querySelector('img');
    if(img) open(img.src, tile.dataset.caption);
  });
})();
