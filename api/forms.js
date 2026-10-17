/* ==========================================================================
   Flowmint — api/forms.js (Vercel Serverless Function)
   --------------------------------------------------------------------------
   POST /api/forms → validates the lead-capture payload with the exact same
   rules as api/server.js, then stores each submission as one private JSON
   blob in the connected Vercel Blob store (env BLOB_READ_WRITE_TOKEN).

   Zero npm dependencies. Talks to the Blob REST API with global fetch.
   One blob per submission: no read-modify-write races, one advanced op
   each — comfortably inside the Hobby free tier.

   Response contract (matches js/main.js):
     200 {ok:true, id}      → success state
     422 {error}            → validation failure (nothing saved)
     429 {error}            → (reserved; Vercel firewall handles abuse)
     503 {error}            → storage not connected yet (nothing saved)
     502 {error}            → blob write failed (nothing saved)
   ========================================================================== */
'use strict';

const crypto = require('crypto');

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const TOPICS = ['sales', 'support', 'security', 'press', 'other'];
const MAX_BODY_BYTES = 32 * 1024;

/* Same allowlists as api/server.js. Passwords are never accepted: this
   demo build has no account system, the auth modal collects name/email. */
const FORMS = {
  signup: {
    fields: {
      name: { required: true, max: 120 },
      email: { required: true, email: true, max: 254 }
    }
  },
  signin: {
    fields: {
      email: { required: true, email: true, max: 254 }
    }
  },
  contact: {
    fields: {
      topic: { required: false, max: 24, allow: TOPICS },
      name: { required: true, max: 120 },
      email: { required: true, email: true, max: 254 },
      company: { required: false, max: 160 },
      message: { required: true, max: 5000 }
    }
  },
  newsletter: {
    fields: {
      email: { required: true, email: true, max: 254 }
    }
  },
  waitlist: {
    fields: {
      email: { required: true, email: true, max: 254 }
    }
  },
  'request-integration': {
    fields: {
      name: { required: true, max: 120 },
      email: { required: true, email: true, max: 254 },
      integration: { required: true, max: 120 },
      notes: { required: false, max: 1000 }
    }
  }
};

function cleanString(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim().replace(/[\u0000-\u001F\u007F]/g, '');
  return s.length <= max ? s : null;
}

function validateSubmission(form, body) {
  const spec = FORMS[form];
  if (!spec) return { ok: false, error: 'Unknown form.' };
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Invalid payload.' };
  }
  const payload = {};
  let email = null;
  for (const [field, rule] of Object.entries(spec.fields)) {
    const raw = body[field];
    if (raw === undefined || raw === null || raw === '') {
      if (rule.required) return { ok: false, error: `Missing required field: ${field}.` };
      continue;
    }
    const s = cleanString(raw, rule.max || 500);
    if (s === null) return { ok: false, error: `Invalid value for ${field}.` };
    if (rule.email && !EMAIL_RE.test(s)) return { ok: false, error: 'Enter a valid email address.' };
    if (rule.allow && !rule.allow.includes(s)) return { ok: false, error: `Invalid value for ${field}.` };
    payload[field] = s;
    if (field === 'email') email = s.toLowerCase();
  }
  for (const k of Object.keys(body)) {
    if (!(k in spec.fields)) return { ok: false, error: `Unexpected field: ${k}.` };
  }
  return { ok: true, payload, email };
}

async function putBlob(pathname, json, token) {
  const res = await fetch(`https://blob.vercel-storage.com/${pathname}`, {
    method: 'PUT',
    headers: {
      'authorization': `Bearer ${token}`,
      'x-api-version': '7',
      'x-content-type': 'application/json',
      'x-add-random-suffix': '0',
      'access': 'private'
    },
    body: json
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`blob put ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    res.status(503).json({ error: 'Form storage is not connected yet. Please try again later.' });
    return;
  }

  let data = req.body;
  if (typeof data === 'string') {
    if (Buffer.byteLength(data, 'utf8') > MAX_BODY_BYTES) {
      res.status(413).json({ error: 'Payload too large.' });
      return;
    }
    try {
      data = JSON.parse(data);
    } catch {
      res.status(400).json({ error: 'Invalid JSON.' });
      return;
    }
  }

  const form = data && data.form;
  const payload = data && data.payload;
  const v = validateSubmission(form, payload);
  if (!v.ok) {
    res.status(422).json({ error: v.error });
    return;
  }

  const id = crypto.randomUUID();
  const record = {
    id,
    form,
    ...v.payload,
    created_at: new Date().toISOString()
  };
  const pathname = `forms/${form}/${Date.now()}-${id}.json`;

  try {
    await putBlob(pathname, JSON.stringify(record), token);
  } catch (err) {
    console.error('forms: blob write failed:', err.message);
    res.status(502).json({ error: 'We could not save your submission just now. Please try again.' });
    return;
  }

  res.status(200).json({ ok: true, id });
};
