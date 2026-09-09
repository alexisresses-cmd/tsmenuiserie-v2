"""Recette du site : liens, métadonnées, accessibilité, restes de template.

    python3 tests/recette.py

Complète tests/tests.html (qui teste le JavaScript dans un navigateur).
Ne remplace pas la vérification cross-navigateur ni le Rich Results Test,
qui demandent le site en ligne.
"""
import re, os, json

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html', 'mentions-legales.html', 'politique-de-confidentialite.html']
pb = []

def lire(f):
    s = open(os.path.join(RACINE, f), encoding='utf-8').read()
    return re.sub(r'(?s)<!--.*?-->', '', s)  # les exemples en commentaire ne sont pas du contenu

# --- liens internes et ancres ---
for f in PAGES:
    s = lire(f)
    ids = set(re.findall(r'id="([^"]+)"', s))
    for href in re.findall(r'href="([^"]+)"', s):
        if href.startswith('#'):
            if href[1:] not in ids: pb.append(f'{f} : ancre morte {href}')
        elif href.startswith('/'):
            cible = os.path.join(RACINE, href.lstrip('/'))
            if not os.path.exists(cible): pb.append(f'{f} : lien mort {href}')
    for src in re.findall(r'src="(/[^"]+)"', s):
        if not os.path.exists(os.path.join(RACINE, src.lstrip('/'))):
            pb.append(f'{f} : ressource absente {src}')

# --- id dupliqués ---
for f in PAGES:
    ids = re.findall(r'id="([^"]+)"', lire(f))
    for i in set(ids):
        if ids.count(i) > 1: pb.append(f'{f} : id dupliqué "{i}"')

# --- métadonnées ---
for f in PAGES:
    s = lire(f)
    t = re.search(r'<title>(.*?)</title>', s).group(1)
    d = re.search(r'<meta name="description" content="([^"]*)"', s)
    if not d: pb.append(f'{f} : pas de meta description')
    else:
        n = len(d.group(1))
        if n > 160: pb.append(f'{f} : description {n} caractères (>160)')
    if len(t) > 65: pb.append(f'{f} : title {len(t)} caractères (>65)')
    if 'rel="canonical"' not in s: pb.append(f'{f} : pas de canonical')
    if 'favicon' not in s and 'rel="icon"' not in s: pb.append(f'{f} : pas de favicon déclaré')
    if len(re.findall(r'<h1', s)) != 1: pb.append(f'{f} : {len(re.findall(r"<h1", s))} h1')

# --- ordre des titres ---
for f in PAGES:
    niv = [int(m) for m in re.findall(r'<h([1-6])', lire(f))]
    for a, b in zip(niv, niv[1:]):
        if b > a + 1: pb.append(f'{f} : saut de titre h{a} -> h{b}')

# --- formulaire : chaque champ a un label ---
s = lire('index.html')
form = s[s.index('<form id="contact-form"'):s.index('</form>')]
labels = set(re.findall(r'<label for="([^"]+)"', form))
for cid in re.findall(r'<(?:input|textarea)[^>]*id="([^"]+)"', form):
    if cid not in labels: pb.append(f'formulaire : champ #{cid} sans label')

# --- images : alt présent et unique (exigence SEO sur la galerie projets) ---
for f in PAGES:
    alts = []
    for img in re.findall(r'<img[^>]*>', lire(f)):
        m = re.search(r'alt="([^"]*)"', img)
        if not m or not m.group(1).strip():
            pb.append(f'{f} : <img> sans alt — {img[:70]}')
        else:
            alts.append(m.group(1))
        if 'loading="lazy"' not in img: pb.append(f'{f} : <img> sans loading=lazy — {img[:70]}')
    for a in set(alts):
        if alts.count(a) > 1: pb.append(f'{f} : alt dupliqué "{a}" ({alts.count(a)} fois)')

# --- contrastes WCAG AA ---
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def ratio(a, b):
    l1, l2 = sorted([lum(a), lum(b)], reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)
paires = [
    ('texte #444444 sur blanc', '#444444', '#ffffff', 4.5),
    ('titres #29231f sur blanc', '#29231f', '#ffffff', 4.5),
    ('rouge #d90429 sur blanc (liens)', '#d90429', '#ffffff', 4.5),
    ('sur-titre rouge clair sur brun #221715', '#ec5a52', '#221715', 4.5),
    ('blanc sur rouge (boutons)', '#ffffff', '#d90429', 4.5),
    ('blanc sur brun #221715', '#ffffff', '#221715', 4.5),
    ('compteur rouge sur crème #eeead8 (grand texte)', '#d90429', '#eeead8', 3.0),
]
contrastes = []
for nom, fg, bg, seuil in paires:
    r = ratio(fg, bg)
    contrastes.append((nom, round(r, 2), seuil))
    if r < seuil: pb.append(f'contraste insuffisant — {nom} : {r:.2f}:1 (minimum {seuil})')

# --- JSON-LD ---
d = json.loads(re.search(r'(?s)ld\+json">(.*?)</script>', lire('index.html')).group(1))
faq_ld = {q['name'] for q in d['@graph'][2]['mainEntity']}
faq_page = set(re.findall(r'<h3>([^<]*\?)</h3>', lire('index.html')))
for q in faq_ld:
    if q not in faq_page: pb.append(f'JSON-LD : question absente du texte visible — {q}')

# --- restes de template et placeholders ---
for f in PAGES + ['llms.txt', 'sitemap.xml', 'robots.txt']:
    s = lire(f)
    for motif in ['example.com', 'Los Angle', 'Tailstoi', 'lorem ipsum', '+1800']:
        if motif.lower() in s.lower(): pb.append(f'{f} : reste de template "{motif}"')

print('=== CONTRASTES ===')
for nom, r, seuil in contrastes:
    print(f'  {"OK " if r >= seuil else "NON"} {r:>6}:1  (min {seuil})  {nom}')
print()
print('=== PROBLÈMES ===')
print('\n'.join('  - ' + x for x in pb) if pb else '  aucun')
raise SystemExit(1 if pb else 0)
