/* THATHA website progressive enhancements. */
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

  /* ---- election campaign clock ---------------------------------------- */
  var clock = document.querySelector('[data-election-clock]');
  if (clock) {
    var value = clock.querySelector('[data-clock-value]');
    var deadline = new Date(clock.getAttribute('data-election-date')).getTime();
    var renderClock = function () {
      var remaining = deadline - Date.now();
      if (remaining <= 0) {
        value.textContent = 'Voting closed';
        clock.querySelector('.clock-label').textContent = 'Election day complete';
        return;
      }
      var days = Math.floor(remaining / 86400000);
      var hours = Math.floor((remaining % 86400000) / 3600000);
      value.textContent = days + 'd ' + hours + 'h';
    };
    renderClock();
    setInterval(renderClock, 60000);
  }

  /* ---- enquiry form ----------------------------------------------------- */
  var form = document.querySelector('form[data-enquiry-form]');
  if (!form) return;

  /* Deep links elsewhere on the site carry ?interest=Pro etc. Preselect it,
     but only when the value is one the <select> actually offers. */
  var wanted = new URLSearchParams(location.search).get('interest');
  var select = form.elements.interest;
  if (wanted && select) {
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) { select.selectedIndex = i; break; }
    }
  }

})();
