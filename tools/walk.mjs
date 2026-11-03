// Walk the deck like a presenter: screenshot → next → wait. Usage: node tools/walk.mjs [start=1.1] [count=999] [out=shots]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const [start = '1.1', count = '999', out = 'shots'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1600,900', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:5180/?capture#${start}`, { waitUntil: 'load' });
await page.waitForFunction('window.deck', { timeout: 120000 });
await new Promise((r) => setTimeout(r, 5000));
let last = '';
for (let k = 0; k < +count; k++) {
  const hash = await page.evaluate(() => location.hash.slice(1));
  if (hash === last) break;
  last = hash;
  const [i, s] = hash.split('.');
  await page.screenshot({ path: `${out}/${String(i).padStart(2, '0')}-${s}.png` });
  console.log('shot', hash);
  await page.keyboard.press('PageDown');
  await new Promise((r) => setTimeout(r, 4800));
}
console.log('ERRORS', JSON.stringify(errors, null, 1));
await browser.close();
