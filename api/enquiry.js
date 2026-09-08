'use strict';

const MAX = {
  interest: 80,
  name: 120,
  organisation: 160,
  email: 254,
  phone: 50,
  province: 80,
  units: 50,
  message: 4000
};

function text(value, max) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body !== 'string') return {};

  try {
    return JSON.parse(req.body);
  } catch (error) {
    return Object.fromEntries(new URLSearchParams(req.body));
  }
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && !/[\r\n]/.test(value);
}

function sameOrigin(req) {
  const headers = req.headers || {};
  const origin = headers.origin;
  const host = headers['x-forwarded-host'] || headers.host;
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === String(host).split(',')[0].trim();
  } catch (error) {
    return false;
  }
}

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

module.exports = async function enquiry(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(res, 405, { error: 'Method not allowed.' });
  }

  if (!sameOrigin(req)) return reply(res, 403, { error: 'Cross-site submission blocked.' });

  const body = getBody(req);

  // A filled honeypot is treated as success so automated senders do not retry.
  if (text(body.website, 200)) return reply(res, 200, { ok: true });

  const enquiry = {};
  Object.keys(MAX).forEach((key) => {
    enquiry[key] = text(body[key], MAX[key]);
  });

  const consent = body.consent === true || body.consent === 'on' || body.consent === 'true';
  if (!enquiry.name || !validEmail(enquiry.email) || !enquiry.interest || !consent) {
    return reply(res, 400, { error: 'Please complete the required fields.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ENQUIRY_FROM_EMAIL;
  const recipients = text(process.env.ENQUIRY_TO_EMAIL, 1000)
    .split(',')
    .map((address) => address.trim())
    .filter(Boolean);

  if (!apiKey || !from || recipients.length === 0) {
    return reply(res, 503, { error: 'The enquiry service is not configured.' });
  }

  const labels = {
    interest: 'Interest',
    name: 'Name',
    organisation: 'Organisation',
    email: 'Email',
    phone: 'Phone',
    province: 'Province',
    units: 'Units needed',
    message: 'Message'
  };
  const message = Object.keys(labels)
    .filter((key) => enquiry[key])
    .map((key) => `${labels[key]}: ${enquiry[key]}`)
    .join('\n\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: enquiry.email,
        subject: `THATHA enquiry — ${enquiry.interest}`,
        text: message
      })
    });

    if (!response.ok) {
      console.error('Enquiry delivery failed with status', response.status);
      return reply(res, 502, { error: 'The enquiry could not be delivered.' });
    }

    return reply(res, 200, { ok: true });
  } catch (error) {
    console.error('Enquiry delivery request failed');
    return reply(res, 502, { error: 'The enquiry could not be delivered.' });
  }
};
