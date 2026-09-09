// Carrousel de bannière : défilement automatique, points de navigation,
// bouton pause. Le défilement lui-même est natif (scroll-snap CSS) : sans
// JavaScript, les deux diapositives restent accessibles au balayage.
(function () {
  const piste = document.querySelector('#accueil .diapos');
  const controles = document.querySelector('.diapos-controles');
  if (!piste || !controles) return;

  const points = [...controles.querySelectorAll('[data-diapo]')];
  const lecture = controles.querySelector('.lecture');
  const DELAI = 6000;
  let minuteur = null;

  const index = () => Math.round(piste.scrollLeft / piste.clientWidth) || 0;

  function aller(i) {
    piste.scrollTo({ left: i * piste.clientWidth, behavior: 'smooth' });
  }

  function majPoints() {
    const i = index();
    points.forEach((b, n) => b.setAttribute('aria-current', String(n === i)));
  }

  function suivante() { aller((index() + 1) % points.length); }

  function demarrer() {
    if (minuteur) return;
    minuteur = setInterval(suivante, DELAI);
    lecture.textContent = 'Mettre en pause le défilement';
  }

  // Un carrousel qui défile seul doit pouvoir être arrêté (WCAG 2.2.2).
  function arreter() {
    clearInterval(minuteur);
    minuteur = null;
    lecture.textContent = 'Reprendre le défilement';
  }

  piste.addEventListener('scroll', majPoints, { passive: true });
  points.forEach(b => b.addEventListener('click', function () {
    arreter();               // naviguer à la main coupe le défilement auto
    aller(Number(b.dataset.diapo));
  }));
  lecture.addEventListener('click', () => (minuteur ? arreter() : demarrer()));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) arreter();
  else demarrer();

  window.carrousel = { suivante, arreter, demarrer, index, enLecture: () => !!minuteur };
})();
