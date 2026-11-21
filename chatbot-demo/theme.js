// Brand-colour switcher for the demo: shows the widget matching any site colour.
(() => {
  const apply = (color) => {
    document.documentElement.style.setProperty('--brand', color);
    document.querySelectorAll('.swatches button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === color)));
    try { localStorage.setItem('demo-brand', color); } catch { /* storage unavailable */ }
  };
  let saved = null;
  try { saved = localStorage.getItem('demo-brand'); } catch { /* storage unavailable */ }
  if (saved && /^#[0-9a-f]{6}$/i.test(saved)) apply(saved);
  document.querySelectorAll('.swatches button').forEach((b) => b.addEventListener('click', () => apply(b.dataset.color)));
})();
