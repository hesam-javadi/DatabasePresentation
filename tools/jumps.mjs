// Jump to every step forwards and backwards in one live page and report errors.
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5180/?capture', { waitUntil: 'load' });
await page.waitForFunction('window.deck', { timeout: 120000 });
const n = await page.evaluate(async () => {
  const d = window.deck; let k = 0;
  const all = d.scenes.flatMap((s, i) => Array.from({ length: s.steps }, (_, j) => [i, j + 1]));
  for (const [i, s] of [...all, ...all.reverse()]) { d.goto(i, s); k++; await new Promise((r) => setTimeout(r, 60)); }
  for (let r = 0; r < 40; r++) { const [i, s] = all[Math.floor(Math.random() * all.length)]; d.goto(i, s, true); await new Promise((r) => setTimeout(r, 60)); }
  for (let r = 0; r < 60; r++) { d.prev(); await new Promise((r) => setTimeout(r, 30)); }
  return k;
});
await new Promise((r) => setTimeout(r, 3000));
console.log('visited', n, 'ERRORS', JSON.stringify(errors));
await browser.close();
