/* ==========================================================================
   Flowmint — api/server.js
   Product build (repair pass) · 2026-10-17
   --------------------------------------------------------------------------
   Zero-dependency Node HTTP server for the Flowmint marketing site.

   - Serves the static site from ../source/
   - POST /api/forms  → real lead-capture endpoint (signup, signin,
     contact, newsletter, waitlist, request-integration)
   - GET  /api/health → {"ok":true}

   Storage is an append-only JSONL store under api/data/ whose record
   layout mirrors db/schema.sql (tables form_submissions + consents).
   On a PostgreSQL deployment, run db/migrations/001..006 and point this
   API at the database; the JSONL store is the zero-dependency fallback.

   No npm packages. Node >= 18.
   ========================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', 'source');
const DATA_DIR = path.resolve(__dirname, 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'form_submissions.jsonl');
const CONSENTS_FILE = path.join(DATA_DIR, 'consents.jsonl');
const SECRET_FILE = path.join(DATA_DIR, '.hmac-secret');

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 32 * 1024; // 32 KB
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 30;

fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------------------------------------------------------------
   HMAC secret for ip_hash (schema.sql: HMAC-SHA256 of client IP,
   enough for abuse-rate math, no raw PII stored).
--------------------------------------------------------------- */
let hmacSecret;
try {
  hmacSecret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
  if (!hmacSecret) throw new Error('empty');
} catch (err) {
  hmacSecret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_FILE, hmacSecret + '\n', { mode: 0o600 });
}
function ipHash(ip) {
  return crypto.createHmac('sha256', hmacSecret).update(String(ip || '')).digest('hex');
}

/* ---------------------------------------------------------------
   Per-form allowlists + validation. Unknown fields are rejected.
   Passwords are NEVER accepted or stored: this demo build has no
   account system, so the auth modal collects name/email only.
--------------------------------------------------------------- */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const TOPICS = ['sales', 'support', 'security', 'press', 'other'];

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
    },
    consentPurpose: 'newsletter'
  },
  waitlist: {
    fields: {
      email: { required: true, email: true, max: 254 }
    },
    consentPurpose: 'newsletter'
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
  // Reject anything outside the allowlist (bots stuffing extra fields).
  for (const k of Object.keys(body)) {
    if (!(k in spec.fields)) return { ok: false, error: `Unexpected field: ${k}.` };
  }
  return { ok: true, payload, email };
}

/* ---------------------------------------------------------------
   Append-only store (mirrors db/schema.sql form_submissions/consents)
--------------------------------------------------------------- */
function appendJsonl(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n', { mode: 0o600 });
}

/* ---------------------------------------------------------------
   Rate limiting: in-memory, per ip_hash
--------------------------------------------------------------- */
const hits = new Map(); // ipHash -> [timestamps]
function rateLimited(key) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > RATE_MAX;
}

/* ---------------------------------------------------------------
   Static file serving
--------------------------------------------------------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2'
};

function safePath(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  if (p.includes('\0')) return null;
  const resolved = path.normalize(path.join(ROOT, p));
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function serveStatic(req, res, urlPath) {
  let file = safePath(urlPath);
  if (!file) return send(res, 400, 'Bad request', 'text/plain; charset=utf-8');
  try {
    const stat = fs.statSync(file);
    if (stat.isDirectory()) file = path.join(file, 'index.html');
  } catch (err) {
    // Extensionless detail-style paths are all real directories here;
    // fall through to 404.
  }
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    const ext = path.extname(file).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream', {
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
  });
}

function send(res, status, body, contentType, extraHeaders) {
  const headers = {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    ...extraHeaders
  };
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), 'application/json; charset=utf-8', {
    'Cache-Control': 'no-store'
  });
}

/* ---------------------------------------------------------------
   API handlers
--------------------------------------------------------------- */
function handleForms(req, res) {
  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) {
      json(res, 413, { ok: false, error: 'Payload too large.' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (err) {
      return json(res, 400, { ok: false, error: 'Invalid JSON.' });
    }
    const form = typeof body.form === 'string' ? body.form : '';
    const check = validateSubmission(form, body.payload || body);
    if (!check.ok) return json(res, 422, { ok: false, error: check.error });

    const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
      req.socket.remoteAddress || '';
    const key = ipHash(ip);
    if (rateLimited(key)) {
      return json(res, 429, { ok: false, error: 'Too many requests. Please try again later.' });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const consentMarketing = Boolean(FORMS[form].consentPurpose);
    const ua = String(req.headers['user-agent'] || '').slice(0, 512);

    appendJsonl(SUBMISSIONS_FILE, {
      id,
      form,
      payload: check.payload,
      email: check.email,
      consent_marketing: consentMarketing,
      ip_hash: key,
      user_agent: ua,
      created_at: now
    });

    if (FORMS[form].consentPurpose && check.email) {
      appendJsonl(CONSENTS_FILE, {
        id: crypto.randomUUID(),
        email: check.email,
        purpose: FORMS[form].consentPurpose,
        granted: true,
        source_form: id,
        created_at: now
      });
    }

    return json(res, 200, { ok: true, id });
  });
}

/* ---------------------------------------------------------------
   Router
--------------------------------------------------------------- */
const server = http.createServer((req, res) => {
  const urlPath = req.url || '/';
  if (req.method === 'GET' && (urlPath === '/api/health' || urlPath === '/api/health/')) {
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && (urlPath === '/api/forms' || urlPath === '/api/forms/')) {
    return handleForms(req, res);
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res, urlPath);
  }
  return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
});

server.listen(PORT, () => {
  console.log(`[flowmint] serving ${ROOT} on http://localhost:${PORT}`);
  console.log('[flowmint] lead-capture API: POST /api/forms (forms: ' +
    Object.keys(FORMS).join(', ') + ')');
});
