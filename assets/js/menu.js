// Menu mobile : le bouton bascule aria-expanded, le CSS s'occupe du reste.
(function () {
  const bouton = document.querySelector('.menu-bouton');
  const nav = document.getElementById('menu-principal');
  if (!bouton || !nav) return;

  const ouvrir = etat => {
    bouton.setAttribute('aria-expanded', String(etat));
    bouton.setAttribute('aria-label', etat ? 'Fermer le menu' : 'Ouvrir le menu');
  };

  bouton.addEventListener('click', () => ouvrir(bouton.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) ouvrir(false); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bouton.getAttribute('aria-expanded') === 'true') {
      ouvrir(false);
      bouton.focus();
    }
  });
})();
