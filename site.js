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
      if (document.body.classList.contains('election-archived')) return;
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

  /* ---- official IEC election results --------------------------------- */
  var results = document.querySelector('[data-election-results]');
  if (results) {
    var resultStatus = results.querySelector('[data-results-status]');
    var resultUpdated = results.querySelector('[data-results-updated]');
    var number = new Intl.NumberFormat('en-ZA');
    var setResult = function (name, text) {
      var node = results.querySelector('[data-result="' + name + '"]');
      if (node) node.textContent = text;
    };
    var loadResults = function () {
      fetch(results.getAttribute('data-endpoint'), { headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error('Official results are unavailable');
          return response.json();
        })
        .then(function (data) {
          setResult('registeredVoters', number.format(data.registeredVoters || 0));
          setResult('totalVotesCast', number.format(data.totalVotesCast || 0));
          setResult('validVotesCast', number.format(data.validVotesCast || 0));
          setResult('spoiltVotes', number.format(data.spoiltVotes || 0));
          setResult('votingDistricts', number.format(data.votingDistrictsComplete || 0) + ' / ' + number.format(data.votingDistrictsExpected || 0));
          var progress = Number(data.percentVotingDistrictsComplete || 0);
          setResult('percentVotingDistrictsComplete', progress.toLocaleString('en-ZA', { maximumFractionDigits: 1 }) + '%');

          if ((data.totalVotesCast || 0) > 0) {
            resultStatus.textContent = 'Live official count · figures update as the IEC publishes results.';
            resultStatus.classList.add('live');
          } else {
            resultStatus.textContent = 'Awaiting official results · voting closes at 21:00 on 4 November 2026.';
            resultStatus.classList.remove('live');
          }
          if (data.isFinal) {
            document.body.classList.add('election-archived');
            var electionTitle = document.querySelector('[data-election-title]');
            var electionIntro = document.querySelector('[data-election-intro]');
            var electionClock = document.querySelector('[data-election-clock]');
            if (electionTitle) electionTitle.innerHTML = 'The final<br />official result.';
            if (electionIntro) electionIntro.textContent = 'The 2026 Local Government Election count is complete. This page is retained as a neutral archive of the Electoral Commission’s final published national figures.';
            if (electionClock) {
              electionClock.querySelector('.clock-label').textContent = 'Election status';
              electionClock.querySelector('[data-clock-value]').textContent = 'Count complete';
              electionClock.querySelector('.clock-date').textContent = 'Final figures published by the IEC';
            }
            resultStatus.textContent = 'Final official IEC result · all expected voting districts are complete.';
            resultStatus.classList.add('live');
          }
          if (data.reportDate) {
            resultUpdated.textContent = 'IEC report updated ' + new Date(data.reportDate).toLocaleString('en-ZA', {
              dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Johannesburg'
            });
          }
        })
        .catch(function () {
          resultStatus.textContent = 'Official results are temporarily unavailable. Use the IEC dashboard link below for the latest published count.';
          resultStatus.classList.remove('live');
          resultUpdated.textContent = 'The figures shown here come only from the Electoral Commission of South Africa.';
        });
    };
    loadResults();
    setInterval(loadResults, 120000);
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
