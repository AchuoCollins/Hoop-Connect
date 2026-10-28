/* Hoop Connect — mobile menu
   Hamburger toggle for the collapsed nav (<=720px) and moves the search box
   into the menu on phones. Safe to include on every page. If another script
   (e.g. navbar.js) already created a hamburger, this file steps aside. */
(function(){
  var btn=document.getElementById('mobileMenuBtn'), nav=document.getElementById('siteNav');
  var topBar=document.querySelector('.top-bar');
  if(!btn||!nav||!topBar) return;

  var others=[].filter.call(document.querySelectorAll('.mobile-menu-btn'),function(b){return b!==btn;});
  if(others.length){ btn.remove(); return; }

  var mq=window.matchMedia('(max-width:720px)');
  function isOpen(){ return document.body.classList.contains('menu-open'); }
  function setOpen(open){
    document.body.classList.toggle('menu-open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.setAttribute('aria-label',open?'Close menu':'Open menu');
  }
  function place(){
    var s=document.querySelector('header .search'), auth=topBar.querySelector('.auth');
    if(!s) return;
    if(mq.matches){ if(s.parentNode!==nav) nav.insertBefore(s,nav.firstChild); }
    else { if(s.parentNode!==topBar) topBar.insertBefore(s,auth); setOpen(false); }
  }

  document.addEventListener('click',function(e){
    if(e.target.closest('#mobileMenuBtn')){ e.stopPropagation(); setOpen(!isOpen()); return; }
    if(isOpen() && (e.target===nav || e.target.closest('.nav-links a'))) setOpen(false);
  },true);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&isOpen()) setOpen(false); });
  if(mq.addEventListener) mq.addEventListener('change',place); else mq.addListener(place);
  place();

  /* competition page: keep the active section pill visible in the scrolling strip */
  document.addEventListener('comp:page',function(){
    setTimeout(function(){
      var a=document.querySelector('#compSidebarNav a.active');
      if(a&&mq.matches&&a.scrollIntoView) a.scrollIntoView({inline:'center',block:'nearest'});
    },60);
  });
})();
