import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// Import as a data module to test the exact Vercel handler without package changes.
const source = await readFile(new URL('../api/election-results.js', import.meta.url), 'utf8');
const { default: handler, normalizeResults } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const fixture = { ReportDate: '2026-11-05T10:00:00+02:00', VDExpected: 10, VDsComplete: 5, WardExpected: 4, WardsComplete: 2, MunicExpected: 3, MuncipalitiesComplete: 2, SeatsExpected: 12, SeatsComplete: 8, HungCouncils: 1, DeadLockDrawnCouncils: 0, MajorityCouncils: 1, PartyBallotResults: [
 { ID: 1, Name: 'Party A', TotalValidVotes: 100, PercOfVotes: 25, TotalSeatsWon: 2, CouncilsWon: 1, MajorityWon: 0, RegisteredVoters: 500, TotalVotesCast: 410, ValidVotesCast: 400, SpoiltVotes: 10 },
 { ID: 2, Name: 'Party B', TotalValidVotes: 300, PercOfVotes: 75, TotalSeatsWon: 6, CouncilsWon: 1, MajorityWon: 1 }
] };
const result = normalizeResults(fixture);
assert.equal(result.parties[0].name, 'Party B');
assert.equal(result.parties[1].councilsLeading, 1);
assert.equal(result.parties[1].councilsControlled, 0);
assert.equal(result.councilsPending, 1);
assert.equal(result.countComplete, false);
assert.equal(normalizeResults({ ...fixture, VDsComplete: 10 }).countComplete, false, 'Votes captured does not mean seats allocated');
assert.equal(normalizeResults({ ...fixture, VDsComplete: 10, MuncipalitiesComplete: 3, SeatsComplete: 12 }).countComplete, true);
assert.equal(normalizeResults({ ...fixture, HungCouncils: null }).hungCouncils, null);
assert.throws(() => normalizeResults({}));
const originalFetch = globalThis.fetch;
let status, body, headers = {};
const response = { setHeader: (k,v) => headers[k]=v, status: code => {status=code;return response;}, json: value => {body=value;} };
globalThis.fetch = async () => ({ok:true,json:async()=>({...fixture,ProvinceResults:[{...fixture,ProvinceID:1,Province:'Example'}]})});
await handler({},response);
assert.equal(status,200); assert.equal(body.provinces[0].name,'Example'); assert.ok(body.fetchedAt);
globalThis.fetch = async () => {throw Error('offline');};
await handler({},response);
assert.equal(status,502); assert.equal(headers['Cache-Control'],'no-store'); assert.ok(body.error);
globalThis.fetch=originalFetch;
console.log('PASS: ranking, council distinctions, missing values, count completion, provinces and upstream failure');
