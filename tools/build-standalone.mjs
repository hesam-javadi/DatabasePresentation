// Build the flat demo as ONE self-contained HTML file (fonts, CSS and JS inlined).
//   node tools/build-standalone.mjs                 → dist/standalone/demo.html (works offline)
//   node tools/build-standalone.mjs --cdn --out=DIR → body-only page that loads GSAP (cdnjs) and three (jsDelivr)
import { build } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cdn = process.argv.includes('--cdn');
const out = path.resolve(root, process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? 'dist/standalone');
const tmp = path.join(out, '.build');

await build({
  root, configFile: false, base: './', logLevel: 'warn',
  resolve: cdn ? { alias: [{ find: /^gsap$/, replacement: path.join(root, 'tools/gsap-global.js') }] } : {},
  build: {
    outDir: tmp, emptyOutDir: true, assetsInlineLimit: 100_000_000, cssCodeSplit: false, modulePreload: false,
    rollupOptions: { input: path.join(root, 'demo/index.html'), external: cdn ? ['three'] : [] },
  },
});

const dir = path.join(tmp, 'demo');
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
let css = '', js = '';
html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>\s*/g, (_, href) => { css += fs.readFileSync(path.resolve(dir, href), 'utf8'); return ''; });
html = html.replace(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>\s*/g, (_, src) => { js += fs.readFileSync(path.resolve(dir, src), 'utf8'); return ''; });
js = js.replace(/<\/script/gi, '<\\/script');
const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '';
const gsapTag = cdn ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>\n<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js"}}</script>\n' : '';

let page;
if (cdn) {
  // artifact pages are wrapped in their own document skeleton: content only
  page = `${title}\n<style>${css}</style>\n<div id="app"></div>\n${gsapTag}<script type="module">${js}</script>\n`;
} else {
  page = `<!doctype html>\n<html lang="fa" dir="rtl">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${title}\n<style>${css}</style>\n</head>\n<body>\n<div id="app"></div>\n<script type="module">${js}</script>\n</body>\n</html>\n`;
}
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, cdn ? 'index.html' : 'demo.html');
fs.writeFileSync(file, page);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${path.relative(root, file)}  ${(page.length / 1024).toFixed(0)} KB`);
