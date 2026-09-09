// Filtrage de la galerie projets par catégorie.
// Les photos sont dans le HTML (exigence GEO) : on masque, on ne construit rien.
(function () {
  const groupe = document.querySelector('#projets [role="group"]');
  const galerie = document.querySelector('#galerie');
  if (!groupe || !galerie) return;

  function filtrer(slug) {
    for (const item of galerie.children) {
      item.hidden = slug !== 'all' && item.dataset.category !== slug;
    }
    for (const bouton of groupe.querySelectorAll('button[data-filter]')) {
      bouton.setAttribute('aria-pressed', String(bouton.dataset.filter === slug));
    }
  }

  groupe.addEventListener('click', function (e) {
    const bouton = e.target.closest('button[data-filter]');
    if (bouton) filtrer(bouton.dataset.filter);
  });

  window.filtrerGalerie = filtrer; // utilisé par tests/tests.html
})();
