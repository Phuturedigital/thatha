import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8765';
const browser = await chromium.launch();

try {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${BASE}/index.html`, { waitUntil: 'load' });
  const toggle = mobile.locator('.nav-toggle');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await mobile.locator('.nav-links a[href="products.html"]').click();
  await mobile.waitForURL('**/products.html');
  assert.equal(await mobile.locator('.nav-toggle').getAttribute('aria-expanded'), 'false');
  await mobile.close();

  const success = await browser.newPage();
  await success.route('**/api/enquiry', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true })
  }));
  await success.goto(`${BASE}/contact.html?interest=Programme`, { waitUntil: 'load' });
  assert.equal(await success.locator('#interest').inputValue(), 'Programme');
  await success.locator('[name="name"]').fill('Test Person');
  await success.locator('[name="email"]').fill('person@example.com');
  await success.locator('[name="consent"]').check();
  await success.locator('button[type="submit"]').click();
  await success.locator('#form-result').waitFor({ state: 'visible' });
  await assert.doesNotReject(async () => {
    await success.getByText('Enquiry sent.', { exact: true }).waitFor();
  });
  await success.close();

  const failure = await browser.newPage();
  await failure.route('**/api/enquiry', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Unavailable' })
  }));
  await failure.goto(`${BASE}/contact.html`, { waitUntil: 'load' });
  await failure.locator('[name="name"]').fill('Test Person');
  await failure.locator('[name="email"]').fill('person@example.com');
  await failure.locator('[name="consent"]').check();
  await failure.locator('button[type="submit"]').click();
  const fallback = failure.getByRole('link', { name: 'Email THATHA' });
  await fallback.waitFor();
  assert.match(await fallback.getAttribute('href'), /^mailto:hello@thatha\.co\.za/);
  await failure.close();

  console.log('browser interactions: all checks passed');
} finally {
  await browser.close();
}
