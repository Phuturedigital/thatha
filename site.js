/* THATHA demo site — progressive enhancement only.
   Every page works with JS disabled; this adds the mobile nav and gives the
   enquiry form an honest outcome (there is no backend on a demo deploy, so
   rather than silently swallowing the submission we say so and hand the
   visitor a pre-filled mailto).
   The result panel is built with DOM nodes and textContent rather than
   innerHTML, so user-entered values can never be parsed as markup. */
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
    // Close when a link is chosen, so in-page anchors don't leave the menu up.
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---- enquiry form ----------------------------------------------------- */
  var form = document.querySelector('form[data-demo-form]');
  var out = document.getElementById('form-result');
  if (!form || !out) return;

  /* Deep links elsewhere on the site carry ?interest=Pro etc. Preselect it,
     but only when the value is one the <select> actually offers. */
  var wanted = new URLSearchParams(location.search).get('interest');
  var select = form.elements.interest;
  if (wanted && select) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) { select.selectedIndex = i; break; }
    }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var data = new FormData(form);
    var lines = [];
    data.forEach(function (value, key) {
      if (String(value).trim()) lines.push(key + ': ' + value);
    });

    var mailto = 'mailto:hello@thatha.co.za'
      + '?subject=' + encodeURIComponent('THATHA enquiry — ' + (data.get('interest') || 'General'))
      + '&body=' + encodeURIComponent(lines.join('\n'));

    var box = el('div', 'note-box');
    box.setAttribute('role', 'status');
    box.appendChild(el('b', null, 'Nothing was sent.'));
    box.appendChild(document.createTextNode(
      ' This is a demo build with no server attached, so the form cannot deliver '
      + 'your details. Your answers have been packaged into an email instead — '
      + 'press the button to open it in your mail app.'
    ));

    var row = el('div', 'btn-row mt-s');
    var send = el('a', 'btn btn-primary btn-sm', 'Open pre-filled email');
    send.setAttribute('href', mailto);
    row.appendChild(send);
    box.appendChild(row);

    out.replaceChildren(box);
    out.hidden = false;
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
