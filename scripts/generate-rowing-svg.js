#!/usr/bin/env node
// Generates images/rowing.svg — an animated heatmap of the last year of rowing,
// with the most recent streak's span highlighted. Day statuses come from
// scripts/lib/rowing-data.js (rest-day bank rule ported from row.sh).
// Run by .github/workflows/sync-profile.yml; locally: node scripts/generate-rowing-svg.js
// Options: --today=YYYY-MM-DD (default: today in America/Los_Angeles)
//          --rows-file=path   (default: fetch from the row_tracker repo)

const fs = require('fs');
const path = require('path');
const {
  parseDay, dayISO, addDays, diffDays, todayLA, fmtShort,
  computeStats, loadDays, parseArgs, PALETTE: C,
} = require('./lib/rowing-data');

const OUT_FILE = path.join(__dirname, '..', 'images', 'rowing.svg');
const YEAR_WINDOW = 365;

function renderSVG(s) {
  const cell = 8, pitch = 10, x0 = 16, gridY = 66;
  const asOf = parseDay(s.asOfISO);
  const start = parseDay(s.windowStart);
  const firstCol = addDays(start, -start.getUTCDay()); // back to Sunday
  const cols = Math.floor(diffDays(asOf, firstCol) / 7) + 1;
  const W = x0 * 2 + cols * pitch;
  const H = 196;

  const inStreak = (iso) =>
    s.streak && iso >= dayISO(s.streak.start) && iso <= dayISO(s.streak.end);

  const cells = [];
  const monthLabels = [];
  // The window starts mid-month, so skip labeling that partial month — its label
  // would crowd out the first full month's.
  let lastMonth = start.getUTCDate() === 1 ? null : start.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  let lastLabelCol = -3;
  for (let d = start; d <= asOf; d = addDays(d, 1)) {
    const iso = dayISO(d);
    const col = Math.floor(diffDays(d, firstCol) / 7);
    const row = d.getUTCDay();
    const x = x0 + col * pitch, y = gridY + row * pitch;

    const m = d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    if (m !== lastMonth && col > lastLabelCol + 2 && col < cols - 2) {
      monthLabels.push(`<text x="${x}" y="${gridY - 8}" font-size="9" fill="${C.muted}">${m}</text>`);
      lastLabelCol = col;
    }
    lastMonth = m;

    const info = s.status.get(iso) || { status: 'missed', count: 0 };
    const rowedFill = info.count >= 3 ? C.green2 : info.count === 2 ? C.greenMid : C.green1;
    const fill = { rowed: rowedFill, rest: C.yellow, missed: C.empty, pending: C.empty }[info.status];
    const label = { rowed: `rowed${info.count > 1 ? ` ×${info.count}` : ''}`, rest: 'rest day (streak held)', missed: 'no row', pending: 'today — not yet rowed' }[info.status];
    const streakCls = inStreak(iso) ? ' streak' : '';
    const pending = info.status === 'pending' ? ` stroke="${C.muted}" stroke-dasharray="2 2"` : '';
    cells.push(
      `<rect class="cell${streakCls}" style="animation-delay:${col * 14}ms" x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${fill}"${pending}>` +
      `<title>${iso}: ${label}</title></rect>`
    );
  }

  const streakLine = s.streak
    ? `${s.streakActive ? 'Current' : 'Last'} streak: ${fmtShort(dayISO(s.streak.start))} → ${s.streakActive ? 'today' : fmtShort(dayISO(s.streak.end))} · ${s.streak.ds} days · ${s.streak.rs} rows · bank ${s.bank}`
    : 'No streak yet';
  const headline = s.streak
    ? `<text class="pulse" x="${W - x0}" y="34" text-anchor="end" font-size="16" font-weight="bold" fill="${C.yellow}">🔥 ${s.streak.ds}d · ${s.streak.rs}r</text>`
    : '';

  const legendY = H - 16;
  const legend = [
    `<rect x="${x0}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.green1}"/>`,
    `<rect x="${x0 + 10}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.greenMid}"/>`,
    `<rect x="${x0 + 20}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.green2}"/>`,
    `<text x="${x0 + 34}" y="${legendY}" font-size="10" fill="${C.muted}">rowed ×1/2/3+</text>`,
    `<rect x="${x0 + 96}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.yellow}"/>`,
    `<text x="${x0 + 110}" y="${legendY}" font-size="10" fill="${C.muted}">rest (streak held)</text>`,
    `<rect x="${x0 + 210}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.empty}"/>`,
    `<text x="${x0 + 224}" y="${legendY}" font-size="10" fill="${C.muted}">no row</text>`,
    `<rect x="${x0 + 276}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.empty}" stroke="${C.streak}"/>`,
    `<text x="${x0 + 290}" y="${legendY}" font-size="10" fill="${C.muted}">streak span</text>`,
  ].join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif" role="img" aria-label="Rowing: ${s.windowRows} rows in the last year">
  <title>Rowing — ${s.windowRows} rows across ${s.windowDaysRowed} days in the last year</title>
  <style>
    .pulse { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
    .cell { animation: sweep .5s ease-out both; }
    @keyframes sweep { from { opacity: 0 } }
    .streak { stroke: ${C.streak}; stroke-width: 1.5; animation: sweep .5s ease-out both, glow 2.4s ease-in-out infinite; }
    @keyframes glow { 0%,100% { stroke-opacity: 1 } 50% { stroke-opacity: .35 } }
    .fadein { animation: fade .9s ease-out .6s both; }
    @keyframes fade { from { opacity: 0 } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <text x="${x0}" y="34" font-size="18" font-weight="bold" fill="${C.title}">🚣 Rowing — last 365 days</text>
  ${headline}
  ${monthLabels.join('\n  ')}
  ${cells.join('\n  ')}
  <text class="fadein" x="${x0}" y="${H - 34}" font-size="12" fill="${C.text}">${s.windowRows} rows across ${s.windowDaysRowed} days · <tspan fill="${C.yellow}">${streakLine}</tspan></text>
  ${legend}
</svg>
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const days = await loadDays(args);
  const asOf = args.today || todayLA();
  const stats = computeStats(days, asOf, YEAR_WINDOW);
  const sk = stats.streak
    ? `${stats.streakActive ? 'current' : 'last'} streak ${stats.streak.ds}d/${stats.streak.rs}r from ${dayISO(stats.streak.start)} (bank ${stats.bank})`
    : 'no streak';
  console.log(`Last year: ${stats.windowRows} rows / ${stats.windowDaysRowed} days · ${sk}`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, renderSVG(stats));
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
