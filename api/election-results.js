const IEC_RESULTS_URL = 'https://results.elections.org.za/dashboards/lge/MapsJason/2026/EEID1887LiteMapsNational.js';

export default async function handler(request, response) {
  try {
    const upstream = await fetch(`${IEC_RESULTS_URL}?t=${Date.now()}`, {
      headers: {
        Accept: 'application/json,text/plain,*/*',
        Referer: 'https://results.elections.org.za/dashboards/lge/',
        'User-Agent': 'Mozilla/5.0 (compatible; THATHA Election Information/1.0; +https://www.thathamove.org.za/election)'
      },
      cache: 'no-store'
    });
    if (!upstream.ok) throw new Error(`IEC returned ${upstream.status}`);

    const data = await upstream.json();
    const summary = Array.isArray(data.PartyBallotResults) ? data.PartyBallotResults[0] || {} : {};
    const payload = {
      source: IEC_RESULTS_URL,
      reportDate: data.ReportDate || null,
      registeredVoters: Number(summary.RegisteredVoters || 0),
      totalVotesCast: Number(summary.TotalVotesCast || 0),
      validVotesCast: Number(summary.ValidVotesCast || 0),
      spoiltVotes: Number(summary.SpoiltVotes || 0),
      votingDistrictsComplete: Number(data.VDsComplete || 0),
      votingDistrictsExpected: Number(data.VDExpected || 0),
      wardsComplete: Number(data.WardsComplete || 0),
      wardsExpected: Number(data.WardExpected || 0),
      municipalitiesComplete: Number(data.MuncipalitiesComplete || 0),
      municipalitiesExpected: Number(data.MunicExpected || 0),
      percentVotingDistrictsComplete: Number(data.Perc_VDsComplete || 0)
    };
    payload.isFinal = payload.votingDistrictsExpected > 0 &&
      payload.votingDistrictsComplete >= payload.votingDistrictsExpected;

    response.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
    response.status(200).json(payload);
  } catch (error) {
    response.setHeader('Cache-Control', 'no-store');
    response.status(502).json({ error: 'Official IEC results are temporarily unavailable.' });
  }
}
