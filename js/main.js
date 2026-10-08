// Delaware Run Farm — shared site behavior (vanilla JS, no build step)

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initFaqAccordions();
  initFilterChips();
  initFormspreeForms();
  initGuestStepper();
  initBookingSummary();
});

// ---- Mobile nav ----
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}

// ---- FAQ accordions (.faq-item > .faq-q + .faq-a) ----
function initFaqAccordions() {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    if (!q) return;
    q.addEventListener('click', () => item.classList.toggle('open'));
  });
}

// ---- Filter chips (data-filter-group / data-filter-target) ----
// Chips with [data-filter] inside a [data-filter-group]; filterable cards
// carry [data-status] (or data-category). "All"/no value chip clears it.
function initFilterChips() {
  document.querySelectorAll('[data-filter-group]').forEach((group) => {
    const targetSelector = group.getAttribute('data-filter-group');
    const chips = group.querySelectorAll('.filter-chip');
    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        // Queried fresh on every click, not cached at page load, since
        // cards for this group can be rendered later from the sheet
        // (after DOMContentLoaded already ran once).
        const cards = document.querySelectorAll(targetSelector);
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        const value = chip.getAttribute('data-filter');
        cards.forEach((card) => {
          const matches = !value || value === 'all' || card.getAttribute('data-status') === value;
          card.style.display = matches ? '' : 'none';
        });
      });
    });
  });
}

// ---- Formspree-backed forms ----
// Any <form data-formspree> submits via fetch to its own action URL and
// shows an inline status message instead of navigating away. Replace
// each form's action="https://formspree.io/f/XXXXXXX" with the farm's
// real Formspree endpoint before going live.
function initFormspreeForms() {
  document.querySelectorAll('form[data-formspree]').forEach((form) => {
    const status = form.querySelector('.form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.textContent : null;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
      if (status) { status.className = 'form-status'; status.textContent = ''; }

      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' },
        });
        if (resp.ok) {
          form.reset();
          if (status) {
            status.textContent = form.getAttribute('data-success') || "Got it — we'll be in touch soon.";
            status.className = 'form-status show success';
          }
        } else {
          throw new Error('Form submission failed');
        }
      } catch (err) {
        if (status) {
          status.textContent = "Something went wrong sending that — please call or email us directly.";
          status.className = 'form-status show error';
        }
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    });
  });
}

// ---- Book a Stay live summary (nightly rate × nights + extras) ----
// Reads [data-checkin]/[data-checkout] inputs, [data-nightly-rate], and
// any checked [data-extra][data-extra-price] checkboxes, writing the
// result into [data-summary-*] output spans. Pure display math - the
// real total/availability is confirmed by the farm after the request
// comes in (see the page's own "no payment yet" note).
function initBookingSummary() {
  const checkin = document.querySelector('[data-checkin]');
  const checkout = document.querySelector('[data-checkout]');
  const guestsInput = document.querySelector('[data-guests]');
  const summary = document.querySelector('[data-booking-summary]');
  if (!checkin || !checkout || !summary) return;

  const rate = Number(summary.getAttribute('data-nightly-rate') || 0);
  const extras = Array.from(document.querySelectorAll('[data-extra]'));

  function recalc() {
    const inDate = checkin.value ? new Date(checkin.value) : null;
    const outDate = checkout.value ? new Date(checkout.value) : null;
    let nights = 0;
    if (inDate && outDate && outDate > inDate) {
      nights = Math.round((outDate - inDate) / (1000 * 60 * 60 * 24));
    }

    const datesEl = summary.querySelector('[data-summary-dates]');
    const guestsEl = summary.querySelector('[data-summary-guests]');
    const nightsEl = summary.querySelector('[data-summary-nights]');
    const extrasEl = summary.querySelector('[data-summary-extras]');
    const totalEl = summary.querySelector('[data-summary-total]');

    if (datesEl) datesEl.textContent = (inDate && outDate) ? `${checkin.value} → ${checkout.value}` : 'Pick your dates';
    if (guestsEl && guestsInput) guestsEl.textContent = guestsInput.value;
    if (nightsEl) nightsEl.textContent = `${nights} nights`;

    let extrasTotal = 0;
    const activeLabels = [];
    extras.forEach((box) => {
      if (box.checked) {
        const price = Number(box.getAttribute('data-extra-price') || 0);
        extrasTotal += price;
        activeLabels.push(box.getAttribute('data-extra-label') || 'Extra');
      }
    });
    if (extrasEl) extrasEl.textContent = activeLabels.length ? activeLabels.join(', ') : 'None yet';

    const total = nights * rate + extrasTotal;
    if (totalEl) totalEl.textContent = `$${total.toLocaleString()}`;
  }

  [checkin, checkout, guestsInput, ...extras].forEach((el) => {
    if (el) el.addEventListener('change', recalc);
  });
  recalc();
}

// ---- Guest +/- stepper (Book a Stay page) ----
function initGuestStepper() {
  document.querySelectorAll('[data-stepper]').forEach((stepper) => {
    const input = stepper.querySelector('input');
    const min = Number(input?.min || 1);
    const max = Number(input?.max || 10);
    stepper.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dir = btn.getAttribute('data-step') === 'inc' ? 1 : -1;
        const next = Math.min(max, Math.max(min, Number(input.value) + dir));
        input.value = next;
        input.dispatchEvent(new Event('change'));
      });
    });
  });
}
