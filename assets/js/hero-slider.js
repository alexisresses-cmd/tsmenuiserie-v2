// Carrousel de bannière : le défilement est natif (scroll-snap CSS), le
// JavaScript ne sert qu'aux points de navigation. Pas de défilement
// automatique : le visiteur change de diapositive quand il le décide.
(function () {
  const piste = document.querySelector('#accueil .diapos');
  const controles = document.querySelector('.diapos-controles');
  if (!piste || !controles) return;

  const points = [...controles.querySelectorAll('[data-diapo]')];
  const index = () => Math.round(piste.scrollLeft / piste.clientWidth) || 0;

  function majPoints() {
    const i = index();
    points.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
  }

  piste.addEventListener('scroll', majPoints, { passive: true });
  points.forEach(b => b.addEventListener('click', function () {
    piste.scrollTo({ left: Number(b.dataset.diapo) * piste.clientWidth, behavior: 'smooth' });
  }));

  window.carrousel = { index }; // utilisé par tests/tests.html
})();
