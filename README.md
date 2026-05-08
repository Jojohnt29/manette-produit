# MANETTE — page produit

Page produit MANETTE (MNT—01) en HTML / JSX / Three.js, sans bundler.
Le JSX est compile dans le navigateur via `@babel/standalone`. Three.js est
charge via importmap.

## Structure

```
.
├── produit.html              # entree principale (rewrite "/" -> "/produit.html")
├── product-page.jsx          # composants React de la page
├── product-scene.jsx         # scene Three.js + chargement du GLB
├── tweaks-panel.jsx          # panneau de tweaks (useTweaks + controles)
├── assets/
│   └── manette.glb           # modele 3D (4.9 Mo)
└── uploads/                  # ressources additionnelles
```

## Lancer en local

```bash
python -m http.server 8000
# puis http://localhost:8000/produit.html
```

## Deploiement Vercel

Site statique, zero configuration. Le `vercel.json` ajoute :

- Rewrite `/` → `/produit.html` pour que la racine ouvre la page directement.
- Header `Content-Type: text/javascript` sur les `.jsx` pour que les
  navigateurs les acceptent comme scripts (Babel-standalone fait la
  transformation cote client).
- Cache long sur `/assets/*` (le GLB est immutable).

## Ressources externes utilisees

- React 18.3.1 (UMD via unpkg)
- @babel/standalone 7.29.0 (in-browser JSX transform)
- Three.js 0.160.0 (via importmap)
- Google Fonts : Space Grotesk, JetBrains Mono, Inter Tight, Fraunces, Big
  Shoulders Display, IBM Plex Mono
