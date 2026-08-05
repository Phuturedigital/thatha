# Deploy the THATHA demo

Zero-build static site — no `package.json`, no framework, nothing to compile. Vercel
serves the files as-is, so a deploy takes about ten seconds and there is no build step
that can fail the day before a meeting.

## Option A — Vercel CLI (fastest)

```bash
# 1. Install the CLI once
npm install -g vercel

# 2. From this folder
cd thatha

# 3. Log in (opens a browser)
vercel login

# 4. Deploy a preview
vercel

#    Set up and deploy?              -> Y
#    Which scope?                    -> your account
#    Link to existing project?       -> N
#    Project name?                   -> thatha-demo
#    In which directory is your code -> ./
#    Override settings?              -> N

# 5. Promote to the production URL
vercel --prod
```

The URL printed at the end is the link you share.

## Option B — Vercel dashboard, no CLI

1. Push this folder to GitHub (already done: `Phuturedigital/thatha`)
2. Go to <https://vercel.com/new>
3. Import the `thatha` repo
4. **Framework preset: Other.** Leave build command and output directory **empty** —
   there is no build
5. Deploy

Vercel will redeploy automatically on every push to the default branch.

## Option C — drag and drop

Zip this folder, drop it on <https://vercel.com/new>. Fine for a one-off share, but you
lose the git-push-to-redeploy loop.

## Custom subdomain

1. Vercel project → **Settings → Domains**
2. Add e.g. `demo.thatha.co.za`
3. Vercel shows a CNAME (usually `cname.vercel-dns.com`) — add it at your DNS provider
4. Allow 1–5 minutes, occasionally up to an hour

## What `vercel.json` configures

- **Clean URLs** — `/products` instead of `/products.html`. Internal links still use
  `.html` so the site also works when opened locally; Vercel redirects them.
- **`X-Robots-Tag: noindex, nofollow`** — the demo will not be indexed, so it cannot
  compete with the real thatha.co.za or be found by a client's customers. Combined with
  `robots.txt`. Note the URL is *unlisted*, not private — anyone with the link can open
  it.
- **Security headers** — `nosniff`, `SAMEORIGIN`, `Referrer-Policy`,
  `Permissions-Policy`. Clean result in any header checker.
- **Cache headers** — a week on `/assets/*`, an hour on CSS/JS.

`.vercelignore` keeps `README.md` and `DEPLOY.md` in git but off the public URL.

## Pre-share checklist

- [ ] Open all 7 pages, click every nav item and footer link — nothing should 404
- [ ] Check the homepage on a phone: nav collapses to the hamburger, hero stacks,
      product grid goes to one column
- [ ] Submit the contact form — confirm it says plainly that nothing was sent and offers
      the pre-filled email
- [ ] Replace the placeholder phone number in `contact.html` and `site.js`
- [ ] Confirm the pricing ladder is the one you want (see README "Known gaps")
- [ ] Hit the URL from a private window so nothing is served from your cache

## If something breaks

- **Images missing in production but fine locally** — almost always letter case. Windows
  is case-insensitive, Vercel's Linux filesystem is not. Run
  `python ../verify_site.py` (see README) or check that every `src` matches the on-disk
  filename exactly.
- **Fonts look wrong** — Archivo and Public Sans load from Google Fonts. If the network
  blocks it, the stack falls back to `system-ui`, which changes the look but breaks
  nothing.
- **A page 404s** — with `cleanUrls` the canonical path has no `.html`. Both work;
  `.html` redirects.
- **Domain not resolving** — DNS propagation. Give it an hour before debugging.
