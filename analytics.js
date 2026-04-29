(() => {
  // Safe-by-default GA4 loader.
  // Set window.PA_GA4_ID = "G-XXXXXXXXXX" before this script runs to enable.
  const id = (window && window.PA_GA4_ID) ? String(window.PA_GA4_ID).trim() : "";
  if (!id) return;

  const s1 = document.createElement('script');
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s1);

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', id);
})();

