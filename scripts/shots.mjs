// Screenshots of the built site for review: node scripts/shots.mjs [out-dir] [path...]
// Serves dist/ itself, so run `npm run build` first. Needs a Chromium (CHROMIUM or /usr/bin/chromium).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const [out = 'shots', ...paths] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(join('dist', p))); }
  catch { res.writeHead(404); res.end(); }
}).listen(4399);
await mkdir(out, { recursive: true });
const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM ?? '/usr/bin/chromium', args: ['--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const targets = paths.length ? paths : ['/', '/ru/', '/de/'];
for (const width of [1440, 360]) {
  for (const path of targets) {
    // A fresh browser per page: a full-page shot resizes the canvas, and a GPU reset there blocks WebGL for the next pages.
    const browser = await launch();
    const page = await browser.newPage({ viewport: { width, height: width > 400 ? 900 : 760 } });
    page.on('console', (m) => m.type() === 'error' && console.log('console:', m.text()));
    page.on('pageerror', (e) => console.log('pageerror:', e.message));
    await page.goto(`http://localhost:4399${path}`);
    await page.waitForTimeout(2500);
    const name = `${width}${path.replace(/\//g, '_')}`;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 0) console.log(`${name}: horizontal overflow ${overflow}px`);
    const sections = await page.$$eval('[data-biome]', (els) => els.map((e) => e.id || e.dataset.biome));
    const webgl = await page.evaluate(() => document.documentElement.className);
    console.log(name, webgl, sections.length);
    if (sections.length > 1) {
      for (const id of sections) {
        await page.evaluate((id) => (document.getElementById(id) ?? document.querySelector(`[data-biome="${id}"]`)).scrollIntoView({ behavior: 'instant' }), id);
        await page.waitForTimeout(1600);
        await page.screenshot({ path: `${out}/${name}${id}.png` });
      }
    } else await page.screenshot({ path: `${out}/${name}.png`, fullPage: !process.env.VIEW });
    await browser.close();
  }
}
server.close();
