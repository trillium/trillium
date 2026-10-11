#!/usr/bin/env node
// Date-boundary and freshness tests for the daily rowing sync:
//   - the data cutoff is the previous America/Los_Angeles calendar day
//   - rows logged after the cutoff never leak into the drawn window
//   - of the two UTC crons, exactly one is the 3:00 AM LA run, across DST
//   - both SVGs carry the cutoff in data-as-of and the freshness check notices staleness
// Run: node tests/schedule.test.js   (also runs in the sync workflow before generation)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { cutoffLA, todayLA, resolveAsOf, parseRows, computeStats } = require('../scripts/lib/rowing-data');
const { shouldRun, intendedUtcHour } = require('../scripts/should-run-now');
const { svgAsOf, freshnessProblems } = require('../scripts/check-rowing-freshness');
const { renderRunner } = require('../scripts/runner');
const { renderSVG } = require('../scripts/generate-rowing-svg');

let checks = 0;
const eq = (actual, expected, label) => { assert.deepStrictEqual(actual, expected, label); checks++; };
const at = (iso) => new Date(iso);

// --- Cutoff = previous LA calendar day ---
// PDT (UTC-7): LA midnight is 07:00Z.
eq(cutoffLA(at('2026-10-10T10:00:00Z')), '2026-10-09', 'PDT 3 AM run draws through yesterday');
eq(cutoffLA(at('2026-10-10T06:59:59Z')), '2026-10-08', 'PDT 11:59:59 PM still the previous day');
eq(cutoffLA(at('2026-10-10T07:00:00Z')), '2026-10-09', 'PDT local midnight rolls the cutoff');
// PST (UTC-8): LA midnight is 08:00Z.
eq(cutoffLA(at('2026-01-15T11:00:00Z')), '2026-01-14', 'PST 3 AM run draws through yesterday');
eq(cutoffLA(at('2026-01-15T07:59:59Z')), '2026-01-13', 'PST 11:59:59 PM still the previous day');
eq(cutoffLA(at('2026-01-15T08:00:00Z')), '2026-01-14', 'PST local midnight rolls the cutoff');
// The UTC date is ahead of LA for most of the evening; month/year edges follow LA.
eq(cutoffLA(at('2026-12-01T03:00:00Z')), '2026-11-29', 'UTC already Dec 1, LA still Nov 30');
eq(cutoffLA(at('2027-01-01T11:00:00Z')), '2026-12-31', 'year boundary');
// DST transitions (2026-03-08 spring forward, 2026-11-01 fall back) don't skip or repeat a day.
eq(cutoffLA(at('2026-03-08T10:00:00Z')), '2026-03-07', 'spring-forward day, 3 AM PDT');
eq(cutoffLA(at('2026-03-09T10:00:00Z')), '2026-03-08', 'day after spring-forward');
eq(cutoffLA(at('2026-11-01T11:00:00Z')), '2026-10-31', 'fall-back day, 3 AM PST');
eq(cutoffLA(at('2026-11-02T11:00:00Z')), '2026-11-01', 'day after fall-back');
eq(todayLA(at('2026-10-10T10:00:00Z')), '2026-10-10', 'todayLA is the LA date');
eq(resolveAsOf({ today: '2026-03-01' }), '2026-02-28', '--today pretends the current day; data ends the day before');
eq(resolveAsOf({}, at('2026-10-10T10:00:00Z')), '2026-10-09', 'default as-of is the cutoff');

// --- Schedule gate: crons are '0 10 * * *' (PDT 3 AM) and '0 11 * * *' (PST 3 AM) ---
const CRON_PDT = '0 10 * * *';
const CRON_PST = '0 11 * * *';
const gate = (cron, iso) => shouldRun('schedule', cron, at(iso));
// Summer: only the 10:00Z cron runs.
eq(gate(CRON_PDT, '2026-07-01T10:17:00Z'), true, 'PDT: 10Z cron runs');
eq(gate(CRON_PST, '2026-07-01T11:17:00Z'), false, 'PDT: 11Z cron is skipped');
// Winter: only the 11:00Z cron runs.
eq(gate(CRON_PDT, '2026-01-15T10:17:00Z'), false, 'PST: 10Z cron is skipped');
eq(gate(CRON_PST, '2026-01-15T11:17:00Z'), true, 'PST: 11Z cron runs');
// Transition days: spring-forward 10Z is exactly 3 AM PDT; fall-back 11Z is 3 AM PST.
eq(gate(CRON_PDT, '2026-03-08T10:05:00Z'), true, 'spring-forward day: 10Z cron runs');
eq(gate(CRON_PST, '2026-03-08T11:05:00Z'), false, 'spring-forward day: 11Z cron skipped');
eq(gate(CRON_PDT, '2026-11-01T10:05:00Z'), false, 'fall-back day: 10Z cron (2 AM PST) skipped');
eq(gate(CRON_PST, '2026-11-01T11:05:00Z'), true, 'fall-back day: 11Z cron runs');
// A heavily delayed run is still the intended one (decision is not tied to the wall clock hour).
eq(gate(CRON_PDT, '2026-07-01T11:50:00Z'), true, 'delayed PDT run still counts');
// Exactly one cron proceeds on every day of a full year.
for (let t = at('2026-01-01T12:00:00Z'); t < at('2027-01-01T12:00:00Z'); t = new Date(t.getTime() + 86400000)) {
  const runs = [CRON_PDT, CRON_PST].filter((c) => shouldRun('schedule', c, t)).length;
  assert.strictEqual(runs, 1, `exactly one cron runs on ${t.toISOString().slice(0, 10)}`);
}
checks++;
eq(intendedUtcHour(at('2026-07-01T12:00:00Z')), 10, 'summer 3 AM LA = 10Z');
eq(intendedUtcHour(at('2026-12-01T12:00:00Z')), 11, 'winter 3 AM LA = 11Z');
// Manual and push runs are never gated.
eq(shouldRun('workflow_dispatch', undefined, at('2026-07-01T20:00:00Z')), true, 'dispatch always runs');
eq(shouldRun('push', undefined, at('2026-07-01T20:00:00Z')), true, 'push always runs');

// --- Rows after the cutoff are excluded; the cutoff day itself is complete ---
const days = parseRows([
  '2026-10-07T06:30:00-07:00',
  '2026-10-08T06:30:00-07:00',
  '2026-10-10T01:00:00-07:00', // logged "today" (after the 2026-10-09 cutoff)
].join('\n'));
const asOf = '2026-10-09';
const stats = computeStats(days, asOf, 7);
eq(stats.status.has('2026-10-10'), false, 'today is not in the window');
eq(stats.windowRows, 2, 'a row logged after the cutoff is not counted');
eq(stats.status.get('2026-10-09').status !== 'pending', true, 'cutoff day has a final status');
eq(stats.status.get('2026-10-09').count, 0, 'cutoff day with no row has no rows');
eq(stats.status.get('2026-10-09').status, 'missed', 'unrowed cutoff day is a miss when no rest day is banked');
// Cutoff day with a banked rest day holds the streak instead of breaking it.
const banked = computeStats(parseRows('2026-10-07\n2026-10-07\n2026-10-08'), asOf, 7);
eq(banked.status.get('2026-10-09').status, 'rest', 'unrowed cutoff day uses the rest-day bank');
eq(banked.streakActive, true, 'streak survives on the banked rest day');

// --- Generated SVGs carry the cutoff; the freshness check catches staleness ---
const fixture = parseRows(fs.readFileSync(path.join(__dirname, 'fixtures', 'rows-2026-08-22.txt'), 'utf8'));
const yearSvg = renderSVG(computeStats(fixture, '2026-08-22', 365));
const runnerSvg = renderRunner(fixture, '2026-08-22').svg;
eq(svgAsOf(yearSvg), '2026-08-22', 'rowing.svg records its cutoff');
eq(svgAsOf(runnerSvg), '2026-08-22', 'rowing-runner.svg records its cutoff');
assert.ok(!/NaN|undefined|pending|not yet rowed/.test(yearSvg), 'rowing.svg has no placeholder text'); checks++;
assert.ok(!yearSvg.includes('→ today'), 'rowing.svg does not claim the streak runs to today'); checks++;
const files = [{ name: 'rowing.svg', svg: yearSvg }, { name: 'rowing-runner.svg', svg: runnerSvg }];
eq(freshnessProblems(files, '2026-08-22'), [], 'fresh SVGs pass');
eq(freshnessProblems(files, '2026-08-23').length, 2, 'stale SVGs are flagged');
eq(freshnessProblems([{ name: 'x.svg', svg: '<svg></svg>' }], '2026-08-22').length, 1, 'SVG without data-as-of is flagged');

console.log(`✓ ${checks} checks passed`);
