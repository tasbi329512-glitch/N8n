/* ==========================================================================
   Flowmint — scripts/generate-detail-pages.js
   Build Agent (repair pass) · 2026-10-17
   --------------------------------------------------------------------------
   Generates one static detail page per integration and per template from
   data/integrations.json and data/templates.json:

     source/integrations/<key>/index.html
     source/workflows/<key>/index.html

   Pages reuse the site chrome (header/footer/modals) from the catalog
   pages and carry unique SEO titles, meta descriptions, breadcrumbs,
   related-item links, and CTAs. All body copy is written fresh here —
   nothing is lifted from the reference site.

   Usage: node scripts/generate-detail-pages.js   (or npm run build:details)
   Run from the project root (the project root/).
   ========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'source');

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function glyph(name, hue) {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return '<span class="ds-tile__glyph" aria-hidden="true" style="font-weight:700;color:hsl(' +
    hue + ',70%,72%)">' + esc(letter) + '</span>';
}

function replaceHead(html, { title, description, url }) {
  html = html.replace(/<title>.*?<\/title>/, '<title>' + esc(title) + '</title>');
  html = html.replace(
    /<meta name="description" content=".*?">/,
    '<meta name="description" content="' + esc(description) + '">'
  );
  html = html.replace(
    /<meta property="og:title" content=".*?">/,
    '<meta property="og:title" content="' + esc(title) + '">'
  );
  html = html.replace(
    /<meta property="og:description" content=".*?">/,
    '<meta property="og:description" content="' + esc(description) + '">'
  );
  html = html.replace(
    /<meta property="og:url" content=".*?">/,
    '<meta property="og:url" content="' + esc(url) + '">'
  );
  return html;
}

function replaceMain(html, inner) {
  return html.replace(
    /<main id="main">[\s\S]*?<\/main>/,
    '<main id="main">\n' + inner + '\n</main>'
  );
}

function breadcrumbJsonLd(crumbs) {
  const items = crumbs.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.name,
    item: c.url
  }));
  return '<script type="application/ld+json">' +
    JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items
    }) + '</script>';
}

function breadcrumbHtml(crumbs) {
  const parts = crumbs.map((c, i) => {
    const last = i === crumbs.length - 1;
    return last
      ? '<li aria-current="page">' + esc(c.name) + '</li>'
      : '<li><a href="' + esc(c.href) + '">' + esc(c.name) + '</a></li>';
  }).join('<li aria-hidden="true" class="ds-muted"> / </li>');
  return '<nav aria-label="Breadcrumb" class="ds-reveal"><ol class="ds-pills" style="list-style:none;padding:0">' +
    parts + '</ol></nav>';
}

/* ---------------------------------------------------------------
   Integration detail content
--------------------------------------------------------------- */
const CATEGORY_NOTES = {
  'Communication': 'Keep every conversation in sync — post, listen, and react without leaving the canvas.',
  'AI & LLMs': 'Give your workflows a brain: models, embeddings, and retrieval plug straight into the canvas.',
  'Databases': 'Your data layer, wired in: query, sync, and trigger on changes.',
  'Developer tools': 'Ship faster: issues, deploys, and incidents flow through one place.',
  'CRM': 'Never let a lead slip: pipeline updates happen the moment they should.',
  'Marketing': 'Campaigns that run themselves, driven by live customer behavior.',
  'Files & storage': 'Files move themselves: watch, sync, and organize across storage.',
  'Productivity': 'Busywork disappears: docs, tasks, and calendars stay in sync.',
  'E-commerce': 'Storefront and back office in sync — orders, payments, and customers.',
  'Support': 'Support at machine speed: tickets triaged before a human looks.',
  'Forms & surveys': 'Every response becomes action the second it arrives.',
  'Analytics': 'Numbers that notify you: events in, insights and alerts out.'
};

function integrationBody(item, related) {
  const hasTrigger = /trigger/i.test(item.type);
  const hasAction = /action/i.test(item.type);
  const bullets = [];
  if (hasTrigger) bullets.push('Start workflows when events happen in ' + item.name + ' — new messages, records, or updates.');
  if (hasAction) bullets.push('Read from and write to ' + item.name + ' from any step: create, update, search, and delete.');
  bullets.push('Authenticate once with built-in OAuth or API-key credentials — no tokens pasted into configs.');
  const catNote = CATEGORY_NOTES[item.category] || 'Connect it once, then automate around it.';

  const relatedCards = related.map((r) =>
    '<article class="ds-card ds-card--hoverable">' +
    '<div style="display:flex;align-items:center;gap:.9rem;margin-bottom:.9rem">' + glyph(r.name, r.hue) +
    '<div><h3 style="margin:0;font-size:1.05rem"><a href="/integrations/' + esc(r.key) + '/" style="color:inherit;text-decoration:none">' + esc(r.name) + '</a></h3>' +
    '<p class="ds-muted" style="margin:.15rem 0 0;font-size:.8rem">' + esc(r.type) + ' · ' + esc(r.category) + '</p></div></div>' +
    '<p style="font-size:.95rem">' + esc(r.blurb) + '</p>' +
    '<p style="margin-top:1rem"><a href="/integrations/' + esc(r.key) + '/" style="font-size:.9rem">Details →</a></p>' +
    '</article>'
  ).join('');

  return `
    <section class="ds-hero ds-glow-field" aria-labelledby="detail-title" style="padding-bottom:2.5rem">
      <div class="ds-container">
        ${breadcrumbHtml([
          { name: 'Home', href: '/' },
          { name: 'Integrations', href: '/integrations/' },
          { name: item.name, href: '/integrations/' + item.key + '/' }
        ])}
        <div class="ds-reveal" style="display:flex;align-items:center;gap:1.25rem;margin:2rem 0 1rem">
          ${glyph(item.name, item.hue)}
          <div>
            <p class="ds-eyebrow" style="margin:0 0 .35rem">${esc(item.category)}</p>
            <h1 class="ds-hero-title" id="detail-title" style="margin:0">${esc(item.name)}</h1>
          </div>
        </div>
        <p class="ds-muted ds-reveal" style="margin:0 0 1rem">${esc(item.type)}</p>
        <p class="ds-lead ds-reveal" style="margin:0;max-width:44rem">${esc(item.blurb)}</p>
        <div class="ds-hero__ctas ds-reveal" style="margin-top:1.75rem">
          <button class="ds-btn ds-btn--cta ds-btn--pill" data-auth-open="signup">Connect ${esc(item.name)} free</button>
          <a class="ds-btn ds-btn--ghost ds-btn--pill" href="/integrations/">All integrations</a>
        </div>
      </div>
    </section>

    <section class="ds-section ds-section--tight" aria-labelledby="what-title">
      <div class="ds-container">
        <h2 class="ds-section-title ds-reveal" id="what-title" style="margin-bottom:1.5rem">What you can do with ${esc(item.name)}</h2>
        <p class="ds-lead ds-reveal" style="margin:0 0 1.5rem;max-width:44rem">${esc(catNote)}</p>
        <ul class="ds-checklist ds-reveal" style="max-width:44rem">
          ${bullets.map((b) => '<li><svg width="18" height="18" aria-hidden="true"><use href="/assets/icons/icons.svg#i-check"/></svg>' + esc(b) + '</li>').join('')}
        </ul>
      </div>
    </section>

    <section class="ds-section ds-section--tight" aria-labelledby="rel-title" style="padding-top:0">
      <div class="ds-container">
        <h2 class="ds-section-title ds-reveal" id="rel-title" style="margin-bottom:1.5rem">Pairs well with</h2>
        <div class="ds-grid-cards ds-reveal">${relatedCards}</div>
      </div>
    </section>

    <section class="ds-section" aria-label="Get started" style="padding-top:0">
      <div class="ds-container">
        <div class="ds-final-cta ds-reveal">
          <h2 class="ds-display-md">Connect ${esc(item.name)} in minutes.</h2>
          <p>Your first workflow is minutes away — no credit card required.</p>
          <button class="ds-btn ds-btn--light" data-auth-open="signup" style="padding:1rem 2.25rem;font-size:1rem">Start building free
            <svg class="ds-btn__icon" width="16" height="16" aria-hidden="true"><use href="/assets/icons/icons.svg#i-arrow"/></svg>
          </button>
        </div>
      </div>
    </section>
    ${breadcrumbJsonLd([
      { name: 'Home', url: 'https://flowmint.io/' },
      { name: 'Integrations', url: 'https://flowmint.io/integrations/' },
      { name: item.name, url: 'https://flowmint.io/integrations/' + item.key + '/' }
    ])}`;
}

/* ---------------------------------------------------------------
   Template detail content
--------------------------------------------------------------- */
const FLOW_STEPS = {
  'AI': [
    'Trigger — the workflow wakes up on your schedule or an incoming event.',
    'Gather — pull in the documents, tickets, or messages the AI needs as context.',
    'Reason — an AI node drafts, classifies, or extracts exactly what you asked for.',
    'Deliver — the result lands where people already work: chat, inbox, or ticket queue.'
  ],
  'Marketing': [
    'Trigger — a signup, a schedule, or a new row kicks things off.',
    'Segment — the workflow decides who this message is for.',
    'Personalize — content is tailored from live customer data.',
    'Send & log — the message goes out and every send is recorded.'
  ],
  'Sales': [
    'Trigger — a new lead, a stalled deal, or a usage signal.',
    'Enrich — firmographics and context are attached automatically.',
    'Route — the right rep or playbook gets the lead instantly.',
    'Follow up — tasks and nudges keep the deal moving.'
  ],
  'DevOps': [
    'Trigger — a deploy, a schedule, or a monitor alert.',
    'Check — the workflow verifies state: tests, metrics, or disk.',
    'Act — notify, roll back, or page with runbook links attached.',
    'Record — every run is logged for the post-mortem.'
  ],
  'Data': [
    'Trigger — on schedule or when source data changes.',
    'Extract — pull rows, files, or events from the source.',
    'Validate — bad rows are quarantined before they spread.',
    'Load — clean data lands in the warehouse, sheet, or dashboard.'
  ],
  'IT Ops': [
    'Trigger — a ticket, a failed login, or the Friday clock.',
    'Enrich — context is gathered: who, what, and blast radius.',
    'Respond — accounts provisioned, tickets opened, or pages sent.',
    'Document — a summary is filed so the next shift starts informed.'
  ],
  'CRM': [
    'Trigger — a form fill, a deal change, or the nightly clock.',
    'Deduplicate — the workflow checks for existing records first.',
    'Update — contacts, deals, and tasks stay current on their own.',
    'Nudge — owners hear about what needs them, nothing else.'
  ],
  'Communication': [
    'Trigger — a message, a mention, or a schedule.',
    'Collect — the workflow gathers the thread, file, or replies.',
    'Summarize — noise becomes a short digest with the essentials.',
    'Post — the team sees one message instead of fifty.'
  ],
  'Productivity': [
    'Trigger — the end of a meeting, week, or workday.',
    'Gather — notes, tasks, and updates are collected automatically.',
    'Organize — owners and deadlines are parsed from the text.',
    'Deliver — a tidy summary lands where the team looks.'
  ],
  'Finance': [
    'Trigger — an invoice date, a new receipt, or the nightly clock.',
    'Extract — amounts, dates, and vendors are read automatically.',
    'Check — overdue or unusual items are flagged for a human.',
    'Record — everything lands in the books, reconciled.'
  ]
};

function templateBody(item, related) {
  const steps = FLOW_STEPS[item.category] || [
    'Trigger — the workflow starts on your schedule or an event.',
    'Process — each step transforms the data a little further.',
    'Decide — branches handle the edge cases for you.',
    'Deliver — the outcome lands where people already work.'
  ];

  const relatedCards = related.map((r) =>
    '<article class="ds-card ds-card--hoverable">' +
    '<p class="ds-eyebrow" style="margin-bottom:.6rem">' + esc(r.category) + ' · ' + esc(r.difficulty) + '</p>' +
    '<h3><a href="/workflows/' + esc(r.key) + '/" style="color:inherit;text-decoration:none">' + esc(r.title) + '</a></h3>' +
    '<p style="font-size:.95rem">' + esc(r.description) + '</p>' +
    '<p class="ds-muted" style="font-size:.85rem;margin-top:.9rem">' + r.nodes + ' nodes · by ' + esc(r.creator) + '</p>' +
    '<p style="margin-top:1rem"><a href="/workflows/' + esc(r.key) + '/" style="font-size:.9rem">Details →</a></p>' +
    '</article>'
  ).join('');

  return `
    <section class="ds-hero ds-glow-field" aria-labelledby="detail-title" style="padding-bottom:2.5rem">
      <div class="ds-container">
        ${breadcrumbHtml([
          { name: 'Home', href: '/' },
          { name: 'Templates', href: '/workflows/' },
          { name: item.title, href: '/workflows/' + item.key + '/' }
        ])}
        <p class="ds-eyebrow ds-reveal" style="margin-top:2rem">${esc(item.category)} · ${esc(item.difficulty)}</p>
        <h1 class="ds-hero-title ds-reveal" id="detail-title" style="margin:.5rem 0 0">${esc(item.title)}</h1>
        <p class="ds-lead ds-reveal" style="margin:1.25rem 0 0;max-width:44rem">${esc(item.description)}</p>
        <p class="ds-muted ds-reveal" style="margin:1rem 0 0">${item.nodes} nodes · by ${esc(item.creator)}</p>
        <div class="ds-hero__ctas ds-reveal" style="margin-top:1.75rem">
          <button class="ds-btn ds-btn--cta ds-btn--pill" data-use-template="${esc(item.key)}">Use this template</button>
          <a class="ds-btn ds-btn--ghost ds-btn--pill" href="/workflows/">All templates</a>
        </div>
      </div>
    </section>

    <section class="ds-section ds-section--tight" aria-labelledby="flow-title">
      <div class="ds-container">
        <h2 class="ds-section-title ds-reveal" id="flow-title" style="margin-bottom:.5rem">How this template works</h2>
        <p class="ds-muted ds-reveal" style="margin:0 0 1.5rem;max-width:44rem">Typical flow, illustrative — the imported template shows the exact nodes.</p>
        <ol class="ds-reveal" style="max-width:44rem;display:grid;gap:1rem;padding-left:1.25rem;margin:0">
          ${steps.map((s) => '<li style="font-size:1.02rem">' + esc(s) + '</li>').join('')}
        </ol>
      </div>
    </section>

    <section class="ds-section ds-section--tight" aria-labelledby="rel-title" style="padding-top:0">
      <div class="ds-container">
        <h2 class="ds-section-title ds-reveal" id="rel-title" style="margin-bottom:1.5rem">Related templates</h2>
        <div class="ds-grid-cards ds-reveal">${relatedCards}</div>
      </div>
    </section>

    <section class="ds-section" aria-label="Get started" style="padding-top:0">
      <div class="ds-container">
        <div class="ds-final-cta ds-reveal">
          <h2 class="ds-display-md">Ship “${esc(item.title)}” today.</h2>
          <p>Import the template, connect your accounts, and customize — no credit card required.</p>
          <button class="ds-btn ds-btn--light" data-use-template="${esc(item.key)}" style="padding:1rem 2.25rem;font-size:1rem">Use this template
            <svg class="ds-btn__icon" width="16" height="16" aria-hidden="true"><use href="/assets/icons/icons.svg#i-arrow"/></svg>
          </button>
        </div>
      </div>
    </section>
    ${breadcrumbJsonLd([
      { name: 'Home', url: 'https://flowmint.io/' },
      { name: 'Templates', url: 'https://flowmint.io/workflows/' },
      { name: item.title, url: 'https://flowmint.io/workflows/' + item.key + '/' }
    ])}`;
}

function relatedOf(list, item, n) {
  const same = list.filter((x) => x.key !== item.key && x.category === item.category)
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  const rest = list.filter((x) => x.key !== item.key && x.category !== item.category)
    .sort((a, b) => (a.key < b.key ? -1 : 1));
  return same.concat(rest).slice(0, n);
}

/* ---------------------------------------------------------------
   Main
--------------------------------------------------------------- */
function main() {
  const integrations = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'integrations.json'), 'utf8'));
  const templates = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'templates.json'), 'utf8'));

  const intChrome = fs.readFileSync(path.join(SRC, 'integrations', 'index.html'), 'utf8');
  const tplChrome = fs.readFileSync(path.join(SRC, 'workflows', 'index.html'), 'utf8');

  let count = 0;

  for (const item of integrations) {
    const dir = path.join(SRC, 'integrations', item.key);
    fs.mkdirSync(dir, { recursive: true });
    const url = 'https://flowmint.io/integrations/' + item.key + '/';
    let html = replaceHead(intChrome, {
      title: item.name + ' integration — Flowmint',
      description: item.blurb + ' Connect ' + item.name + ' to Flowmint workflows with triggers and actions.',
      url
    });
    html = replaceMain(html, integrationBody(item, relatedOf(integrations, item, 3)));
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  for (const item of templates) {
    const dir = path.join(SRC, 'workflows', item.key);
    fs.mkdirSync(dir, { recursive: true });
    const url = 'https://flowmint.io/workflows/' + item.key + '/';
    let html = replaceHead(tplChrome, {
      title: item.title + ' — Flowmint template',
      description: item.description,
      url
    });
    html = replaceMain(html, templateBody(item, relatedOf(templates, item, 3)));
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    count++;
  }

  console.log(`[details] generated ${count} pages ` +
    `(${integrations.length} integrations, ${templates.length} templates)`);
}

main();
