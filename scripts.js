(() => {
  const nav = document.querySelector('[data-nav]');
  const toggle = document.querySelector('[data-nav-toggle]');
  const menuLinks = nav ? Array.from(nav.querySelectorAll('a')) : [];

  const closeMenu = () => {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    document.body.classList.remove('navLocked');
    toggle.setAttribute('aria-expanded', 'false');
  };

  if (nav && toggle) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('navLocked', isOpen);
    });

    menuLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('open')) return;
      if (!nav.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    const desktopQuery = window.matchMedia('(min-width: 761px)');
    const handleViewportChange = (event) => {
      if (event.matches) closeMenu();
    };
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleViewportChange);
    } else if (desktopQuery.addListener) {
      desktopQuery.addListener(handleViewportChange);
    }
  }

  // Lightweight client-side form guard (no external dependency).
  const form = document.querySelector('form[data-guard]');
  if (form) {
    form.addEventListener('submit', (e) => {
      const status = form.querySelector('[data-form-status]');
      const required = Array.from(form.querySelectorAll('[required]'));
      const missing = required.filter((el) => !String(el.value || '').trim());
      if (missing.length) {
        e.preventDefault();
        if (status) status.textContent = 'Please complete the highlighted required field.';
        missing[0]?.focus?.();
        return;
      }

      if (form.getAttribute('action') === '#') {
        e.preventDefault();
        if (status) {
          status.textContent = 'Thanks. The form is ready to connect to your preferred email or CRM endpoint.';
        }
      }
    });
  }
})();

