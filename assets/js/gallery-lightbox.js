// Visionneuse de la galerie. Le <dialog> natif fournit le fond modal, la
// fermeture par Échap, le piège à focus et le retour du focus sur la
// vignette : il ne reste à écrire que la navigation entre les photos.
(function () {
  const galerie = document.getElementById('galerie');
  const visionneuse = document.getElementById('visionneuse');
  if (!galerie || !visionneuse || !visionneuse.showModal) return;

  const image = visionneuse.querySelector('img');
  const position = visionneuse.querySelector('.visionneuse-position');
  let index = 0;

  // On ne navigue qu'entre les photos affichées : si un filtre de catégorie
  // est actif, les autres n'existent pas pour la visionneuse.
  const visibles = () => [...galerie.querySelectorAll('li:not([hidden]) img')];

  function afficher(i) {
    const photos = visibles();
    if (!photos.length) return;
    index = (i + photos.length) % photos.length;   // boucle aux deux bouts
    image.src = photos[index].src;
    image.alt = photos[index].alt;
    position.textContent = (index + 1) + ' / ' + photos.length;
  }

  galerie.addEventListener('click', function (e) {
    const vignette = e.target.closest('button.vignette');
    if (!vignette) return;
    afficher(visibles().indexOf(vignette.querySelector('img')));
    visionneuse.showModal();
  });

  visionneuse.addEventListener('click', function (e) {
    if (e.target === visionneuse) { visionneuse.close(); return; }  // clic sur le fond
    const bouton = e.target.closest('[data-action]');
    if (!bouton) return;
    const action = bouton.dataset.action;
    if (action === 'fermer') visionneuse.close();
    else afficher(index + (action === 'suivant' ? 1 : -1));
  });

  visionneuse.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') afficher(index + 1);
    if (e.key === 'ArrowLeft') afficher(index - 1);
  });

  window.visionneuseGalerie = { afficher, position: () => index }; // tests/tests.html
})();
