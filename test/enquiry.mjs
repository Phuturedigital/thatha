import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const enquiry = require('../api/enquiry.js');

async function call({ method = 'POST', body = {}, headers = {}, env = {}, fetchImpl } = {}) {
  const previous = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ENQUIRY_FROM_EMAIL: process.env.ENQUIRY_FROM_EMAIL,
    ENQUIRY_TO_EMAIL: process.env.ENQUIRY_TO_EMAIL,
    fetch: global.fetch
  };

  Object.assign(process.env, env);
  if (fetchImpl) global.fetch = fetchImpl;

  const response = { statusCode: 200, headers: {}, body: null };
  const res = {
    setHeader(name, value) { response.headers[name] = value; },
    status(code) { response.statusCode = code; return this; },
    json(value) { response.body = value; return value; }
  };

  try {
    await enquiry({ method, body, headers }, res);
    return response;
  } finally {
    for (const key of ['RESEND_API_KEY', 'ENQUIRY_FROM_EMAIL', 'ENQUIRY_TO_EMAIL']) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
    global.fetch = previous.fetch;
  }
}

const valid = {
  interest: 'Programme',
  name: 'Test Person',
  organisation: 'Example Organisation',
  email: 'person@example.com',
  phone: '+27 10 000 0000',
  province: 'Gauteng',
  units: '11–100',
  message: 'Please send programme information.',
  consent: 'on'
};

assert.equal((await call({ method: 'GET' })).statusCode, 405);
assert.equal((await call({
  body: valid,
  headers: { origin: 'https://spam.example', host: 'www.thatha.example' }
})).statusCode, 403);
assert.equal((await call({ body: {} })).statusCode, 400);
assert.equal((await call({ body: { ...valid, website: 'spam.example' } })).statusCode, 200);
assert.equal((await call({ body: valid })).statusCode, 503);

let delivery;
const delivered = await call({
  body: valid,
  env: {
    RESEND_API_KEY: 're_test',
    ENQUIRY_FROM_EMAIL: 'THATHA Website <website@example.com>',
    ENQUIRY_TO_EMAIL: 'hello@example.com,team@example.com'
  },
  fetchImpl: async (url, options) => {
    delivery = { url, options, payload: JSON.parse(options.body) };
    return { ok: true, status: 200 };
  }
});

assert.equal(delivered.statusCode, 200);
assert.equal(delivery.url, 'https://api.resend.com/emails');
assert.equal(delivery.payload.reply_to, valid.email);
assert.deepEqual(delivery.payload.to, ['hello@example.com', 'team@example.com']);
assert.match(delivery.payload.text, /Message: Please send programme information\./);
assert.doesNotMatch(delivery.payload.text, /consent/i);

console.log('enquiry endpoint: all checks passed');
