import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
const r = await p.evaluate(() => {
  const out = {};
  const m = (label, sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const b = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out[label] = { w: Math.round(b.width), h: Math.round(b.height), ratio: +(b.width / b.height).toFixed(3),
                   aspectRatio: cs.aspectRatio, objectFit: cs.objectFit, height: cs.height };
    if (el.tagName === 'IMG') { out[label].natural = el.naturalWidth + 'x' + el.naturalHeight; }
  };
  m('hero-grid', '.hero-grid');
  m('hero-media(figure)', '.hero-media');
  m('hero-media img', '.hero-media img');
  m('hero left col', '.hero-grid > div');
  m('prod-media img', '.prod-media img');
  m('app-tile img', '.app-tile img');
  m('foot logo', '.foot-brand img');
  m('nav logo', '.nav-logo img');
  return out;
});
console.log(JSON.stringify(r, null, 2));
await b.close();
