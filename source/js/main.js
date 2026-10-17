/* ==========================================================================
   Flowmint — main.js
   Product build · 2026-10-17
   --------------------------------------------------------------------------
   Global chrome: header hide-on-scroll, dropdown nav, mobile drawer,
   scroll reveals, auth modal, lead-capture forms (POST /api/forms).
   Original code; no framework.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. Header hide-on-scroll (300ms transform per design system)
  --------------------------------------------------------------- */
  var header = document.querySelector('[data-site-header]');
  if (header) {
    var lastY = window.scrollY;
    var ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      // Always visible near the top; hide when scrolling down past 240px.
      if (y < 240 || y < lastY - 4) {
        header.classList.remove('ds-header--hidden');
      } else if (y > lastY + 4) {
        header.classList.add('ds-header--hidden');
        closeAllDropdowns();
      }
      lastY = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     2. Dropdown nav: chevron toggles panel, label navigates.
        Outside-click + Escape close. Keyboard: Enter/Space toggle,
        Escape closes and returns focus to the toggle.
  --------------------------------------------------------------- */
  var dropdownItems = Array.prototype.slice.call(
    document.querySelectorAll('.ds-nav__item[data-dropdown]')
  );

  function closeAllDropdowns(except) {
    dropdownItems.forEach(function (item) {
      if (item !== except) setDropdown(item, false);
    });
  }

  function setDropdown(item, open) {
    item.setAttribute('data-open', open ? 'true' : 'false');
    var toggle = item.querySelector('[data-dropdown-toggle]');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  dropdownItems.forEach(function (item) {
    var toggle = item.querySelector('[data-dropdown-toggle]');
    var labelLink = item.querySelector('.ds-nav__link[href]');
    if (!toggle) return;

    toggle.addEventListener('click', function (ev) {
      ev.preventDefault();
      var isOpen = item.getAttribute('data-open') === 'true';
      closeAllDropdowns(item);
      setDropdown(item, !isOpen);
    });

    toggle.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        setDropdown(item, false);
        toggle.focus();
      }
    });

    // Clicking the label link navigates; keep the panel closed.
    if (labelLink) {
      labelLink.addEventListener('click', function () { closeAllDropdowns(); });
    }

    // Close when focus leaves the whole item.
    item.addEventListener('focusout', function (ev) {
      if (!item.contains(ev.relatedTarget)) setDropdown(item, false);
    });
  });

  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('.ds-nav__item[data-dropdown]')) closeAllDropdowns();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      closeAllDropdowns();
      closeModal();
      closeDrawer();
    }
  });

  /* ---------------------------------------------------------------
     3. Mobile drawer with accordion submenus
  --------------------------------------------------------------- */
  var drawer = document.querySelector('[data-drawer]');
  var burger = document.querySelector('[data-drawer-open]');
  var drawerClose = document.querySelector('[data-drawer-close]');

  function openDrawer() {
    if (!drawer) return;
    drawer.setAttribute('data-open', 'true');
    drawer.inert = false;
    document.body.style.overflow = 'hidden';
    if (burger) burger.setAttribute('aria-expanded', 'true');
    if (drawerClose) drawerClose.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.setAttribute('data-open', 'false');
    drawer.inert = true;
    document.body.style.overflow = '';
    if (burger) burger.setAttribute('aria-expanded', 'false');
  }
  if (drawer && drawer.getAttribute('data-open') !== 'true') drawer.inert = true;
  if (burger) burger.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawer) {
    drawer.addEventListener('click', function (ev) {
      if (ev.target === drawer) closeDrawer();
      var accToggle = ev.target.closest('[data-drawer-acc]');
      if (accToggle) {
        var expanded = accToggle.getAttribute('aria-expanded') === 'true';
        accToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        var panel = document.getElementById(accToggle.getAttribute('aria-controls'));
        if (panel) panel.hidden = expanded;
      }
    });
  }

  /* ---------------------------------------------------------------
     4. Scroll reveals (IntersectionObserver, staggered via CSS vars)
  --------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('.ds-reveal');
  if ('IntersectionObserver' in window && !prefersReduced && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------------------------
     5. Auth modal (Get Started / Sign in) — front-end demo stub.
        Clearly marked: no account is created in this static replica.
  --------------------------------------------------------------- */
  var modalBackdrop = document.querySelector('[data-auth-modal]');
  var lastFocused = null;

  function openModal(mode) {
    if (!modalBackdrop) return;
    lastFocused = document.activeElement;
    setAuthMode(mode || 'signup');
    modalBackdrop.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    var first = modalBackdrop.querySelector('input');
    if (first) first.focus();
  }
  function closeModal() {
    if (!modalBackdrop || modalBackdrop.getAttribute('data-open') !== 'true') return;
    modalBackdrop.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }
  function setAuthMode(mode) {
    var tabs = modalBackdrop.querySelectorAll('.ds-modal__tab');
    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-auth-tab') === mode;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    var signupForm = modalBackdrop.querySelector('[data-form="auth-signup"]');
    var signinForm = modalBackdrop.querySelector('[data-form="auth-signin"]');
    if (signupForm) signupForm.hidden = mode !== 'signup';
    if (signinForm) signinForm.hidden = mode !== 'signin';
  }

  document.addEventListener('click', function (ev) {
    var opener = ev.target.closest('[data-auth-open]');
    if (opener) {
      ev.preventDefault();
      openModal(opener.getAttribute('data-auth-open'));
      return;
    }
    if (ev.target.closest('[data-auth-close]')) { closeModal(); return; }
    if (ev.target === modalBackdrop) { closeModal(); return; }
    var tab = ev.target.closest('[data-auth-tab]');
    if (tab && modalBackdrop && modalBackdrop.contains(tab)) {
      setAuthMode(tab.getAttribute('data-auth-tab'));
    }
  });

  /* ---------------------------------------------------------------
     6. Lead-capture forms: validate client-side, POST to the real
        /api/forms endpoint, then show an honest success state that
        promises only what the endpoint actually did (store the lead).
        If the API is unreachable (static-host deploy), say so plainly.
  --------------------------------------------------------------- */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldError(input, message) {
    var field = input.closest('.ds-field');
    if (!field) return;
    var err = field.querySelector('.ds-field__error');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (err) err.textContent = message || '';
  }

  function validateForm(form) {
    var ok = true;
    var inputs = form.querySelectorAll('[data-validate]');
    inputs.forEach(function (input) {
      var rules = (input.getAttribute('data-validate') || '').split(' ');
      var val = input.value.trim();
      var msg = '';
      if (rules.indexOf('required') !== -1 && !val) {
        msg = 'This field is required.';
      } else if (rules.indexOf('email') !== -1 && val && !emailRe.test(val)) {
        msg = 'Enter a valid email address.';
      } else if (rules.indexOf('min8') !== -1 && val && val.length < 8) {
        msg = 'Use at least 8 characters.';
      }
      setFieldError(input, msg);
      if (msg) ok = false;
    });
    return ok;
  }

  // Success copy per form. Every line promises only what the endpoint
  // actually does: record the submission. No invented replies, no
  // invented accounts, no invented emails.
  var leadCopy = {
    'newsletter': {
      title: 'You are on the list.',
      body: 'Thanks for subscribing — your email is saved. Expect product news and template drops, about once a month.'
    },
    'contact': {
      title: 'Message received.',
      body: 'Thanks for reaching out — your message has been saved and will be reviewed.'
    },
    'signup': {
      title: 'Request received.',
      body: 'Thanks — your details are saved. We will email you when your workspace is ready.'
    },
    'signin': {
      title: 'Request received.',
      body: 'Thanks — your request is saved. Live accounts are not open yet; we will email you when sign-in opens.'
    },
    'waitlist': {
      title: 'You are on the waitlist.',
      body: 'Thanks — your spot is saved. We will email you when the creator program opens.'
    },
    'request-integration': {
      title: 'Request received.',
      body: 'Thanks — your integration request is saved. Popular requests shape which connectors we build next.'
    }
  };

  function showFormResult(form, title, body, isError) {
    var wrap = form.closest('[data-form-wrap]') || form.parentElement;
    var box = document.createElement('div');
    box.className = 'ds-form-success' + (isError ? ' ds-form-success--error' : '');
    box.setAttribute('role', isError ? 'alert' : 'status');
    var strong = document.createElement('strong');
    strong.textContent = title;
    var span = document.createElement('span');
    span.textContent = body;
    box.appendChild(strong);
    box.appendChild(span);
    form.replaceWith(box);
    if (wrap && wrap.scrollIntoView) {
      wrap.scrollIntoView({ block: 'nearest', behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  }

  function leadSubmit(form, kind) {
    var copy = leadCopy[kind] || { title: 'Received.', body: 'Thanks — your submission has been saved.' };
    var btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.setAttribute('data-label', btn.textContent);
      btn.textContent = 'Sending…';
    }

    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name && !el.disabled && (el.type !== 'submit' && el.type !== 'button')) {
        data[el.name] = el.value;
      }
    });

    function restoreBtn() {
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.getAttribute('data-label') || btn.textContent;
      }
    }

    var done = false;
    var timeout = setTimeout(function () {
      if (!done) {
        done = true;
        restoreBtn();
        showFormResult(form, 'Could not send.',
          'We could not reach our server just now. Please check your connection and try again — nothing was saved.', true);
      }
    }, 12000);

    fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form: kind, payload: data })
    }).then(function (r) {
      return r.json().then(function (jsonBody) {
        return { status: r.status, body: jsonBody };
      });
    }).then(function (res) {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      if (res.status === 200 && res.body && res.body.ok) {
        showFormResult(form, copy.title, copy.body, false);
      } else if (res.status === 429) {
        restoreBtn();
        showFormResult(form, 'Slow down a little.',
          'Too many requests from this connection. Please wait a few minutes and try again — nothing was saved.', true);
      } else {
        restoreBtn();
        var msg = (res.body && res.body.error) || 'Something went wrong on our side.';
        showFormResult(form, 'Could not send.', msg + ' Nothing was saved — please try again.', true);
      }
    }).catch(function () {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      restoreBtn();
      showFormResult(form, 'Could not send.',
        'We could not reach our server just now. Please check your connection and try again — nothing was saved.', true);
    });
  }

  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-lead-form')) return;
    ev.preventDefault();
    if (!validateForm(form)) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }
    leadSubmit(form, form.getAttribute('data-lead-form'));
  });

  // Live-clear field errors as the user types.
  document.addEventListener('input', function (ev) {
    var input = ev.target;
    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
      if (input.getAttribute('aria-invalid') === 'true') setFieldError(input, '');
    }
  });

  /* ---------------------------------------------------------------
     7. Footer year + star-count pill (static demo figure, documented)
  --------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Expose for components.js / data.js
  window.Flowmint = window.Flowmint || {};
  window.Flowmint.closeAllDropdowns = closeAllDropdowns;
  window.Flowmint.prefersReduced = prefersReduced;
  window.Flowmint.leadSubmit = leadSubmit;
  window.Flowmint.validateForm = validateForm;
})();
