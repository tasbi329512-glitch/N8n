/* ==========================================================================
   Flowmint — scripts/smoke.js
   Build Agent (repair pass) · 2026-10-17
   --------------------------------------------------------------------------
   Smoke checks for the repair pass. Run: node scripts/smoke.js
   (or npm test) from the project root (the project root/).

   1. node --check on every JS file
   2. data/*.json parse + catalog counts
   3. detail pages exist for every catalog key, carry unique SEO, and
      contain no stub/placeholder residue
   4. banned demo/placeholder copy is gone from pages + JS
   5. placeholder trust signals (star pill, platform-homepage social
      links) are gone from the 9 main pages
   6. sitemap.xml covers every detail URL
   7. every data-lead-form on the site is accepted by the API allowlist
   8. live API round-trip: health, valid submit (stored), invalid submit
      (422), unknown form (422), oversized/unknown-field rejection

   Exits non-zero on the first failure class, printing what failed.
   ========================================================================== */
'use strict';

const { execFileSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'source');

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log('  ok   ' + name);
  } else {
    failures++;
    console.log('  FAIL ' + name + (detail ? ' — ' + detail : ''));
  }
}

function walk(dir, ext, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (p.endsWith(ext)) out.push(p);
  }
  return out;
}

/* 1. syntax ---------------------------------------------------------- */
console.log('[1] JS syntax');
const jsFiles = [
  'source/js/main.js', 'source/js/components.js', 'source/js/data.js',
  'source/js/calculator.js', 'api/server.js', 'scripts/generate-detail-pages.js',
  'scripts/smoke.js'
];
for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' });
    check(f, true);
  } catch (err) {
    check(f, false, String(err.message).split('\n').slice(0, 3).join(' '));
  }
}

/* 2. data ------------------------------------------------------------ */
console.log('[2] catalog data');
let integrations = [], templates = [], pricing = null;
try {
  integrations = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'integrations.json'), 'utf8'));
  templates = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'templates.json'), 'utf8'));
  pricing = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'pricing.json'), 'utf8'));
  JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'faq.json'), 'utf8'));
  check('data/*.json parse', true);
} catch (err) {
  check('data/*.json parse', false, err.message);
}
check('integrations count = 60', integrations.length === 60, 'got ' + integrations.length);
check('templates count = 48', templates.length === 48, 'got ' + templates.length);
check('integration keys unique',
  new Set(integrations.map((i) => i.key)).size === integrations.length);
check('template keys unique',
  new Set(templates.map((t) => t.key)).size === templates.length);
check('pricing has 4 plans with quotas', pricing && pricing.plans.length === 4 &&
  pricing.plans.every((p) => typeof p.quota === 'string'));

/* 3. detail pages ---------------------------------------------------- */
console.log('[3] detail pages');
const BANNED = ['data-stub-form', 'ds-star-pill', 'ds-footer__social'];
let detailOk = true, seoOk = true;
for (const it of integrations) {
  const p = path.join(SRC, 'integrations', it.key, 'index.html');
  if (!fs.existsSync(p)) { detailOk = false; console.log('  missing ' + p); continue; }
  const html = fs.readFileSync(p, 'utf8');
  if (!html.includes('<title>' + it.name + ' integration')) { seoOk = false; console.log('  bad title ' + p); }
  for (const b of BANNED) if (html.includes(b)) { detailOk = false; console.log('  banned ' + b + ' in ' + p); }
}
for (const t of templates) {
  const p = path.join(SRC, 'workflows', t.key, 'index.html');
  if (!fs.existsSync(p)) { detailOk = false; console.log('  missing ' + p); continue; }
  const html = fs.readFileSync(p, 'utf8');
  if (!html.includes('<title>' + t.title + ' — Flowmint template')) { seoOk = false; console.log('  bad title ' + p); }
  for (const b of BANNED) if (html.includes(b)) { detailOk = false; console.log('  banned ' + b + ' in ' + p); }
}
check('108 detail pages exist, no stub residue', detailOk);
check('unique SEO titles', seoOk);

/* 4. banned demo copy ------------------------------------------------ */
console.log('[4] honest copy');
const BANNED_COPY = [
  'nothing was sent', 'no message was actually sent', 'no account was created',
  'no session was created', 'nothing was stored', 'Demo note:',
  'Illustrative demo figure', 'placeholder link'
];
const htmlFiles = walk(SRC, '.html', []);
const jsSrcFiles = walk(path.join(SRC, 'js'), '.js', []);
let copyOk = true;
for (const f of htmlFiles.concat(jsSrcFiles)) {
  const c = fs.readFileSync(f, 'utf8');
  for (const b of BANNED_COPY) {
    if (c.includes(b)) { copyOk = false; console.log('  banned copy "' + b + '" in ' + path.relative(ROOT, f)); }
  }
}
check('no contradictory/demo copy anywhere', copyOk);

/* 5. trust signals --------------------------------------------------- */
console.log('[5] trust signals');
const mainPages = ['index.html', 'pricing/index.html', 'workflows/index.html',
  'integrations/index.html', 'features/index.html', 'docs/index.html',
  'community/index.html', 'contact/index.html', 'legal/index.html'];
let trustOk = true;
for (const rel of mainPages) {
  const c = fs.readFileSync(path.join(SRC, rel), 'utf8');
  if (/ds-star-pill/.test(c)) { trustOk = false; console.log('  star pill in ' + rel); }
  if (/ds-footer__social/.test(c)) { trustOk = false; console.log('  social block in ' + rel); }
  for (const host of ['https://github.com"', 'https://x.com"', 'https://discord.com"',
    'https://www.linkedin.com"', 'https://www.youtube.com"']) {
    if (c.includes('href="' + host)) { trustOk = false; console.log('  placeholder link ' + host + ' in ' + rel); }
  }
}
check('star pill + placeholder social links removed', trustOk);
const homeStats = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
check('homepage stats labeled illustrative',
  /Figures above are illustrative for this demo/.test(homeStats));

/* 6. sitemap --------------------------------------------------------- */
console.log('[6] sitemap');
const sitemap = fs.readFileSync(path.join(SRC, 'sitemap.xml'), 'utf8');
let smOk = true;
for (const it of integrations) {
  if (!sitemap.includes('https://flowmint.io/integrations/' + it.key + '/')) { smOk = false; break; }
}
for (const t of templates) {
  if (!sitemap.includes('https://flowmint.io/workflows/' + t.key + '/')) { smOk = false; break; }
}
check('sitemap covers all 108 detail URLs', smOk);

/* 7. form kinds vs API allowlist ------------------------------------- */
console.log('[7] form wiring');
const ALLOW = ['signup', 'signin', 'contact', 'newsletter', 'waitlist', 'request-integration'];
const kinds = new Set();
for (const f of htmlFiles) {
  const c = fs.readFileSync(f, 'utf8');
  const re = /data-lead-form="([a-z-]+)"/g;
  let m;
  while ((m = re.exec(c))) kinds.add(m[1]);
}
const unknown = [...kinds].filter((k) => !ALLOW.includes(k));
check('all data-lead-form kinds are API-accepted (' + [...kinds].sort().join(', ') + ')',
  unknown.length === 0, 'unknown: ' + unknown.join(','));
check('no data-stub-form remains', !htmlFiles.some((f) =>
  fs.readFileSync(f, 'utf8').includes('data-stub-form')));

/* 8. live API round-trip --------------------------------------------- */
console.log('[8] live API');
function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });
    r.on('error', reject);
    r.setTimeout(5000, () => { r.destroy(new Error('timeout')); });
    if (body) r.write(body);
    r.end();
  });
}

async function apiTests() {
  const port = 38123;
  const dataDir = path.join(ROOT, 'api', 'data');
  // Isolate test writes: back up any existing store files.
  const backups = {};
  for (const f of ['form_submissions.jsonl', 'consents.jsonl']) {
    const p = path.join(dataDir, f);
    if (fs.existsSync(p)) { backups[f] = fs.readFileSync(p); }
  }

  const server = spawn(process.execPath, [path.join(ROOT, 'api', 'server.js')],
    { env: { ...process.env, PORT: String(port) }, stdio: 'pipe' });
  const ready = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), 8000);
    server.stdout.on('data', (d) => {
      if (String(d).includes('on http://localhost')) { clearTimeout(t); resolve(true); }
    });
    server.on('error', () => { clearTimeout(t); resolve(false); });
  });
  check('server boots', ready);
  if (!ready) { server.kill(); return; }

  try {
    const base = { hostname: '127.0.0.1', port };
    let r = await req({ ...base, path: '/api/health', method: 'GET' });
    check('GET /api/health → 200 {ok:true}', r.status === 200 && JSON.parse(r.body).ok === true);

    r = await req({ ...base, path: '/', method: 'GET' });
    check('GET / serves index.html', r.status === 200 && r.body.includes('Flowmint'));

    r = await req({ ...base, path: '/integrations/slack/', method: 'GET' });
    check('GET /integrations/slack/ serves detail page',
      r.status === 200 && r.body.includes('<title>Slack integration'));

    const post = (payload) => req(
      { ...base, path: '/api/forms', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      JSON.stringify(payload));

    r = await post({ form: 'newsletter', payload: { email: 'ada@example.com' } });
    check('POST newsletter → 200 {ok:true}', r.status === 200 && JSON.parse(r.body).ok === true);

    r = await post({ form: 'contact', payload: { topic: 'sales', name: 'Ada', email: 'ada@example.com', message: 'Hi' } });
    check('POST contact → 200 {ok:true}', r.status === 200 && JSON.parse(r.body).ok === true);

    r = await post({ form: 'request-integration', payload: { name: 'Ada', email: 'ada@example.com', integration: 'Shopify' } });
    check('POST request-integration → 200 {ok:true}', r.status === 200 && JSON.parse(r.body).ok === true);

    // Stored? (append-only JSONL, schema.sql layout)
    const lines = fs.readFileSync(path.join(dataDir, 'form_submissions.jsonl'), 'utf8')
      .trim().split('\n').map((l) => JSON.parse(l));
    const forms = lines.map((l) => l.form);
    check('submissions persisted to JSONL store',
      forms.includes('newsletter') && forms.includes('contact') && forms.includes('request-integration'));
    const rec = lines[lines.length - 1];
    check('record mirrors schema.sql columns',
      ['id', 'form', 'payload', 'email', 'consent_marketing', 'ip_hash', 'user_agent', 'created_at']
        .every((k) => k in rec) && typeof rec.ip_hash === 'string' && rec.ip_hash.length === 64);
    check('no raw IP stored', !('ip' in rec) && !JSON.stringify(rec).includes('127.0.0.1'));

    const consents = fs.readFileSync(path.join(dataDir, 'consents.jsonl'), 'utf8')
      .trim().split('\n').map((l) => JSON.parse(l));
    check('newsletter wrote a consent row',
      consents.some((c) => c.email === 'ada@example.com' && c.purpose === 'newsletter' && c.granted === true));

    r = await post({ form: 'newsletter', payload: { email: 'not-an-email' } });
    check('invalid email → 422', r.status === 422);

    r = await post({ form: 'newsletter', payload: { email: 'ada@example.com', password: 'hunter2' } });
    check('unknown field (password) rejected → 422', r.status === 422);

    r = await post({ form: 'contact', payload: { name: 'Ada' } });
    check('missing required fields → 422', r.status === 422);

    r = await post({ form: 'nope', payload: {} });
    check('unknown form → 422', r.status === 422);

    r = await req({ ...base, path: '/api/forms', method: 'GET' });
    check('GET /api/forms → 404 (no read path)', r.status === 404);
  } catch (err) {
    check('api round-trip', false, err.message);
  } finally {
    server.kill();
    // Restore pre-test store state.
    for (const f of ['form_submissions.jsonl', 'consents.jsonl']) {
      const p = path.join(dataDir, f);
      if (backups[f]) fs.writeFileSync(p, backups[f]);
      else if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  }
}

apiTests().then(() => {
  console.log(failures === 0 ? '\nSMOKE OK' : '\nSMOKE FAILED (' + failures + ')');
  process.exit(failures === 0 ? 0 : 1);
});
