#!/usr/bin/env node
// Fails unless both generated rowing SVGs are drawn through the expected cutoff
// day (default: yesterday in America/Los_Angeles). Each SVG carries its cutoff
// in a data-as-of attribute. Run by .github/workflows/sync-profile.yml right
// after generation; locally: node scripts/check-rowing-freshness.js [--expect=YYYY-MM-DD]

const fs = require('fs');
const path = require('path');
const { cutoffLA, parseArgs } = require('./lib/rowing-data');

const IMAGES = ['rowing.svg', 'rowing-runner.svg'].map((f) => path.join(__dirname, '..', 'images', f));

function svgAsOf(svg) {
  const m = svg.match(/<svg\b[^>]*\sdata-as-of="(\d{4}-\d{2}-\d{2})"/);
  return m ? m[1] : null;
}

// Returns a list of problems (empty when fresh).
function freshnessProblems(files, expected) {
  return files.flatMap(({ name, svg }) => {
    const asOf = svgAsOf(svg);
    if (asOf === null) return [`${name}: no data-as-of attribute`];
    if (asOf !== expected) return [`${name}: drawn through ${asOf}, expected ${expected}`];
    return [];
  });
}

function main() {
  const expected = parseArgs(process.argv.slice(2)).expect || cutoffLA();
  const files = IMAGES.map((f) => ({ name: path.basename(f), svg: fs.readFileSync(f, 'utf8') }));
  const problems = freshnessProblems(files, expected);
  if (problems.length) {
    problems.forEach((p) => console.error(`✗ ${p}`));
    process.exit(1);
  }
  console.log(`✓ rowing.svg and rowing-runner.svg are drawn through ${expected}`);
}

if (require.main === module) main();

module.exports = { svgAsOf, freshnessProblems };
