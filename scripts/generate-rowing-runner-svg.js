#!/usr/bin/env node
// Generates images/rowing-runner.svg — a side-scroller view of the last 90 days
// of rowing. Time scrolls right-to-left past a fixed rower who rides a terrain
// line of the pace standing (rows this year minus day of year): +1 climbs,
// misses fall. Below the terrain, each day prints its row --dry style glyph
// (+ / ++ / ~ / -). One full pass of the animation is capped at RUN_SECONDS,
// each day an equal slice of it. Data via scripts/lib/rowing-data.js.
// Run by .github/workflows/sync-profile.yml; locally: node scripts/generate-rowing-runner-svg.js
// Options: --today=YYYY-MM-DD (default: today in America/Los_Angeles)
//          --rows-file=path   (default: fetch from the row_tracker repo)

const fs = require('fs');
const path = require('path');
const {
  parseDay, dayISO, addDays, todayLA, fmtShort,
  computeStats, loadDays, parseArgs, PALETTE: C,
} = require('./lib/rowing-data');

const OUT_FILE = path.join(__dirname, '..', 'images', 'rowing-runner.svg');
const WINDOW = 90;        // days in the level
const RUN_SECONDS = 60;   // full animation duration cap (scroll + hold)
const HOLD_PCT = 8;       // % of the loop spent parked at "today" before restart

function renderSVG(s) {
  const W = 560, H = 232;
  const pitch = 14, worldX0 = 12;
  const yTop = 74, yBot = 156, tapeY = 184;
  const clipX = 10, clipW = W - 20;

  const asOf = parseDay(s.asOfISO);
  const start = parseDay(s.windowStart);
  const days = [];
  for (let d = start, i = 0; d <= asOf; d = addDays(d, 1), i++) {
    const iso = dayISO(d);
    days.push({ iso, i, ...(s.status.get(iso) || { status: 'missed', count: 0, standing: null }) });
  }
  // Days before the log started have no standing; carry the first known one back.
  const firstKnown = days.find((d) => d.standing !== null)?.standing ?? 0;
  let carry = firstKnown;
  for (const d of days) {
    if (d.standing === null) d.standing = carry;
    carry = d.standing;
  }

  const standings = days.map((d) => d.standing);
  const lo = Math.min(...standings), hi = Math.max(...standings);
  const span = Math.max(hi - lo, 4);
  const yOf = (v) => yBot - ((v - lo) / span) * (yBot - yTop);
  const xOf = (i) => worldX0 + i * pitch;

  // Character parked over a day column; the world scrolls so it rides from
  // rideStart to the final day. Scroll is linear, so every day gets an equal
  // slice of the run time.
  const charX = 432;
  const rideStart = Math.round((charX - worldX0) / pitch);
  const lastI = days.length - 1;
  const scrollDist = xOf(lastI) - charX;
  const scrollPct = 100 - HOLD_PCT;

  const terrain = days.map((d) => `${xOf(d.i)},${yOf(d.standing).toFixed(1)}`).join(' ');
  const area = `M ${xOf(0)} ${yBot + 8} L ${terrain.replace(/ /g, ' L ')} L ${xOf(lastI)} ${yBot + 8} Z`;

  // Streak span overlay on the terrain (clamped to the window).
  let streakOverlay = '';
  if (s.streak) {
    const sIso = dayISO(s.streak.start), eIso = dayISO(s.streak.end);
    const seg = days.filter((d) => d.iso >= sIso && d.iso <= eIso);
    if (seg.length > 1) {
      const pts = seg.map((d) => `${xOf(d.i)},${yOf(d.standing).toFixed(1)}`).join(' ');
      streakOverlay = `<polyline class="glow" points="${pts}" fill="none" stroke="${C.streak}" stroke-width="3" stroke-linecap="round"/>`;
    }
  }

  // The row --dry glyph tape.
  const glyphs = days.map((d) => {
    const g = { rowed: '+'.repeat(Math.min(d.count, 3)), rest: '~', missed: '-', pending: '?' }[d.status];
    const color = { rowed: C.green2, rest: C.yellow, missed: C.red, pending: C.muted }[d.status];
    return `<text x="${xOf(d.i)}" y="${tapeY}" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${g}<title>${d.iso}: ${d.status}${d.count > 1 ? ` ×${d.count}` : ''} · pace ${d.standing >= 0 ? '+' : ''}${d.standing}</title></text>`;
  });

  // Month markers inside the world.
  const markers = days
    .filter((d) => d.iso.endsWith('-01'))
    .map((d) =>
      `<line x1="${xOf(d.i)}" y1="${yTop - 10}" x2="${xOf(d.i)}" y2="${tapeY + 6}" stroke="${C.empty}" stroke-width="1"/>` +
      `<text x="${xOf(d.i) + 4}" y="${yTop - 12}" font-size="9" fill="${C.muted}">${parseDay(d.iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`
    );

  // Character ride keyframes: y follows the terrain at each day boundary.
  const rideFrames = [];
  for (let i = rideStart; i <= lastI; i++) {
    const pct = (scrollPct * (i - rideStart)) / (lastI - rideStart);
    rideFrames.push(`${pct.toFixed(2)}% { transform: translateY(${(yOf(days[i].standing) - yBot).toFixed(1)}px) }`);
  }
  rideFrames.push(`100% { transform: translateY(${(yOf(days[lastI].standing) - yBot).toFixed(1)}px) }`);

  // "On pace" line, only when zero is inside the plotted range.
  const zeroLine = lo <= 0 && hi >= 0
    ? `<line x1="${clipX}" y1="${yOf(0).toFixed(1)}" x2="${clipX + clipW}" y2="${yOf(0).toFixed(1)}" stroke="${C.muted}" stroke-width="1" stroke-dasharray="3 5" opacity="0.6"/>` +
      `<text x="${clipX + 4}" y="${(yOf(0) - 4).toFixed(1)}" font-size="9" fill="${C.muted}">on pace</text>`
    : '';

  const today = days[lastI];
  const pace = today.standing > 0
    ? { text: `📈 ${today.standing} ahead of pace`, color: C.green2 }
    : today.standing < 0
      ? { text: `📉 ${-today.standing} behind pace`, color: C.red }
      : { text: '📊 exactly on pace', color: C.text };
  const headline = s.streak
    ? `<text class="pulse" x="${W - 16}" y="34" text-anchor="end" font-size="16" font-weight="bold" fill="${C.yellow}">🔥 ${s.streak.ds}d · ${s.streak.rs}r</text>`
    : '';

  function wave(y, amp, wl) {
    let p = `M ${clipX - wl * 2} ${y}`;
    for (let x = clipX - wl * 2; x < clipX + clipW + wl * 2; x += wl) {
      p += ` q ${wl / 4} ${-amp} ${wl / 2} 0 q ${wl / 4} ${amp} ${wl / 2} 0`;
    }
    return p;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif" role="img" aria-label="Row Runner: last ${days.length} days of rowing as a side-scroller">
  <title>Row Runner — the last ${days.length} days scroll past; the rower rides the pace line (${pace.text.replace(/^..\s/, '')})</title>
  <style>
    .world { animation: scroll ${RUN_SECONDS}s linear infinite; }
    @keyframes scroll { 0% { transform: translateX(0) } ${scrollPct}% { transform: translateX(-${scrollDist.toFixed(1)}px) } 100% { transform: translateX(-${scrollDist.toFixed(1)}px) } }
    .ride { animation: ride ${RUN_SECONDS}s linear infinite; }
    @keyframes ride { ${rideFrames.join(' ')} }
    .bob { animation: bob 2s ease-in-out infinite; }
    @keyframes bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }
    .pulse { animation: pulse 2.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
    .wave1 { animation: drift 6s linear infinite; }
    .wave2 { animation: drift 9s linear infinite reverse; }
    @keyframes drift { from { transform: translateX(0) } to { transform: translateX(-44px) } }
    .glow { animation: glow 2.4s ease-in-out infinite; }
    @keyframes glow { 0%,100% { stroke-opacity: .95 } 50% { stroke-opacity: .4 } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${C.bg}" stroke="${C.border}"/>
  <text x="16" y="34" font-size="18" font-weight="bold" fill="${C.title}">🕹️ Row Runner — last ${days.length} days</text>
  ${headline}

  <clipPath id="view"><rect x="${clipX}" y="46" width="${clipW}" height="${tapeY - 36}"/></clipPath>
  <g clip-path="url(#view)">
    ${zeroLine}
    <g class="world">
      <path d="${area}" fill="${C.green1}" fill-opacity="0.18"/>
      <polyline points="${terrain}" fill="none" stroke="${C.green2}" stroke-width="2" stroke-linejoin="round"/>
      ${streakOverlay}
      ${markers.join('\n      ')}
      ${glyphs.join('\n      ')}
    </g>
    <path class="wave1" d="${wave(166, 3, 44)}" fill="none" stroke="${C.water}" stroke-width="2"/>
    <path class="wave2" d="${wave(172, 2.5, 44)}" fill="none" stroke="${C.waterHi}" stroke-width="1.5" opacity="0.45"/>
    <g transform="translate(${charX} ${yBot})"><g class="ride"><g class="bob"><text x="0" y="-8" text-anchor="middle" font-size="20">🚣</text></g></g></g>
  </g>

  <text x="16" y="${H - 14}" font-size="12" fill="${C.text}">${s.windowRows} rows in ${days.length} days · <tspan font-weight="bold" fill="${pace.color}">${pace.text}</tspan></text>
  <text x="${W - 16}" y="${H - 14}" text-anchor="end" font-size="11" fill="${C.muted}"><tspan fill="${C.green2}">+</tspan> row · <tspan fill="${C.yellow}">~</tspan> rest · <tspan fill="${C.red}">-</tspan> miss</text>
</svg>
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const days = await loadDays(args);
  const asOf = args.today || todayLA();
  const stats = computeStats(days, asOf, WINDOW);
  console.log(`Runner window: ${stats.windowRows} rows / ${stats.windowDaysRowed} days since ${stats.windowStart}`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, renderSVG(stats));
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
