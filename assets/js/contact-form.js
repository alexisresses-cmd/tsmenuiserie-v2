// Formulaire de contact — envoi via EmailJS, sans backend.
// Trois protections anti-spam : honeypot, délai minimum, reCAPTCHA v3.
(function () {

  /* ------------------------------------------------------------------
     À REMPLIR — clés de la phase 5 du cahier des charges.
     Tant que ces constantes sont vides, le formulaire refuse d'envoyer
     et affiche un message : pas d'échec silencieux.
     ------------------------------------------------------------------ */
  const EMAILJS_CLE_PUBLIQUE = '';   // EmailJS > Account > General > Public Key
  const EMAILJS_SERVICE_ID   = '';   // EmailJS > Email Services
  const EMAILJS_TEMPLATE_ID  = '';   // EmailJS > Email Templates
  const RECAPTCHA_CLE_SITE   = '';   // Google reCAPTCHA v3 > clé de site
  /* ---------------------------------------------------------------- */

  // Un humain met plus de 3 secondes à remplir sept champs ; un robot, non.
  const DELAI_MIN_MS = 3000;

  const form = document.getElementById('contact-form');
  const statut = document.getElementById('form-status');
  if (!form || !statut) return;

  const charge = performance.now();
  const configure = EMAILJS_CLE_PUBLIQUE && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID;

  function message(texte, erreur) {
    statut.textContent = texte;
    statut.dataset.erreur = erreur ? 'oui' : 'non';
  }

  // Charge un script externe une seule fois, à la première interaction avec
  // le formulaire : les visiteurs qui n'y touchent pas ne téléchargent ni
  // EmailJS ni reCAPTCHA (et reCAPTCHA ne dépose rien chez eux).
  const charges = new Map();
  function chargerScript(src) {
    if (!charges.has(src)) {
      charges.set(src, new Promise(function (ok, ko) {
        const el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = ok;
        el.onerror = () => ko(new Error('Échec du chargement de ' + src));
        document.head.appendChild(el);
      }));
    }
    return charges.get(src);
  }

  function prechargerSdk() {
    if (!configure) return;
    chargerScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js')
      .then(() => emailjs.init({ publicKey: EMAILJS_CLE_PUBLIQUE }))
      .catch(() => {});
    if (RECAPTCHA_CLE_SITE) {
      chargerScript('https://www.google.com/recaptcha/api.js?render=' + RECAPTCHA_CLE_SITE)
        .catch(() => {});
    }
  }
  form.addEventListener('focusin', prechargerSdk, { once: true });

  // Jeton reCAPTCHA v3. C'est EmailJS qui le vérifie côté serveur : la
  // vérification doit être activée dans le template EmailJS, sinon le jeton
  // est envoyé sans être contrôlé et ne protège de rien.
  function jetonRecaptcha() {
    if (!RECAPTCHA_CLE_SITE || typeof grecaptcha === 'undefined') return Promise.resolve('');
    return new Promise(function (ok) {
      grecaptcha.ready(function () {
        grecaptcha.execute(RECAPTCHA_CLE_SITE, { action: 'contact' }).then(ok, () => ok(''));
      });
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Honeypot : rempli = robot. On affiche un succès pour ne pas l'informer.
    if (form.societe.value) {
      form.reset();
      message('Merci, votre demande a bien été envoyée.', false);
      return;
    }

    if (performance.now() - charge < DELAI_MIN_MS) {
      message('Merci de prendre quelques instants pour remplir le formulaire, puis de réessayer.', true);
      return;
    }

    if (!configure) {
      message('Le formulaire n’est pas encore relié à son service d’envoi. Contactez-nous directement au 06 16 69 92 06 ou à contact@ts-menuiserie.com.', true);
      console.warn('contact-form.js : clés EmailJS non renseignées.');
      return;
    }

    const bouton = form.querySelector('button[type="submit"]');
    bouton.disabled = true;
    message('Envoi en cours…', false);

    try {
      await prechargerSdk();
      const donnees = new FormData(form);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        nom: donnees.get('nom'),
        prenom: donnees.get('prenom'),
        email: donnees.get('email'),
        telephone: donnees.get('telephone'),
        categories: donnees.getAll('categories').join(', ') || 'Non précisé',
        description: donnees.get('description') || 'Non précisé',
        'g-recaptcha-response': await jetonRecaptcha()
      });
      form.reset();
      message('Merci, votre demande a bien été envoyée. Nous vous recontactons rapidement.', false);
    } catch (err) {
      console.error('contact-form.js :', err);
      message('L’envoi a échoué. Vous pouvez nous joindre au 06 16 69 92 06 ou à contact@ts-menuiserie.com.', true);
    } finally {
      bouton.disabled = false;
    }
  });
})();
