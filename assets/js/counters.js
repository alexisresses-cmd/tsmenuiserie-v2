// Compteurs animés, déclenchés au premier passage à l'écran.
(function () {
  const compteurs = document.querySelectorAll('[data-counter]');
  if (!compteurs.length) return;

  const anime = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUREE = 1500;

  function compter(el) {
    const cible = Number(el.dataset.counter) || 0;
    if (!anime) { el.textContent = cible; return; }
    const debut = performance.now();
    (function trame(maintenant) {
      const t = Math.min((maintenant - debut) / DUREE, 1);
      el.textContent = Math.round(cible * (1 - Math.pow(1 - t, 3))); // ease-out
      if (t < 1) requestAnimationFrame(trame);
    })(debut);
  }

  window.animerCompteur = compter; // utilisé par tests/tests.html

  if (!('IntersectionObserver' in window)) {
    compteurs.forEach(compter);
    return;
  }

  const observateur = new IntersectionObserver(function (entrees) {
    for (const entree of entrees) {
      if (entree.isIntersecting) {
        observateur.unobserve(entree.target);
        compter(entree.target);
      }
    }
  }, { threshold: 0.5 });

  compteurs.forEach(el => observateur.observe(el));
})();
