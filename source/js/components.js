/* ==========================================================================
   Flowmint — components.js
   Product build · 2026-10-17
   --------------------------------------------------------------------------
   Page components: tab showcase (+ SVG canvas renderer), accordions,
   pricing billing toggle, comparison-table edition tabs, case-study
   modal. Original code; no framework.
   ========================================================================== */
(function () {
  'use strict';
  var FM = window.Flowmint || {};

  /* ---------------------------------------------------------------
     1. Generic tabs: role=tablist/tab/tabpanel with arrow-key support
  --------------------------------------------------------------- */
  function initTabs(root) {
    var tablist = root.querySelector('[role="tablist"]');
    if (!tablist) return;
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (panel, i) {
        if (panel) panel.hidden = tabs[i] !== tab;
      });
      if (focus) tab.focus();
      var ev = new CustomEvent('fm:tabselect', { detail: { tab: tab }, bubbles: true });
      tablist.dispatchEvent(ev);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (ev) {
        var next = null;
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
        else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (ev.key === 'Home') next = tabs[0];
        else if (ev.key === 'End') next = tabs[tabs.length - 1];
        if (next) { ev.preventDefault(); select(next, true); }
      });
    });
  }
  document.querySelectorAll('[data-tabs]').forEach(initTabs);

  /* ---------------------------------------------------------------
     2. Accordions: aria-expanded wiring + animated grid-rows panels
  --------------------------------------------------------------- */
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-accordion-btn]');
    if (!btn) return;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    var scope = btn.closest('[data-accordion-scope]');
    // Single-open behavior within a scope (FAQ style).
    if (scope && !expanded) {
      scope.querySelectorAll('[data-accordion-btn][aria-expanded="true"]').forEach(function (other) {
        other.setAttribute('aria-expanded', 'false');
      });
    }
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });

  /* ---------------------------------------------------------------
     3. Workflow-canvas visual renderer (original SVG node-graph art)
        Renders a dotted-grid canvas with node cards + bezier connectors.
  --------------------------------------------------------------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function renderCanvas(container, spec) {
    var W = 560, H = 380;
    var nodeW = 132, nodeH = 62;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(spec.label) + '" style="width:100%;height:auto;display:block">';
    svg += '<defs><linearGradient id="fmc-' + spec.id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fd8925"/><stop offset="1" stop-color="#ff0c00"/></linearGradient></defs>';

    // Connectors (drawn under nodes).
    spec.edges.forEach(function (e) {
      var a = spec.nodes[e[0]], b = spec.nodes[e[1]];
      var x1 = a.x + nodeW, y1 = a.y + nodeH / 2;
      var x2 = b.x, y2 = b.y + nodeH / 2;
      var mx = (x1 + x2) / 2;
      svg += '<path d="M' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2 +
        '" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2" stroke-dasharray="6 5"/>';
    });

    // Nodes.
    spec.nodes.forEach(function (n, i) {
      var accent = n.ai ? 'url(#fmc-' + spec.id + ')' : 'rgba(255,255,255,0.10)';
      svg += '<g>' +
        '<rect x="' + n.x + '" y="' + n.y + '" width="' + nodeW + '" height="' + nodeH +
        '" rx="12" fill="#1b1728" stroke="rgba(255,255,255,0.14)"/>' +
        '<rect x="' + n.x + '" y="' + n.y + '" width="4" height="' + nodeH + '" rx="2" fill="' + accent + '"/>' +
        '<circle cx="' + (n.x + 22) + '" cy="' + (n.y + nodeH / 2) + '" r="9" fill="' + accent + '"/>' +
        '<text x="' + (n.x + 40) + '" y="' + (n.y + 27) + '" fill="#ffffff" font-size="12.5" font-weight="600" font-family="Manrope,sans-serif">' + esc(n.title) + '</text>' +
        '<text x="' + (n.x + 40) + '" y="' + (n.y + 44) + '" fill="#9d9797" font-size="10.5" font-family="Manrope,sans-serif">' + esc(n.sub) + '</text>' +
        '</g>';
      void i;
    });
    svg += '</svg>';
    container.innerHTML = svg;
    container.classList.add('ds-dotgrid');
    container.style.borderRadius = '1.5rem';
    container.style.border = '1px solid rgba(255,255,255,0.10)';
    container.style.background = 'radial-gradient(120% 120% at 80% 0%, rgba(139,92,246,.10), transparent 60%), #14101f';
    container.style.padding = '1.25rem';
  }

  var showcaseSpecs = {
    'panel-itonboard': {
      id: 'itonboard', label: 'Employee onboarding workflow canvas',
      nodes: [
        { x: 24, y: 40, title: 'HR form', sub: 'Trigger' },
        { x: 214, y: 40, title: 'AI agent', sub: 'Plans setup', ai: true },
        { x: 214, y: 170, title: 'Create accounts', sub: 'IT tools' },
        { x: 404, y: 105, title: 'Welcome pack', sub: 'Email + chat' }
      ],
      edges: [[0, 1], [1, 2], [1, 3], [2, 3]]
    },
    'panel-sectriage': {
      id: 'sectriage', label: 'Security ticket enrichment canvas',
      nodes: [
        { x: 24, y: 105, title: 'Failed login', sub: 'Trigger' },
        { x: 214, y: 105, title: 'AI agent', sub: 'Enrich alert', ai: true },
        { x: 404, y: 40, title: 'Open ticket', sub: 'Queue: secops' },
        { x: 404, y: 170, title: 'Page on-call', sub: 'If critical' }
      ],
      edges: [[0, 1], [1, 2], [1, 3]]
    },
    'panel-devapi': {
      id: 'devapi', label: 'Natural language to API canvas',
      nodes: [
        { x: 24, y: 105, title: 'Chat input', sub: 'Trigger' },
        { x: 214, y: 105, title: 'AI agent', sub: 'Builds API call', ai: true },
        { x: 404, y: 40, title: 'HTTP request', sub: 'Tool' },
        { x: 404, y: 170, title: 'Format reply', sub: 'Respond' }
      ],
      edges: [[0, 1], [1, 2], [2, 3]]
    },
    'panel-sales': {
      id: 'sales', label: 'Sales call insight canvas',
      nodes: [
        { x: 24, y: 40, title: 'Call ends', sub: 'Trigger' },
        { x: 24, y: 170, title: 'Transcribe', sub: 'Speech → text' },
        { x: 214, y: 105, title: 'AI agent', sub: 'Extract insights', ai: true },
        { x: 404, y: 105, title: 'Update CRM', sub: 'Deal + tasks' }
      ],
      edges: [[0, 2], [1, 2], [2, 3]]
    },
    'panel-content': {
      id: 'content', label: 'Content brief drafting canvas',
      nodes: [
        { x: 24, y: 105, title: 'Topic idea', sub: 'Trigger' },
        { x: 214, y: 40, title: 'Research', sub: 'Web search' },
        { x: 214, y: 170, title: 'AI agent', sub: 'Drafts brief', ai: true },
        { x: 404, y: 105, title: 'Review', sub: 'Human approval' }
      ],
      edges: [[0, 1], [0, 2], [1, 3], [2, 3]]
    }
  };

  document.querySelectorAll('[data-tab-canvas]').forEach(function (panel) {
    var spec = showcaseSpecs[panel.id];
    if (spec) {
      var slot = panel.querySelector('[data-canvas-slot]') || panel;
      renderCanvas(slot, spec);
    }
  });

  /* ---------------------------------------------------------------
     4. Pricing: billing toggle swaps prices from data/pricing.json
  --------------------------------------------------------------- */
  var pricingRoots = document.querySelectorAll('[data-pricing]');
  if (pricingRoots.length) {
    fetch('/data/pricing.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var symbol = data.meta.currencySymbol || '$';
        var period = 'annual';
        // Plans and toggle live in separate [data-pricing] blocks; scope
        // lookups to the document since there is one pricing page.
        var scope = document;

        function paint() {
          data.plans.forEach(function (plan) {
            var card = scope.querySelector('[data-plan="' + plan.key + '"]');
            if (!card) return;
            var priceEl = card.querySelector('[data-plan-price]');
            var perEl = card.querySelector('[data-plan-per]');
            if (priceEl) {
              priceEl.textContent = plan.custom ? plan.priceLabel : symbol + plan[period].price;
            }
            if (perEl) {
              perEl.textContent = plan.custom ? '' : plan[period].per;
            }
          });
          var hint = scope.querySelector('[data-save-hint]');
          if (hint) hint.textContent = period === 'annual' ? data.meta.annualSavingHint : 'Billed month to month, cancel anytime';
        }

        var toggle = scope.querySelector('[data-billing-toggle]');
        if (toggle) {
          toggle.addEventListener('click', function () {
            period = period === 'annual' ? 'monthly' : 'annual';
            toggle.setAttribute('aria-checked', period === 'annual' ? 'true' : 'false');
            var mLabel = scope.querySelector('[data-billing-label="monthly"]');
            var aLabel = scope.querySelector('[data-billing-label="annual"]');
            if (mLabel) mLabel.setAttribute('aria-current', period === 'monthly' ? 'true' : 'false');
            if (aLabel) aLabel.setAttribute('aria-current', period === 'annual' ? 'true' : 'false');
            paint();
          });
        }
        paint();
      })
      .catch(function () {
        // Prices are server-rendered in the HTML as fallback; toggle just
        // flips labels if the JSON can't load (file:// usage).
        var toggle = document.querySelector('[data-billing-toggle]');
        if (toggle) toggle.setAttribute('aria-disabled', 'true');
      });
  }

  /* ---------------------------------------------------------------
     5. Comparison table: Cloud / Self-hosted edition tabs
  --------------------------------------------------------------- */
  var compareRoot = document.querySelector('[data-compare]');
  if (compareRoot) {
    fetch('/data/pricing.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var tbodyHost = compareRoot.querySelector('[data-compare-body]');
        var theadRow = compareRoot.querySelector('[data-compare-head]');
        var edition = 'cloud';

        function glyph(cell) {
          if (cell === 'check') return '<svg width="18" height="18" aria-label="Included"><use href="/assets/icons/icons.svg#i-check"/></svg>';
          if (cell === 'dash') return '<svg width="18" height="18" aria-label="Not included" style="color:#7a7a7a"><use href="/assets/icons/icons.svg#i-dash"/></svg>';
          return '<span>' + esc(cell) + '</span>';
        }

        function paintHead() {
          if (!theadRow) return;
          var html = '<tr><th scope="col"><span class="ds-sr-only">Feature</span></th>';
          data.comparison.plans.forEach(function (p) {
            html += '<th scope="col">' + esc(p) + '</th>';
          });
          theadRow.innerHTML = html + '</tr>';
        }

        function paint() {
          if (!tbodyHost) return;
          var html = '';
          data.comparison.groups.forEach(function (g) {
            html += '<tr class="ds-compare__group"><td colspan="' + (data.comparison.plans.length + 1) + '">' + esc(g.title) + '</td></tr>';
            var rows = g.editions[edition] || g.editions.cloud;
            rows.forEach(function (row) {
              html += '<tr><th scope="row">' + esc(row.label) + '</th>';
              row.cells.forEach(function (cell) {
                html += '<td>' + glyph(cell) + '</td>';
              });
              html += '</tr>';
            });
          });
          tbodyHost.innerHTML = html;
          // Color check glyphs.
          tbodyHost.querySelectorAll('td svg').forEach(function (s) {
            if (s.getAttribute('aria-label') === 'Included') s.style.color = '#ff9b26';
          });
        }

        compareRoot.querySelectorAll('[data-edition-tab]').forEach(function (tab) {
          tab.addEventListener('click', function () {
            edition = tab.getAttribute('data-edition-tab');
            compareRoot.querySelectorAll('[data-edition-tab]').forEach(function (t) {
              t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
            });
            paint();
          });
        });

        paintHead();
        paint();
      })
      .catch(function () { /* static fallback rows remain in HTML */ });
  }

  /* ---------------------------------------------------------------
     6. FAQ accordion render from data/faq.json
  --------------------------------------------------------------- */
  var faqHost = document.querySelector('[data-faq]');
  if (faqHost) {
    fetch('/data/faq.json')
      .then(function (r) { return r.json(); })
      .then(function (items) {
        var html = '';
        items.forEach(function (item, i) {
          var btnId = 'faq-btn-' + i, panelId = 'faq-panel-' + i;
          html += '<div class="ds-accordion__item">' +
            '<button class="ds-accordion__button" data-accordion-btn id="' + btnId + '" aria-expanded="false" aria-controls="' + panelId + '">' +
            '<span>' + esc(item.q) + '</span>' +
            '<svg class="ds-accordion__icon" width="20" height="20" aria-hidden="true"><use href="/assets/icons/icons.svg#i-plus"/></svg>' +
            '</button>' +
            '<div class="ds-accordion__panel" id="' + panelId + '" role="region" aria-labelledby="' + btnId + '"><div>' +
            '<div class="ds-accordion__body"><p style="margin:0">' + esc(item.a) + '</p></div>' +
            '</div></div></div>';
        });
        faqHost.innerHTML = html;
      })
      .catch(function () {
        faqHost.innerHTML = '<p class="ds-muted">FAQ content could not be loaded. Please check your connection and reload.</p>';
      });
  }

  /* ---------------------------------------------------------------
     7. Case-study modal: full stories for the placeholder brands
  --------------------------------------------------------------- */
  var caseData = {
    'meridian': {
      title: 'Meridian Grocers',
      metric: '1,400 hours saved per quarter',
      body: 'Meridian Grocers, a fictional regional grocery chain, replaced a patchwork of spreadsheets and nightly CSV emails with Flowmint workflows. Inventory counts now sync from store systems every hour, out-of-stock alerts reach managers in minutes, and the ops team reclaimed roughly 1,400 hours a quarter. "We stopped babysitting data and started acting on it," says their fictional COO. (Illustrative demo story.)'
    },
    'atlas': {
      title: 'Atlas Freight',
      metric: '$2.1M in prevented losses',
      body: 'Atlas Freight, a fictional logistics company, routes every shipment exception through a Flowmint triage agent. The agent enriches alerts with weather, traffic, and customer priority, then pages the right dispatcher. In the demo narrative this cut missed-delivery penalties dramatically — about $2.1M in prevented losses in year one. (Illustrative demo story.)'
    }
  };
  var caseModal = document.querySelector('[data-case-modal]');
  document.addEventListener('click', function (ev) {
    var opener = ev.target.closest('[data-case-open]');
    if (opener && caseModal) {
      ev.preventDefault();
      var d = caseData[opener.getAttribute('data-case-open')];
      if (!d) return;
      caseModal.querySelector('[data-case-title]').textContent = d.title;
      caseModal.querySelector('[data-case-metric]').textContent = d.metric;
      caseModal.querySelector('[data-case-body]').textContent = d.body;
      caseModal.setAttribute('data-open', 'true');
      document.body.style.overflow = 'hidden';
      return;
    }
    if (ev.target.closest('[data-case-close]') || ev.target === caseModal) {
      if (caseModal) {
        caseModal.setAttribute('data-open', 'false');
        document.body.style.overflow = '';
      }
    }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && caseModal && caseModal.getAttribute('data-open') === 'true') {
      caseModal.setAttribute('data-open', 'false');
      document.body.style.overflow = '';
    }
  });
})();
