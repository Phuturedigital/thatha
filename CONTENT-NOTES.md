# Content notes — asset provenance

Internal reference. Kept in git, excluded from the public deploy via `.vercelignore`.

## Source files

| Source | Location at build time |
|---|---|
| Concept mockup | `Downloads/THATHA_Website_Concept.pdf` |
| Brand pack | `Downloads/Thatha-.../Thatha/` (Primary, Secondary, Logo Mark × 6 colourways, PNG + SVG) |
| Brand book | `Thatha Brand Identity Design Presentation_V2.pdf` (10pp) |
| Earlier draft | `Downloads/index.html` (263-line single-page draft — content spine for this build) |
| Infra reference | `github.com/Phuturedigital/africrestresi-Pitch` |

## Extracting the mockup

`THATHA_Website_Concept.pdf` is one page containing a single image XObject —
1536×1024, DeviceRGB, 8bpc, `ASCII85Decode` + `FlateDecode`. The page has no text layer
beyond the title, so all copy in the mockup is pixels.

The decoded stream is a raw 4,718,592-byte RGB buffer (1536 × 1024 × 3).

## Measured geometry

Boundaries were found by profiling mean column/row brightness rather than eyeballing.
The mockup is AI-generated and its grids are **not** even — an evenly-spaced 8-up grid
left white slivers on tiles 2, 5 and 6.

### Application tiles — photo occupies `y 819–919`

A dark caption bar sits at `y 920–940` and is **deliberately excluded**; captions are set
as real HTML text (crisper, selectable, translatable).

| Tile | x range | width |
|---|---|---|
| coffee-drinks | 238–384 | 147 |
| fast-food | 395–554 | 160 |
| fruit-veg | 566–715 | 150 |
| cold-drinks | 726–873 | 148 |
| pizza | 886–1026 | 141 |
| eggs-snacks | 1036–1176 | 141 |
| retail-goods | 1187–1326 | 140 |
| events | 1336–1487 | 152 |

### Product renders — fixed 200×128 window, `y 502–630`

A fixed window keeps all four carts at **identical scale**; padding varies because the
carts themselves differ in width. Cart pixels end at `y 625`; product name text begins at
`y 630`.

| Product | x range | cart bbox within band |
|---|---|---|
| basic | 293–493 | x 333–454, y 515–625 |
| plus | 545–745 | x 583–709, y 508–625 |
| pro | 777–977 | x 820–939, y 507–625 |
| government | 1029–1229 | x 1051–1209, y 507–625 |

### Hero

`x 795–1375, y 80–492` → 580×412. Cropped tight on the trader and cart to exclude the
mockup's baked-in carousel dots (`x 725–775`) and "WATCH VIDEO" control (`x > 1400`).

## Output

WebP, quality 88. **101 KB for all 13 images** — the hero alone was 753 KB as PNG, since
PNG is a poor fit for photographic content.

## Palette discrepancy (resolved)

Three palettes were in play. Resolved in favour of the brand book, because the 36 supplied
logo files ship in exactly those colourways.

| Source | Greens used | Status |
|---|---|---|
| Brand book V2 + logo SVGs | Dark Teal `#083E41`, Verdigris `#46A595` | ✅ **canonical** |
| Concept mockup | lime green ~`#7CB342` | ❌ not in brand book; no matching logo colourway |
| `Downloads/index.html` draft | `#174c2c` / `#24683d` | ❌ third, unrelated green |

The mockup also uses an **uppercase** "THATHA" wordmark while the brand book's is
lowercase `thatha™` — the mockup appears to predate or ignore the brand pack.

## Open content decisions

1. **Pricing ladder.** This build uses the mockup's figures (Basic R999 / Plus R1,499 /
   Pro R2,499). The earlier draft had Basic R999–1,499, Plus R1,799–2,499, **Pro
   R3,500–5,000**. Pro differs by roughly 2×. Needs a call.
2. **Phone number** is a placeholder in `contact.html` and `site.js`.
3. **Brochure PDF** does not exist; "Get the brochure" routes to the enquiry form.
4. **Primary Logo typo** — "Take your trade *turther*." See README. Not used on this site,
   but needs fixing at source in the brand pack.
