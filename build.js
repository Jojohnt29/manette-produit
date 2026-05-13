/**
 * build.js — concatene les 3 fichiers JSX, transforme via esbuild, minifie.
 *
 * Strategie : pas de "vrai" bundling (les fichiers s'appuient sur des globales
 * React/ReactDOM/THREE et exposent leurs composants sur window). On concatene
 * + transforme JSX + minifie. Le resultat est un seul bundle.js charge en
 * <script defer> a la place des 3 scripts text/babel.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ORDER = [
  'tweaks-panel.jsx',     // useTweaks + TweakSection + TweakColor/Toggle/...
  'product-scene.jsx',    // ProductScene (IIFE, expose via window)
  'product-page.jsx',     // ProductApp + render
];

const banner = `/*! MANETTE produit — bundle JSX (esbuild). Built ${new Date().toISOString()}. */\n`;

const combined = ORDER
  .map((f) => {
    const code = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
    return `// ── ${f} ─────────────────────────────────────────\n${code}`;
  })
  .join('\n\n');

const start = Date.now();
const result = esbuild.transformSync(combined, {
  loader: 'jsx',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  minify: true,
  target: 'es2020',
  legalComments: 'none',
});
const dt = Date.now() - start;

fs.writeFileSync(path.resolve(__dirname, 'bundle.js'), banner + result.code);

const inSize = (combined.length / 1024).toFixed(1);
const outSize = (result.code.length / 1024).toFixed(1);
console.log(`bundle.js  ${inSize} KB JSX -> ${outSize} KB JS  (${dt}ms)`);
