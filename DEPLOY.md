# Deploying THATHA

The repository is configured for Vercel as a static site with one Node.js
Function. `vercel.json` supplies clean URLs, cache rules and security headers.

## 1. Import or update the Vercel project

Connect the `Phuturedigital/thatha` repository and use these settings:

- Framework preset: Other
- Root directory: repository root
- Build command: none
- Output directory: none
- Install command: none

Vercel automatically serves files from the root and deploys `api/enquiry.js` as
the `/api/enquiry` function.

## 2. Configure enquiry email

Create or select the client's Resend account and verify a sending domain. Add
the following encrypted environment variables for Preview and Production:

```text
RESEND_API_KEY=re_...
ENQUIRY_FROM_EMAIL=THATHA Website <website@verified-sending-domain>
ENQUIRY_TO_EMAIL=client-recipient@example.co.za
```

Multiple recipients can be comma-separated. Redeploy after changing variables,
then send one test for each major enquiry type. Confirm both delivery and the
Reply-To address before launch.

## 3. Approve content before mapping the domain

Complete `LAUNCH-CHECKLIST.md`. In particular, confirm:

- official company, email, telephone and location details;
- whether `thatha.co.za` is the launch domain;
- product availability, manufacturing status, prices and specifications;
- approved photography, brochure and investor materials;
- privacy notice and any analytics or advertising requirements.

The repository no longer blocks search indexing. Keep the production domain
disconnected until the content is approved; Vercel preview deployments should
remain protected or shared only with reviewers.

## 4. Map the production domain

Add the confirmed apex domain and `www` hostname in Vercel, then apply the DNS
records Vercel provides at the client's DNS host. Choose one hostname as the
primary and redirect the other to it.

After DNS and TLS are active:

1. add canonical URLs and an XML sitemap using the confirmed primary hostname;
2. update Open Graph image URLs to absolute production URLs;
3. submit the sitemap in Google Search Console and Bing Webmaster Tools;
4. test the contact form on the production hostname;
5. verify the CSP, cache, robots and redirect headers;
6. run the full desktop/mobile audit one final time.

## 5. Rollback

Vercel retains previous deployments. If a production check fails, promote the
last known-good deployment while the issue is corrected on a branch. Never put
credentials in Git history during a rollback or hotfix.
