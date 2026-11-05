const IEC_RESULTS_URL = 'https://results.elections.org.za/dashboards/lge/MapsJason/2026/EEID1887LiteMapsNational.js';

const numeric = value => value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
export function normalizeResults(data) {
  if (!data || !Array.isArray(data.PartyBallotResults) || !data.ReportDate || numeric(data.VDExpected) === null || Number(data.VDExpected) <= 0) throw new Error('Invalid IEC response');
  const summary = data.PartyBallotResults.find(p => Number(p.RegisteredVoters) > 0) || {};
  const fields = {
    registeredVoters: summary.RegisteredVoters, totalVotesCast: summary.TotalVotesCast,
    validVotesCast: summary.ValidVotesCast, spoiltVotes: summary.SpoiltVotes,
    votingDistrictsComplete: data.VDsComplete, votingDistrictsExpected: data.VDExpected,
    wardsComplete: data.WardsComplete, wardsExpected: data.WardExpected,
    municipalitiesComplete: data.MuncipalitiesComplete, municipalitiesExpected: data.MunicExpected,
    seatsComplete: data.SeatsComplete, seatsExpected: data.SeatsExpected,
    hungCouncils: data.HungCouncils, drawnCouncils: data.DeadLockDrawnCouncils,
    controlledCouncils: data.MajorityCouncils
  };
  const result = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, numeric(value)]));
  result.councilsPending = result.municipalitiesExpected !== null && result.municipalitiesComplete !== null ? Math.max(0, result.municipalitiesExpected - result.municipalitiesComplete) : null;
  result.reportDate = data.ReportDate;
  result.countComplete = ['votingDistricts', 'municipalities', 'seats'].every(key => result[key + 'Expected'] > 0 && result[key + 'Complete'] !== null && result[key + 'Complete'] >= result[key + 'Expected']);
  result.parties = data.PartyBallotResults.map(p => ({
    id: p.ID, name: String(p.Name || 'Unknown'), votes: numeric(p.TotalValidVotes),
    support: numeric(p.PercOfVotes), seats: numeric(p.TotalSeatsWon),
    councilsLeading: numeric(p.CouncilsWon), councilsControlled: numeric(p.MajorityWon)
  })).sort((a, b) => (b.votes || 0) - (a.votes || 0));
  return result;
}

export default async function handler(request, response) {
  try {
    const upstream = await fetch(`${IEC_RESULTS_URL}?t=${Date.now()}`, {
      headers: { Accept: 'application/json', Referer: 'https://results.elections.org.za/dashboards/lge/' },
      cache: 'no-store', signal: AbortSignal.timeout(15000)
    });
    if (!upstream.ok) throw new Error(`IEC returned ${upstream.status}`);
    const data = await upstream.json();
    const payload = { ...normalizeResults(data), source: 'https://results.elections.org.za/dashboards/lge/', fetchedAt: new Date().toISOString(),
      provinces: (data.ProvinceResults || []).map(p => ({ id: p.ProvinceID, name: p.Province, ...normalizeResults(p) })) };
    response.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=60');
    response.status(200).json(payload);
  } catch {
    response.setHeader('Cache-Control', 'no-store');
    response.status(502).json({ error: 'Official IEC results are temporarily unavailable.' });
  }
}
