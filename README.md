# THATHA — demo website

A concept build of the THATHA website: **7 static pages, no framework, no build step.**
Same infrastructure pattern as the Africrest pitch demo — flat HTML, one stylesheet,
one small progressive-enhancement script, deployed to Vercel.

```
index.html          Home — hero, range, value strip, applications, targets, how-it-works
products.html       Basic / Plus / Pro / Government + comparison table + accessories
applications.html   8 trades, and why modularity is the point
government.html     Municipal, NGO and corporate ESD programmes + procurement FAQ
investors.html      Thesis, revenue model, honest status, risks
about.html          Mission, the name, the mark, palette, credits
contact.html        Enquiry form, direct contact, FAQ
styles.css          The whole design system (~26KB, hand-rolled)
site.js             Mobile nav + form handling (~3KB, no dependencies)
assets/             Logos, product renders, application imagery (200KB total)
```

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8765
# http://127.0.0.1:8765/
```

---

## Design system

Built on the **official brand palette** from *Thatha Brand Identity Presentation V2*:

| Colour | Hex | Used for |
|---|---|---|
| Dark Teal | `#083E41` | Nav, dark bands, body text |
| Verdigris | `#46A595` | Accents, icons, target band |
| Spicy Orange | `#D45113` | Primary CTAs, eyebrows |
| Apricot Cream | `#F9C784` | Soft backgrounds, on-dark headings |

All tokens live in `:root` at the top of `styles.css`. Breakpoints: **1080 / 980 / 640**.

---

## Three substitutions you should know about

### 1. Type — Benton Sans is not on this site

The identity specifies **Benton Sans** (Bold + Regular). It is a licensed Font Bureau
typeface and cannot legally be embedded as a webfont, so the site renders in:

- **Archivo** — heavy uppercase display, standing in for Benton Sans Black
- **Public Sans** — body text, standing in for Benton Sans Regular

These were not picked for looks alone. Benton Sans is Morris Fuller Benton's *News
Gothic* revival; Public Sans descends from Libre Franklin → **Franklin Gothic**, Benton's
sibling typeface from the same period. The skeletons genuinely match.

**For production:** licence Benton Sans as a webfont and swap the two `font-family`
stacks in `styles.css`. Nothing else needs to change.

### 2. Logo — the wordmark is a raster, deliberately

The supplied logo SVGs use live `<text>` elements referencing `BentonSans-Black`
**rather than outlined paths**. On the web that renders in whatever fallback font the
visitor happens to have — the wordmark would silently look wrong for everyone.

So the site uses:

- `assets/logo/lockup-white.webp` — the *Secondary* lockup (mark + wordmark), rasterised
  from the supplied PNG, so the letterforms are correct
- `assets/logo/mark.svg` — the *Logo Mark*, which **is** pure vector
  (`<polygon>` + `<circle>`). Rebuilt with the `™` `<text>` stripped and `currentColor`
  fill, so one file recolours via CSS instead of shipping six colourways
- `assets/favicon.svg` — mark on a Dark Teal tile, zero font dependency

**For production:** ask for the logo files with **type converted to outlines**. Then the
wordmark can be vector too.

### 3. ⚠️ The supplied Primary Logo contains a typo

The Primary Logo lockup reads:

> Take your trade **turther**.

`turther`, not `further`. It is present in the `<text>` of **all six** Primary Logo SVGs
and baked into **all six** exported PNGs — the same source produced every colourway.

**This site does not use the Primary Logo.** The tagline is set as real HTML text
instead, which fixes the spelling and renders crisper and selectable. But the brand pack
itself still needs correcting at source, and should be flagged before anything goes to a
printer or to the client as final.

---

## Imagery provenance

There is no THATHA product photography yet. Every product and application image on this
site was **extracted from the flat concept mockup** (`THATHA_Website_Concept.pdf`), which
is a single 1536×1024 bitmap with no text layer.

Crop coordinates were measured from the bitmap by column/row brightness profiling, not
estimated — the mockup is AI-generated and its tile grid is uneven (tile widths vary
140–160px), so an evenly-computed grid left white slivers on several tiles. See
`CONTENT-NOTES.md` for the measured geometry.

Consequences to be aware of:

- Sources are small: application tiles are ~146×100, product renders 200×128
- They are displayed at roughly **1.3–2×** native, so they are slightly soft. Acceptable
  in small cards; the hero (580px native, shown ~570px) is effectively 1:1
- `.split-media img` is deliberately capped at `max-width: 340px` to limit upscaling

**To swap in real renders later:** replace the files in `assets/products/` and
`assets/apps/` keeping the same filenames. No HTML or CSS changes needed — though you
should update the `width`/`height` attributes in the markup to the new intrinsic sizes so
the browser still reserves correct space.

---

## Content accuracy

This is a demo for a **pre-production** product, so the copy is written to keep targets
and facts apart:

- Every price is labelled **"Indicative from"** with a standing note that nothing is a
  quotation or an offer to sell
- The **R300** figure is labelled a *target manufacturing cost*, with the conditions
  attached (design finalisation, engineering validation, BOM costing, volume)
- The impact band reads **"Programme target"** / **"Addressable market"**, not achieved
  results. The concept mockup's original wording ("1000+ TRADERS EMPOWERED") would have
  stated unachieved numbers as fact
- `investors.html` carries an explicit *Honest status* section, a `0 units deployed`
  stat, and a **Risks** section naming the R300 cost target as the primary risk

Every page carries a demo banner, and `robots.txt` + `X-Robots-Tag: noindex` keep it out
of search results so it cannot compete with the real thatha.co.za.

---

## Known gaps

| Gap | Note |
|---|---|
| Contact form has no backend | Submitting packages the answers into a pre-filled `mailto:`, and says plainly that nothing was sent. Wire to a real endpoint for production. |
| Phone number is a placeholder | `site.js` and `contact.html` need a real number. |
| No brochure PDF | "Get the brochure" routes to the enquiry form. |
| `assets/logo/lockup-teal.webp` is unused | Kept for future light-background headers. |
| Benton Sans not licensed | See substitution 1 above. |

Pricing is **settled**: Basic R999 / Plus R1,499 / Pro R2,499 / Government on enquiry,
all labelled indicative. The earlier draft's Pro figure (R3,500–R5,000) is superseded.

---

## Testing

A Playwright harness drives every page at desktop (1440) and mobile (390):

```bash
npm install --no-save playwright && npx playwright install chromium
python -m http.server 8765          # in one terminal
node test/audit.mjs                 # in another
node test/shoot.mjs                 # component screenshots for review
node test/measure.mjs               # box/ratio measurements for key elements
```

`audit.mjs` checks the things that are invisible in source but obvious in a browser:

- console errors and failed requests
- horizontal page overflow, and any element wider than the viewport (excluding
  content inside a deliberate horizontal scroller, so the comparison tables
  don't register as false positives)
- images upscaled beyond 1.35× — i.e. why something looks soft or small
- **distorted images**, comparing rendered aspect ratio against intrinsic
- touch targets under 24px, applying WCAG 2.5.8's exemption for links inline in prose

Current state: **all 14 page/viewport combinations clean.** Screenshots land in
`test/shots/` and are gitignored (~34MB).

### Two bugs the harness caught that source review had missed

**1. Stretched footer logo.** `.foot-brand img` set `height` but not `width`, so
the `width="900"` attribute clamped by `max-width: 100%` broke the aspect ratio.

**2. `aspect-ratio` silently defeated by the width/height attributes.** An
`<img>`'s `width`/`height` attributes become CSS *presentational hints*, and
`aspect-ratio` only resolves the **missing** dimension. Once `height="824"`
supplied a definite height alongside `width: 100%`, `aspect-ratio` was ignored
and `object-fit: cover` cropped the image — the hero measured 554×824 (ratio
0.67) where 1.408 was intended. Fixed by `img { height: auto }` in the reset,
which is precisely why the canonical responsive-image rule is `width: 100%;
height: auto` and not `width` alone.

---

Deployment: see **[DEPLOY.md](DEPLOY.md)**.
Brand identity and site by **Phuture Digital**.
