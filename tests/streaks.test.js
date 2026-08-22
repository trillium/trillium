#!/usr/bin/env node
// Regression test for the rest-day bank streak port in scripts/lib/rowing-data.js.
// The expected values were cross-checked against row_tracker's own compute_streaks
// (row.sh embedded Python) on the frozen fixture: `41 47 6 14` as of 2026-08-22.
// Run: node tests/streaks.test.js   (also runs in the sync workflow before generation)

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseRows, computeStats } = require('../scripts/lib/rowing-data');
const { renderRunner } = require('../scripts/runner');

const fixture = path.join(__dirname, 'fixtures', 'rows-2026-08-22.txt');
const days = parseRows(fs.readFileSync(fixture, 'utf8'));
const AS_OF = '2026-08-22';
let checks = 0;
const eq = (actual, expected, label) => { assert.deepStrictEqual(actual, expected, label); checks++; };

// --- Year window: numbers verified against row.sh compute_streaks ---
const year = computeStats(days, AS_OF, 365);
eq(year.streak.ds, 41, 'day streak');
eq(year.streak.rs, 47, 'row streak');
eq(year.bank, 6, 'rest-day bank');
eq(year.streakActive, true, 'streak active');
eq(require('../scripts/lib/rowing-data').dayISO(year.streak.start), '2026-07-13', 'streak start');
eq(year.windowRows, 345, 'rows in trailing year');
eq(year.windowDaysRowed, 224, 'days rowed in trailing year');

const today = year.status.get(AS_OF);
eq(today.status, 'rowed', 'today status');
eq(today.count, 2, 'today count');
eq(today.standing, -29, 'today pace standing (rows YTD - day of year)');
eq(today.ds, 41, 'today running day streak');

// A known covered rest day holds the streak.
eq(year.status.get('2026-08-21').status, 'rest', 'covered rest day');

// --- Runner window ---
const runner = computeStats(days, AS_OF, 90);
eq(runner.windowRows, 66, 'rows in 90-day window');
eq(runner.windowDaysRowed, 47, 'days rowed in 90-day window');

// --- Render smoke: composes without NaN/undefined leaking into the SVG ---
const { svg } = renderRunner(days, AS_OF);
assert.ok(svg.includes('Row Runner'), 'runner renders title');
assert.ok(!/NaN|undefined/.test(svg), 'runner SVG has no NaN/undefined');
assert.ok(svg.includes('AUGUST'), 'zones watermark present');
assert.ok(svg.includes('🔥41d'), 'HUD final frame shows current streak');
checks += 4;

console.log(`✓ ${checks} checks passed`);
