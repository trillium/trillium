#!/usr/bin/env node
// Generates images/rowing.svg — an animated heatmap of the last year of rowing,
// with the most recent streak's span highlighted. Day statuses (rowed / covered
// rest / missed) are computed the same way `row --dry` does, via the rest-day
// bank streak rule ported from row_tracker's row.sh (the authority on the rule).
// Run by .github/workflows/sync-profile.yml; locally: node scripts/generate-rowing-svg.js
// Options: --today=YYYY-MM-DD (default: today in America/Los_Angeles)
//          --rows-file=path   (default: fetch from the row_tracker repo)

const fs = require('fs');
const path = require('path');

const ROWS_URL = 'https://raw.githubusercontent.com/trillium/row_tracker/main/rows.txt';
const OUT_FILE = path.join(__dirname, '..', 'images', 'rowing.svg');
const YEAR_WINDOW = 365;

// --- Date helpers (all math on UTC-noon Date objects to dodge DST) ---

function parseDay(iso) {
  return new Date(`${iso}T12:00:00Z`);
}
function dayISO(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}
function diffDays(a, b) {
  return Math.round((a - b) / 86400000);
}
function todayLA() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
}
function fmtShort(iso) {
  return parseDay(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

// --- Log parsing ---

function parseRows(text) {
  const days = new Map();
  for (const line of text.split('\n')) {
    const s = line.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = s.slice(0, 10);
      days.set(d, (days.get(d) || 0) + 1);
    }
  }
  return days;
}

// --- Streak walk (port of the rest-day bank rule in row.sh) ---
// Walks the whole log, recording a status for every day in the trailing-year
// window and the span of the most recent streak (current if alive, otherwise
// the last completed one).

function computeStats(days, asOfISO) {
  const asOf = parseDay(asOfISO);
  const windowStart = addDays(asOf, -(YEAR_WINDOW - 1));

  const st = { ds: 0, rs: 0, bank: 0, prevCred: 0, curCred: 0, year: null };
  const status = new Map(); // iso -> {status, count}
  let streakStart = null;   // start of the streak currently being walked
  let lastStreak = null;    // most recently *completed* streak {start, end, ds, rs}
  let lastStepped = null;   // last day fed through step()

  function yearReset(y) {
    if (st.year !== null && y !== st.year) {
      if (st.ds > 0) lastStreak = { start: streakStart, end: lastStepped, ds: st.ds, rs: st.rs };
      st.ds = st.rs = st.bank = st.prevCred = st.curCred = 0;
      streakStart = null;
    }
    st.year = y;
  }

  function step(d, count) {
    if (count > 0) {
      if (st.ds === 0) {
        st.ds = 1;
        st.rs = count;
        st.bank = st.prevCred + count - 1;
        st.curCred = count - 1;
        st.prevCred = 0;
        streakStart = d;
      } else {
        st.ds += 1;
        st.rs += count;
        st.bank += count - 1;
        st.curCred += count - 1;
      }
    } else if (st.ds > 0 && st.bank > 0) {
      st.bank -= 1;
      st.ds += 1;
    } else {
      if (st.ds > 0) {
        st.prevCred = st.curCred;
        st.curCred = 0;
        lastStreak = { start: streakStart, end: lastStepped, ds: st.ds, rs: st.rs };
      }
      st.ds = st.rs = st.bank = 0;
      streakStart = null;
    }
    lastStepped = d;
  }

  function visit(d, count) {
    yearReset(dayISO(d).slice(0, 4));
    if (d >= windowStart && d <= asOf) {
      const s = count > 0 ? 'rowed' : (st.ds > 0 && st.bank > 0 ? 'rest' : 'missed');
      status.set(dayISO(d), { status: s, count });
    }
    step(d, count);
  }

  const sorted = [...days.keys()].sort();
  let prev = null;
  for (const iso of sorted) {
    const d = parseDay(iso);
    if (d > asOf) break;
    if (prev !== null) {
      for (let g = addDays(prev, 1); g < d; g = addDays(g, 1)) visit(g, 0);
    }
    visit(d, days.get(iso));
    prev = d;
  }
  // Like row.sh, the as-of day itself is not stepped as a miss when it has no
  // rows — the day isn't over yet.
  if (prev !== null) {
    for (let g = addDays(prev, 1); g < asOf; g = addDays(g, 1)) visit(g, 0);
    if (prev < asOf) status.set(asOfISO, { status: 'pending', count: 0 });
  }

  const current = st.ds > 0 ? { start: streakStart, end: lastStepped, ds: st.ds, rs: st.rs } : null;
  const streak = current || lastStreak;

  let windowRows = 0, windowDaysRowed = 0;
  for (const [, info] of status) {
    if (info.count > 0) {
      windowRows += info.count;
      windowDaysRowed += 1;
    }
  }

  return {
    asOfISO,
    windowStart: dayISO(windowStart),
    windowRows,
    windowDaysRowed,
    streak,
    streakActive: current !== null,
    bank: st.bank,
    status,
  };
}

// --- SVG rendering ---

const C = {
  bg: '#282a36', border: '#ffd200', title: '#f40082', text: '#f8f8f2',
  muted: '#9ba0b0', empty: '#363949', green1: '#2f9e4f', green2: '#50fa7b',
  yellow: '#ffd200', streak: '#f40082',
};

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
    const fill = { rowed: info.count > 1 ? C.green2 : C.green1, rest: C.yellow, missed: C.empty, pending: C.empty }[info.status];
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
    `<rect x="${x0 + 10}" y="${legendY - 8}" width="8" height="8" rx="2" fill="${C.green2}"/>`,
    `<text x="${x0 + 24}" y="${legendY}" font-size="10" fill="${C.muted}">rowed / ×2+</text>`,
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

// --- Main ---

async function main() {
  const args = Object.fromEntries(
    process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );

  let text;
  if (args['rows-file']) {
    text = fs.readFileSync(args['rows-file'], 'utf8');
  } else {
    const resp = await fetch(ROWS_URL);
    if (!resp.ok) throw new Error(`Failed to fetch rows.txt: ${resp.status} ${resp.statusText}`);
    text = await resp.text();
  }

  const days = parseRows(text);
  if (days.size === 0) throw new Error('Parsed 0 rowing entries — log format may have changed.');

  const asOf = args.today || todayLA();
  const stats = computeStats(days, asOf);
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
