/* =========================================================
   NAVBAR.JS — Mobile hamburger menu toggle
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const topBar = document.querySelector('.top-bar');
  const navBar = document.querySelector('.nav-bar');
  if (!topBar || !navBar) return;

  // Don't inject on desktop — CSS handles visibility, but we still
  // need the button in the DOM so CSS can show it under 900px.
  if (topBar.querySelector('.mobile-menu-btn')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'mobile-menu-btn';
  toggleBtn.setAttribute('aria-label', 'Toggle navigation');
  toggleBtn.setAttribute('aria-expanded', 'false');
  toggleBtn.innerHTML =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

  const auth = topBar.querySelector('.auth');
  if (auth) topBar.insertBefore(toggleBtn, auth);
  else topBar.appendChild(toggleBtn);

  const openIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  const closeIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';

  function setOpen(open){
    navBar.classList.toggle('mobile-open', open);
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleBtn.innerHTML = open ? openIcon : closeIcon;
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!navBar.classList.contains('mobile-open'));
  });

  // Close after clicking any nav link
  navBar.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 720px)').matches) setOpen(false);
    });
  });

  // Close on outside tap
  document.addEventListener('click', (e) => {
    if (!navBar.classList.contains('mobile-open')) return;
    if (navBar.contains(e.target) || toggleBtn.contains(e.target)) return;
    setOpen(false);
  });

  // Close on resize out of mobile
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720) setOpen(false);
  });
});