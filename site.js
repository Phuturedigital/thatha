/* THATHA website progressive enhancements.
   Every content page remains usable without JavaScript. This script adds the
   mobile navigation and submits the enquiry form without leaving the page. */
(function () {
  'use strict';

  /* ---- mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    links.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- enquiry form ----------------------------------------------------- */
  var form = document.querySelector('form[data-enquiry-form]');
  var out = document.getElementById('form-result');
  if (!form || !out) return;

  /* Deep links elsewhere on the site carry ?interest=Pro etc. */
  var wanted = new URLSearchParams(location.search).get('interest');
  var select = form.elements.interest;
  if (wanted && select) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) {
        select.selectedIndex = i;
        break;
      }
    }
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function showResult(title, message, isError, mailto) {
    var box = el('div', 'note-box');
    box.setAttribute('role', isError ? 'alert' : 'status');
    box.appendChild(el('b', null, title));
    box.appendChild(document.createTextNode(' ' + message));

    if (mailto) {
      var row = el('div', 'btn-row mt-s');
      var send = el('a', 'btn btn-primary btn-sm', 'Email THATHA');
      send.setAttribute('href', mailto);
      row.appendChild(send);
      box.appendChild(row);
    }

    out.replaceChildren(box);
    out.hidden = false;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    out.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function emailFallback(data) {
    var lines = [];
    data.forEach(function (value, key) {
      if (key !== 'website' && String(value).trim()) lines.push(key + ': ' + value);
    });
    return 'mailto:hello@thatha.co.za'
      + '?subject=' + encodeURIComponent('THATHA enquiry — ' + (data.get('interest') || 'General'))
      + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) return;

    var submit = form.querySelector('button[type="submit"]');
    var data = new FormData(form);
    var payload = {};
    data.forEach(function (value, key) { payload[key] = value; });

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    out.hidden = true;

    try {
      var response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var result = await response.json().catch(function () { return {}; });

      if (!response.ok) throw new Error(result.error || 'The enquiry service is unavailable.');

      form.reset();
      showResult(
        'Enquiry sent.',
        'Thank you. The THATHA team will reply within two working days.',
        false
      );
    } catch (error) {
      showResult(
        'Your enquiry could not be sent.',
        'Please try again or send the same details by email.',
        true,
        emailFallback(data)
      );
    } finally {
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
    }
  });
})();
