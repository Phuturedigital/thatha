# THATHA website

The standalone THATHA marketing website: seven static pages, one stylesheet,
one progressive-enhancement script and one Vercel Function for enquiries.
There is no front-end framework or build step.

## Site map

| File | Purpose |
|---|---|
| `index.html` | Home, product range, applications and institutional offer |
| `products.html` | Basic, Plus, Pro and Government units |
| `applications.html` | Trade-specific use cases |
| `government.html` | Municipal, NGO and enterprise programmes |
| `investors.html` | Investment thesis, model, status and risks |
| `about.html` | Mission, values, product principles and brand story |
| `contact.html` | Enquiry form, direct contact and FAQs |
| `api/enquiry.js` | Validates and delivers enquiries through Resend |
| `styles.css` | Responsive design system |
| `site.js` | Mobile navigation and in-page form submission |

## Run locally

Serve the repository root so page links and assets resolve correctly:

```bash
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/`. The static pages work locally. The enquiry
endpoint runs only in Vercel or a compatible local functions environment.

## Enquiry delivery

The form posts to `/api/enquiry`. Configure these variables in Vercel for
Preview and Production:

| Variable | Example | Purpose |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Resend API credential |
| `ENQUIRY_FROM_EMAIL` | `THATHA Website <website@updates.example.co.za>` | Verified sender |
| `ENQUIRY_TO_EMAIL` | `hello@example.co.za` | Recipient; comma-separate more than one |

The endpoint validates required fields, limits input length, uses plain-text
email, includes a honeypot for basic bot filtering and does not log personal
details. If delivery is unavailable, the browser offers a pre-filled email as
an honest fallback.

Do not commit API keys or client credentials.

## Design system

The interface uses the THATHA brand palette:

| Colour | Hex | Role |
|---|---|---|
| Dark Teal | `#083E41` | Navigation, dark bands and primary text |
| Verdigris | `#46A595` | Supporting accents and product language |
| Spicy Orange | `#D45113` | Primary actions |
| Apricot Cream | `#F9C784` | Warm contrast on dark surfaces |

The site currently uses Archivo for display type and Public Sans for body copy.
Both are web-safe substitutes for the licensed Benton Sans family specified by
the identity. Replace them only when licensed webfont files are supplied.

## Content status

The website itself is a production property, not a concept preview. Product
manufacturing status, pricing and deployment claims are still deliberately
qualified until the client confirms current facts. See `LAUNCH-CHECKLIST.md`
before connecting the final domain.

## Testing

The Playwright audit covers all seven pages at desktop and mobile widths:

```bash
npx --yes html-validate index.html products.html applications.html government.html investors.html about.html contact.html
npm install --no-save playwright
npx playwright install chromium
python -m http.server 8765
node test/audit.mjs
node test/interaction.mjs
```

The audit checks console and request errors, horizontal overflow, image scaling
and distortion, and undersized touch targets. `test/shoot.mjs` captures review
screenshots and `test/measure.mjs` reports key layout measurements.

Deployment and launch instructions are in `DEPLOY.md`.

Brand and website by Phuture Digital.
