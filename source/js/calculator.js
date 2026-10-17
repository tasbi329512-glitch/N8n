/* ==========================================================================
   Flowmint — calculator.js
   Product build (repair pass) · 2026-10-17
   --------------------------------------------------------------------------
   Pricing cost calculator: executions-per-month slider recommends the
   cheapest plan whose quota covers the volume, using data/pricing.json.
   Execution-based billing is the category's #1 buyer confusion point,
   so the recommendation cites the exact quota it matched.
   Original code; no framework.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-calculator]');
  if (!root) return;

  var slider = root.querySelector('[data-calc-slider]');
  var valueEl = root.querySelector('[data-calc-value]');
  var resultEl = root.querySelector('[data-calc-result]');
  if (!slider || !resultEl) return;

  // Discrete slider stops keep the control honest: every stop maps to a
  // real quota boundary instead of implying false precision.
  var STOPS = [2500, 5000, 10000, 25000, 40000, 100000, 200000];

  function fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 ? 1 : 0) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function pickPlan(plans, volume) {
    // plans: [{key,name,quota,annualPrice,priceLabel,custom,ctaHref,ctaLabel}]
    var sized = plans.filter(function (p) { return !p.custom && p.quota >= volume; });
    if (sized.length) {
      sized.sort(function (a, b) { return a.quota - b.quota; });
      return { plan: sized[0], over: false };
    }
    var enterprise = plans.filter(function (p) { return p.custom; })[0];
    return { plan: enterprise || null, over: true };
  }

  function render(pick, volume, symbol) {
    if (!pick.plan) {
      resultEl.innerHTML = '<p class="ds-muted">Plan data could not be loaded. See the plan cards above.</p>';
      return;
    }
    var p = pick.plan;
    var priceLine = p.custom
      ? 'Custom pricing'
      : symbol + p.annualPrice + '/mo, billed annually';
    var quotaLine = p.custom ? 'Custom execution volume' : fmt(p.quota) + ' executions / mo included';
    var cta = p.custom
      ? '<a class="ds-btn ds-btn--dark" href="/contact/">Contact sales</a>'
      : '<button class="ds-btn ds-btn--cta" data-auth-open="signup" type="button">Start free trial</button>';
    var headroom = !p.custom
      ? '<p class="ds-muted" style="font-size:.9rem;margin:.5rem 0 0">' +
        esc(fmt(volume)) + ' executions/month fits inside the ' + esc(p.name) +
        ' quota of ' + esc(fmt(p.quota)) + '/month.</p>'
      : '<p class="ds-muted" style="font-size:.9rem;margin:.5rem 0 0">' +
        esc(fmt(volume)) + ' executions/month is beyond the listed plan quotas — ' +
        'Enterprise is sized around your volume.</p>';
    resultEl.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:1.5rem;align-items:center;justify-content:space-between">' +
      '<div>' +
      '<p class="ds-eyebrow" style="margin:0 0 .35rem">Recommended plan</p>' +
      '<p class="ds-display-xxs" style="margin:0">' + esc(p.name) + '</p>' +
      '<p style="margin:.35rem 0 0"><strong>' + esc(priceLine) + '</strong> · ' + esc(quotaLine) + '</p>' +
      headroom +
      '</div>' +
      '<div>' + cta + '</div>' +
      '</div>';
  }

  function quotaNumber(plan) {
    // pricing.json quotas look like "2.5k executions / mo" or "Custom execution volume".
    var m = /([\d.]+)\s*k/i.exec(plan.quota || '');
    if (m) return Math.round(parseFloat(m[1]) * 1000);
    return Infinity; // custom
  }

  fetch('/data/pricing.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var symbol = (data.meta && data.meta.currencySymbol) || '$';
      var plans = (data.plans || []).map(function (p) {
        return {
          key: p.key,
          name: p.name,
          quota: quotaNumber(p),
          annualPrice: p.annual ? p.annual.price : null,
          custom: !!p.custom,
          priceLabel: p.priceLabel
        };
      });

      function update() {
        var volume = STOPS[Number(slider.value)] || STOPS[0];
        if (valueEl) valueEl.textContent = volume >= 200000 ? '200k+' : fmt(volume);
        render(pickPlan(plans, volume), volume, symbol);
      }

      slider.addEventListener('input', update);
      update();
    })
    .catch(function () {
      resultEl.innerHTML = '<p class="ds-muted">The calculator needs plan data to run. See the plan cards above.</p>';
      slider.disabled = true;
    });
})();
