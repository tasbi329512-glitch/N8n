/* ==========================================================================
   Flowmint — data.js
   Product build · 2026-10-17
   --------------------------------------------------------------------------
   Catalog pages: fetch curated JSON, render cards, wire search input,
   category pills, sidebar filters, and Load-more pagination.
   Original code; no framework.
   ========================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Original letter-glyph: first letter on a hue-tinted rounded square.
  // No third-party logos are used anywhere.
  function glyph(name, hue) {
    var letter = (name || '?').trim().charAt(0).toUpperCase();
    return '<span class="ds-tile__glyph" aria-hidden="true" style="font-weight:700;color:hsl(' +
      hue + ',70%,72%)">' + esc(letter) + '</span>';
  }

  var PAGE_SIZE = 12;

  /* ---------------------------------------------------------------
     Generic catalog controller shared by templates + integrations
  --------------------------------------------------------------- */
  function initCatalog(opts) {
    var root = document.querySelector(opts.root);
    if (!root) return;

    var state = {
      items: [],
      query: '',
      category: 'all',
      extra: 'all', // integrations: type filter; templates: difficulty
      shown: PAGE_SIZE
    };

    var els = {
      grid: root.querySelector('[data-catalog-grid]'),
      search: root.querySelector('[data-catalog-search]'),
      pills: root.querySelector('[data-catalog-pills]'),
      side: root.querySelector('[data-catalog-side]'),
      more: root.querySelector('[data-catalog-more]'),
      count: root.querySelector('[data-catalog-count]'),
      empty: root.querySelector('[data-catalog-empty]')
    };

    function matches(item) {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (state.extra !== 'all') {
        var field = opts.extraField; // 'type' | 'difficulty'
        if (item[field] !== state.extra) return false;
      }
      if (state.query) {
        // Only fields present on the item enter the haystack; missing fields
        // would coerce to the literal string "undefined" and match junk queries.
        var hay = [item.name, item.title, item.description, item.blurb, item.category, item.type]
          .filter(function (f) { return f != null; })
          .join(' ').toLowerCase();
        if (hay.indexOf(state.query) === -1) return false;
      }
      return true;
    }

    function card(item) {
      if (opts.kind === 'integration') {
        return '<article class="ds-card ds-card--hoverable" data-reveal-item>' +
          '<div style="display:flex;align-items:center;gap:.9rem;margin-bottom:.9rem">' +
          glyph(item.name, item.hue) +
          '<div><h3 style="margin:0;font-size:1.05rem"><a href="/integrations/' + esc(item.key) + '/" style="color:inherit;text-decoration:none">' + esc(item.name) + '</a></h3>' +
          '<p class="ds-muted" style="margin:.15rem 0 0;font-size:.8rem">' + esc(item.type) + ' · ' + esc(item.category) + '</p></div>' +
          '</div>' +
          '<p style="font-size:.95rem">' + esc(item.blurb) + '</p>' +
          '<p style="margin-top:1rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">' +
          '<button class="ds-btn ds-btn--dark" data-connect="' + esc(item.key) + '">Connect ' + esc(item.name) + '</button>' +
          '<a href="/integrations/' + esc(item.key) + '/" style="font-size:.9rem">Details →</a></p>' +
          '</article>';
      }
      // template
      return '<article class="ds-card ds-card--hoverable" data-reveal-item>' +
        '<p class="ds-eyebrow" style="margin-bottom:.6rem">' + esc(item.category) + ' · ' + esc(item.difficulty) + '</p>' +
        '<h3><a href="/workflows/' + esc(item.key) + '/" style="color:inherit;text-decoration:none">' + esc(item.title) + '</a></h3>' +
        '<p style="font-size:.95rem">' + esc(item.description) + '</p>' +
        '<p class="ds-muted" style="font-size:.85rem;margin-top:.9rem">' + item.nodes + ' nodes · by ' + esc(item.creator) + '</p>' +
        '<p style="margin-top:1rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">' +
        '<button class="ds-btn ds-btn--dark" data-use-template="' + esc(item.key) + '">Use this template</button>' +
        '<a href="/workflows/' + esc(item.key) + '/" style="font-size:.9rem">Details →</a></p>' +
        '</article>';
    }

    function paint() {
      var filtered = state.items.filter(matches);
      var visible = filtered.slice(0, state.shown);
      els.grid.innerHTML = visible.map(card).join('');
      if (els.count) {
        els.count.textContent = filtered.length + ' of ' + state.items.length + ' ' + opts.countNoun;
      }
      if (els.empty) els.empty.hidden = filtered.length !== 0;
      if (els.more) els.more.hidden = filtered.length <= state.shown;
      if (els.more) {
        els.more.textContent = 'Load more (' + Math.min(state.shown + PAGE_SIZE, filtered.length) + ' of ' + filtered.length + ')';
      }
    }

    function buildPills(categories) {
      if (!els.pills) return;
      var html = '<li><button class="ds-pill" data-pill="all" aria-pressed="true">All</button></li>';
      categories.forEach(function (c) {
        html += '<li><button class="ds-pill" data-pill="' + esc(c) + '" aria-pressed="false">' + esc(c) + '</button></li>';
      });
      els.pills.innerHTML = html;
    }

    function buildSide(options) {
      if (!els.side || !options) return;
      var html = '';
      options.forEach(function (group) {
        html += '<div style="margin-bottom:1.5rem"><h3 class="ds-muted" style="font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;margin:0 0 .7rem">' +
          esc(group.label) + '</h3><div class="ds-pills" role="group" aria-label="' + esc(group.label) + '">';
        group.values.forEach(function (v, i) {
          html += '<button class="ds-pill" data-extra="' + esc(v) + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + esc(v) + '</button>';
        });
        html += '</div></div>';
      });
      els.side.innerHTML = html;
    }

    // "Connect" / "Use template" open the signup modal — the honest action
    // for a logged-out marketing visitor.
    root.addEventListener('click', function (ev) {
      var pill = ev.target.closest('[data-pill]');
      if (pill && els.pills && els.pills.contains(pill)) {
        state.category = pill.getAttribute('data-pill');
        state.shown = PAGE_SIZE;
        els.pills.querySelectorAll('[data-pill]').forEach(function (p) {
          p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
        });
        paint();
        return;
      }
      var extra = ev.target.closest('[data-extra]');
      if (extra && els.side && els.side.contains(extra)) {
        state.extra = extra.getAttribute('data-extra');
        state.shown = PAGE_SIZE;
        var group = extra.closest('[role="group"]');
        group.querySelectorAll('[data-extra]').forEach(function (p) {
          p.setAttribute('aria-pressed', p === extra ? 'true' : 'false');
        });
        paint();
        return;
      }
      if (ev.target.closest('[data-catalog-more]')) {
        state.shown += PAGE_SIZE;
        paint();
        return;
      }
      var action = ev.target.closest('[data-connect]');
      if (action) {
        ev.preventDefault();
        var fake = document.createElement('span');
        fake.setAttribute('data-auth-open', 'signup');
        document.body.appendChild(fake);
        fake.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        fake.remove();
      }
    });

    var searchTimer = null;
    if (els.search) {
      els.search.addEventListener('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function () {
          state.query = els.search.value.trim().toLowerCase();
          state.shown = PAGE_SIZE;
          paint();
        }, 160);
      });
    }

    fetch(opts.url)
      .then(function (r) { return r.json(); })
      .then(function (items) {
        state.items = items;
        var cats = Array.from(new Set(items.map(function (i) { return i.category; }))).sort();
        buildPills(cats);
        buildSide(opts.sideGroups);
        paint();
      })
      .catch(function () {
        els.grid.innerHTML = '<p class="ds-muted">Catalog data could not be loaded. Please check your connection and reload.</p>';
      });
  }

  /* ---------------------------------------------------------------
     Integrations page
  --------------------------------------------------------------- */
  initCatalog({
    root: '[data-catalog="integrations"]',
    url: '/data/integrations.json',
    kind: 'integration',
    countNoun: 'integrations',
    extraField: 'type',
    sideGroups: [
      { label: 'Capability', values: ['all', 'Trigger + Action', 'Trigger', 'Action'] }
    ]
  });

  /* ---------------------------------------------------------------
     Templates page: sectioned grids + full catalog
     Sections render from data-tpl-section attributes (page-global);
     the full searchable catalog lives under [data-catalog="templates-all"].
  --------------------------------------------------------------- */
  /* ---------------------------------------------------------------
     "Use this template" → signup modal. Registered document-wide so it
     works on catalog pages AND per-template detail pages.
  --------------------------------------------------------------- */
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-use-template]')) {
      ev.preventDefault();
      var fake = document.createElement('span');
      fake.setAttribute('data-auth-open', 'signup');
      document.body.appendChild(fake);
      fake.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      fake.remove();
    }
  });

  var tplSections = document.querySelectorAll('[data-tpl-section]');
  if (tplSections.length) {
    fetch('/data/templates.json')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        tplSections.forEach(function (sec) {
          var key = sec.getAttribute('data-tpl-section');
          var grid = sec.querySelector('[data-tpl-grid]');
          if (!grid) return;
          var list = items.filter(function (t) { return t.sections.indexOf(key) !== -1; }).slice(0, 6);
          grid.innerHTML = list.map(function (t) {
            return '<article class="ds-card ds-card--hoverable">' +
              '<p class="ds-eyebrow" style="margin-bottom:.6rem">' + esc(t.category) + ' · ' + esc(t.difficulty) + '</p>' +
              '<h3><a href="/workflows/' + esc(t.key) + '/" style="color:inherit;text-decoration:none">' + esc(t.title) + '</a></h3>' +
              '<p style="font-size:.95rem">' + esc(t.description) + '</p>' +
              '<p class="ds-muted" style="font-size:.85rem;margin-top:.9rem">' + t.nodes + ' nodes · by ' + esc(t.creator) + '</p>' +
              '<p style="margin-top:1rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap">' +
              '<button class="ds-btn ds-btn--dark" data-use-template="' + esc(t.key) + '">Use this template</button>' +
              '<a href="/workflows/' + esc(t.key) + '/" style="font-size:.9rem">Details →</a></p>' +
              '</article>';
          }).join('');
        });
      })
      .catch(function () { /* sections stay empty; full catalog below handles errors */ });

    // Full searchable catalog.
    initCatalog({
      root: '[data-catalog="templates-all"]',
      url: '/data/templates.json',
      kind: 'template',
      countNoun: 'templates',
      extraField: 'difficulty',
      sideGroups: [
        { label: 'Difficulty', values: ['all', 'Beginner', 'Intermediate', 'Advanced'] }
      ]
    });
  }

  /* ---------------------------------------------------------------
     Homepage: integration tile strip (first 12) + testimonial marquee
     content is server-rendered in HTML; this only enhances counts.
  --------------------------------------------------------------- */
  var homeTiles = document.querySelector('[data-home-tiles]');
  if (homeTiles) {
    fetch('/data/integrations.json')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        homeTiles.innerHTML = items.slice(0, 12).map(function (item) {
          return '<a class="ds-tile" href="/integrations/' + esc(item.key) + '/">' + glyph(item.name, item.hue) +
            '<span>' + esc(item.name) + '</span></a>';
        }).join('');
      })
      .catch(function () { /* static fallback tiles remain */ });
  }
})();
