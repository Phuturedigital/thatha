/* Targeted element screenshots — far more legible for review than a 12,000px
 * full-page capture. Shoots the specific components under scrutiny. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const OUT = 'test/shots';
mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { page: 'index', sel: 'footer.site', name: 'footer', vp: 'desktop' },
  { page: 'index', sel: 'footer.site', name: 'footer', vp: 'mobile' },
  { page: 'index', sel: '.hero', name: 'hero', vp: 'desktop' },
  { page: 'index', sel: '.hero', name: 'hero', vp: 'mobile' },
  { page: 'index', sel: '.prod-grid', name: 'products', vp: 'desktop' },
  { page: 'index', sel: '.app-grid', name: 'apps', vp: 'desktop' },
  { page: 'index', sel: '.value-strip', name: 'valuestrip', vp: 'desktop' },
  { page: 'index', sel: '.stat-band', name: 'statband', vp: 'desktop' },
  { page: 'products', sel: '.split', name: 'split', vp: 'desktop' },
  { page: 'applications', sel: '.grid-2, .grid-3', name: 'appcards', vp: 'desktop' },
  { page: 'index', sel: '.prod-grid', name: 'products', vp: 'mobile' },
  { page: 'contact', sel: '.form-card', name: 'form', vp: 'mobile' },
];

const VP = {
  desktop: { width: 1440, height: 900, dsf: 2 },
  mobile: { width: 390, height: 844, dsf: 3, mobile: true },
};

const browser = await chromium.launch();
for (const s of SHOTS) {
  const v = VP[s.vp];
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: v.dsf, isMobile: !!v.mobile, hasTouch: !!v.mobile,
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/${s.page}.html`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const el = page.locator(s.sel).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const file = `${OUT}/z-${s.name}-${s.vp}.png`;
  await el.screenshot({ path: file });
  const box = await el.boundingBox();
  console.log(`${file}  ${Math.round(box.width)}x${Math.round(box.height)}`);
  await ctx.close();
}
await browser.close();
