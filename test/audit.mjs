/* Playwright audit for the THATHA site.
 *
 * Checks the things that are invisible in source but obvious in a browser:
 *   - console errors and failed network requests
 *   - horizontal page overflow (the classic mobile bug)
 *   - individual elements wider than the viewport, named so they're fixable
 *   - images being upscaled past a threshold (why something "looks small/soft")
 *   - distorted images (rendered aspect ratio vs intrinsic) — catches the
 *     stretched-logo class of bug directly
 *   - tap-target sizes on mobile
 *
 * Usage: node test/audit.mjs [baseUrl]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const PAGES = ['index', 'products', 'applications', 'government', 'investors', 'about', 'contact'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dsf: 2 },
  { name: 'mobile', width: 390, height: 844, dsf: 3, mobile: true },
];

const OUT = 'test/shots';
mkdirSync(OUT, { recursive: true });

const problems = [];
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dsf,
    isMobile: !!vp.mobile,
    hasTouch: !!vp.mobile,
  });

  for (const slug of PAGES) {
    const page = await ctx.newPage();
    const consoleErrors = [];
    const failed = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));
    page.on('requestfailed', r => failed.push(`${r.url()} — ${r.failure()?.errorText}`));

    await page.goto(`${BASE}/${slug}.html`, { waitUntil: 'load' });
    // Fonts and lazy images settle before we measure or shoot.
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      await new Promise(r => {
        let y = 0;
        const step = () => {
          y += window.innerHeight;
          window.scrollTo(0, y);
          if (y < document.body.scrollHeight) setTimeout(step, 30); else { window.scrollTo(0, 0); r(); }
        };
        step();
      });
    });
    await page.waitForTimeout(350);

    const report = await page.evaluate(() => {
      const vw = window.innerWidth;
      const doc = document.documentElement;
      const out = {
        vw,
        scrollWidth: Math.max(doc.scrollWidth, document.body.scrollWidth),
        overflowing: [],
        upscaled: [],
        distorted: [],
        smallTaps: [],
      };

      const describe = el => {
        const cls = (el.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        return el.tagName.toLowerCase() + (cls ? '.' + cls : '') + (el.id ? '#' + el.id : '');
      };

      // An element wider than the viewport is only a bug if it actually pushes
      // the page sideways. Content inside a deliberate horizontal scroller
      // (the comparison tables) is working as designed, so exclude it.
      const inScroller = el => {
        let p = el.parentElement;
        while (p && p !== document.body) {
          const ox = getComputedStyle(p).overflowX;
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') return true;
          p = p.parentElement;
        }
        return false;
      };

      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // right edge past the viewport by more than a rounding margin
        if (r.right > vw + 1.5 && getComputedStyle(el).position !== 'fixed' && !inScroller(el)) {
          out.overflowing.push({ el: describe(el), right: Math.round(r.right), width: Math.round(r.width) });
        }
      }

      for (const img of document.querySelectorAll('img')) {
        const r = img.getBoundingClientRect();
        if (!img.naturalWidth || r.width === 0) continue;
        const factor = r.width / img.naturalWidth;
        if (factor > 1.35) {
          out.upscaled.push({
            src: img.getAttribute('src'), shown: Math.round(r.width),
            natural: img.naturalWidth, factor: +factor.toFixed(2),
          });
        }
        const fit = getComputedStyle(img).objectFit;
        if (fit === 'fill' || fit === 'none' || fit === '') {
          const shownRatio = r.width / r.height;
          const trueRatio = img.naturalWidth / img.naturalHeight;
          const skew = Math.abs(shownRatio - trueRatio) / trueRatio;
          if (skew > 0.04) {
            out.distorted.push({
              src: img.getAttribute('src'), shownRatio: +shownRatio.toFixed(3),
              trueRatio: +trueRatio.toFixed(3), skewPct: Math.round(skew * 100),
            });
          }
        }
      }

      if (window.innerWidth < 500) {
        // WCAG 2.5.8 exempts links sitting inline within a sentence — enlarging
        // them would wreck the text flow. Flag those separately as advisory.
        const isInlineInProse = el => {
          if (getComputedStyle(el).display !== 'inline') return false;
          const parent = el.parentElement;
          if (!parent) return false;
          const own = (el.textContent || '').trim().length;
          const all = (parent.textContent || '').trim().length;
          return all > own + 12;   // meaningfully more prose around the link
        };
        for (const t of document.querySelectorAll('a, button, select, input, summary')) {
          const r = t.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.height >= 24) continue;                 // clears WCAG 2.5.8 AA
          if (t.tagName === 'A' && isInlineInProse(t)) continue;
          out.smallTaps.push({ el: describe(t), h: Math.round(r.height), text: (t.textContent || '').trim().slice(0, 28) });
        }
      }
      return out;
    });

    const hOverflow = report.scrollWidth > report.vw + 1;
    const tag = `${slug}-${vp.name}`;
    await page.screenshot({ path: `${OUT}/${tag}.png`, fullPage: true });

    const issues = [];
    if (consoleErrors.length) issues.push(`console errors: ${JSON.stringify(consoleErrors.slice(0, 3))}`);
    if (failed.length) issues.push(`failed requests: ${JSON.stringify(failed.slice(0, 3))}`);
    if (hOverflow) issues.push(`H-SCROLL scrollWidth=${report.scrollWidth} vw=${report.vw}`);
    if (report.overflowing.length) issues.push(`overflowing(${report.overflowing.length}): ${JSON.stringify(report.overflowing.slice(0, 4))}`);
    if (report.distorted.length) issues.push(`DISTORTED: ${JSON.stringify(report.distorted)}`);
    if (report.upscaled.length) issues.push(`upscaled(${report.upscaled.length}): ${JSON.stringify(report.upscaled.slice(0, 6))}`);
    if (report.smallTaps.length) issues.push(`small taps(${report.smallTaps.length}): ${JSON.stringify(report.smallTaps.slice(0, 4))}`);

    console.log(`\n=== ${tag} ===`);
    if (issues.length) issues.forEach(i => console.log('  ! ' + i));
    else console.log('  clean');
    if (issues.length) problems.push({ tag, issues });

    await page.close();
  }
  await ctx.close();
}

await browser.close();
console.log(`\n================ ${problems.length ? problems.length + ' page/viewport combos with findings' : 'ALL CLEAN'} ================`);
