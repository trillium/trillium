#!/usr/bin/env node
// Generates images/rowing-runner.svg — a side-scroller view of the last 90 days
// of rowing. Thin entry shim; the scene lives in scripts/runner/ (composer,
// layout, timeline, and one file per visual layer).
// Run by .github/workflows/sync-profile.yml; locally: node scripts/generate-rowing-runner-svg.js
// Options: --today=YYYY-MM-DD (default: today in America/Los_Angeles)
//          --rows-file=path   (default: fetch from the row_tracker repo)

const fs = require('fs');
const path = require('path');
const { todayLA, loadDays, parseArgs } = require('./lib/rowing-data');
const { renderRunner } = require('./runner');

const OUT_FILE = path.join(__dirname, '..', 'images', 'rowing-runner.svg');

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const days = await loadDays(args);
  const asOf = args.today || todayLA();
  const { svg, stats } = renderRunner(days, asOf);
  console.log(`Runner window: ${stats.windowRows} rows / ${stats.windowDaysRowed} days since ${stats.windowStart}`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, svg);
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
