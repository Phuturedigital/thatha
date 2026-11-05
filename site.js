/* THATHA website progressive enhancements. */
(function () {
  'use strict';

  /* ---- mobile nav ------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    var closeMenu = function (restoreFocus) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      if (restoreFocus) toggle.focus();
    };
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && links.classList.contains('open')) closeMenu(true);
    });
    document.addEventListener('click', function (event) {
      if (!event.target.closest('.nav')) closeMenu(false);
    });
    window.matchMedia('(max-width: 1120px)').addEventListener('change', function () { closeMenu(false); });
  }

  /* ---- IEC dashboard: refresh without a site redeploy ------------------ */
  var results = document.querySelector('[data-election-results]');
  if (results) {
    var resultStatus = results.querySelector('[data-results-status]');
    var resultUpdated = results.querySelector('[data-results-updated]');
    var area = results.querySelector('[data-results-area]');
    var number = new Intl.NumberFormat('en-ZA');
    var latestData = null;
    var loadingResults = false;
    var lastRefreshFailed = false;
    var formatNumber = function (value) { return value === null || value === undefined ? '—' : number.format(value); };
    var element = function (tag, text, className) {
      var node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (className) node.className = className;
      return node;
    };
    var renderResults = function () {
      var data = latestData;
      var selected = area.value === 'national' ? data : data.provinces.find(function (p) { return String(p.id) === area.value; });
      if (!selected) { area.value = 'national'; selected = data; }
      results.querySelector('[data-results-location]').textContent = selected.name || 'South Africa';
      results.querySelectorAll('[data-result]').forEach(function (node) { node.textContent = formatNumber(selected[node.dataset.result]); });
      var parties = results.querySelector('[data-party-results]');
      parties.replaceChildren();
      selected.parties.forEach(function (party) {
        var row = element('div', undefined, 'party-row');
        var heading = element('div', undefined, 'party-heading');
        heading.append(element('strong', party.name), element('span', party.support === null ? '—' : party.support.toFixed(2) + '%'));
        var bar = element('meter');
        bar.min = 0; bar.max = 100; bar.value = Math.min(100, Math.max(0, party.support || 0));
        bar.setAttribute('aria-label', party.name + ' share of valid votes');
        row.append(heading, bar, element('small', formatNumber(party.votes) + ' votes · ' + formatNumber(party.seats) + ' seats · Leading ' + formatNumber(party.councilsLeading) + ' councils · Controlling ' + formatNumber(party.councilsControlled)));
        parties.append(row);
      });
      var progress = results.querySelector('[data-count-progress]');
      progress.replaceChildren();
      [['Voting districts', 'votingDistricts'], ['Wards', 'wards'], ['Municipalities', 'municipalities'], ['Seats allocated', 'seats']].forEach(function (entry) {
        var done = selected[entry[1] + 'Complete'];
        var expected = selected[entry[1] + 'Expected'];
        var percent = expected > 0 && done !== null ? Math.min(100, done / expected * 100) : null;
        var row = element('div', undefined, 'count-row');
        var heading = element('div', undefined, 'party-heading');
        heading.append(element('strong', entry[0]), element('span', percent === null ? '—' : percent.toFixed(1) + '%'));
        var bar = element('progress'); bar.max = 100;
        if (percent !== null) bar.value = percent;
        bar.setAttribute('aria-label', entry[0] + ' complete');
        row.append(heading, bar, element('small', formatNumber(done) + ' of ' + formatNumber(expected)));
        progress.append(row);
      });
      var reportTime = new Date(selected.reportDate);
      resultUpdated.textContent = Number.isNaN(reportTime.getTime()) ? 'IEC report time unavailable.' : 'IEC report: ' + reportTime.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg' }) + ' SAST';
      var old = Date.now() - new Date(data.reportDate).getTime() > 15 * 60 * 1000;
      resultStatus.textContent = (data.countComplete ? 'Count and seat allocation complete — see IEC for certification.' : 'Counting in progress · Results may change.') + (old ? ' The IEC report is over 15 minutes old; showing the latest published figures.' : ' Automatically checking for updates.');
      if (lastRefreshFailed) resultStatus.textContent = 'Refresh failed — showing the last successful update. Retrying automatically; check the IEC dashboard for the latest results.';
      resultStatus.classList.toggle('live', !old && !lastRefreshFailed);
      document.querySelector('[data-count-label]').textContent = data.countComplete ? 'Count complete' : 'Results are coming in';
    };
    var loadResults = async function () {
      if (loadingResults) return;
      loadingResults = true;
      try {
        var response = await fetch(results.getAttribute('data-endpoint'), { headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error('IEC unavailable');
        var data = await response.json();
        if (!Array.isArray(data.parties) || !Array.isArray(data.provinces)) throw new Error('Invalid results');
        var previousArea = area.value;
        area.replaceChildren(element('option', 'South Africa'));
        area.firstChild.value = 'national';
        data.provinces.forEach(function (province) { var option = element('option', province.name); option.value = province.id; area.append(option); });
        area.value = previousArea;
        latestData = data;
        lastRefreshFailed = false;
        renderResults();
      } catch {
        lastRefreshFailed = true;
        resultStatus.textContent = latestData ? 'Refresh failed — figures below are from the last successful update. Retrying automatically; check the IEC dashboard for the latest results.' : 'Official results are temporarily unavailable. Retrying automatically; open the IEC dashboard below for the latest count.';
        resultStatus.classList.remove('live');
      } finally { loadingResults = false; }
    };
    area.addEventListener('change', function () { if (latestData) renderResults(); });
    loadResults();
    setInterval(loadResults, 120000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) loadResults(); });
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
