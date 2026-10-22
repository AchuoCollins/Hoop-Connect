/* =========================================================
   NAVBAR.JS — mobile hamburger + drop-down + dark overlay
   Also relocates the search bar into the mobile menu so it's
   usable on small screens (previously hidden).
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const topBar = document.querySelector('.top-bar');
  const navBar = document.querySelector('.nav-bar');
  const searchWrap = document.querySelector('.top-bar .search')
                  || document.querySelector('.search');

  if (!topBar || !navBar) return;
  if (topBar.querySelector('.mobile-menu-btn')) return;

  const BURGER_ICON =
    '<svg class="icon-burger" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  const CLOSE_ICON =
    '<svg class="icon-close" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mobile-menu-btn';
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = BURGER_ICON;
  topBar.insertBefore(btn, topBar.firstChild);

  // Remember where the search box originally lived so we can restore it on desktop
  const searchHomeParent = searchWrap ? searchWrap.parentElement : null;
  const searchHomeNext = searchWrap ? searchWrap.nextElementSibling : null;

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!document.body.classList.contains('menu-open'));
  });

  // Close when tapping any nav link
  navBar.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 720px)').matches) setOpen(false);
    });
  });

  // Close when tapping outside the menu (on the dim overlay or elsewhere)
  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('menu-open')) return;
    if (navBar.contains(e.target) || btn.contains(e.target)) return;
    setOpen(false);
  });

  // Escape key closes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setOpen(false);
  });

  // On resize across the mobile/desktop boundary:
  // - close the menu if leaving mobile
  // - relocate the search box
  let lastIsMobile = null;
  function syncSearchPlacement() {
    if (!searchWrap) return;
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    if (isMobile === lastIsMobile) return;
    lastIsMobile = isMobile;

    if (isMobile) {
      // Move search into the nav menu, just before the links
      const navLinks = navBar.querySelector('.nav-links');
      if (navLinks) navBar.insertBefore(searchWrap, navLinks);
      else navBar.appendChild(searchWrap);
    } else {
      // Move search back into the top bar
      setOpen(false);
      if (searchHomeParent) {
        if (searchHomeNext && searchHomeNext.parentElement === searchHomeParent) {
          searchHomeParent.insertBefore(searchWrap, searchHomeNext);
        } else {
          searchHomeParent.appendChild(searchWrap);
        }
      }
    }
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) setOpen(false);
    syncSearchPlacement();
  });

  // Run once on load
  syncSearchPlacement();
});