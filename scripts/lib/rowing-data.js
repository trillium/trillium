// Shared rowing-log parsing and stats for the profile SVG generators.
// The rest-day bank streak rule is ported from row_tracker's row.sh (the
// authority on the rule's semantics); verified against its compute_streaks.

const ROWS_URL = 'https://raw.githubusercontent.com/trillium/row_tracker/main/rows.txt';

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
function dayOfYear(d) {
  return diffDays(d, parseDay(`${dayISO(d).slice(0, 4)}-01-01`)) + 1;
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
// Walks the whole log, recording for every day in the trailing window:
//   status   'rowed' | 'rest' | 'missed' | 'pending'
//   count    rows that day
//   standing rows-this-year-to-date minus day-of-year (row.sh's pace number)
// plus the span of the most recent streak (current if alive, else last done).

function computeStats(days, asOfISO, windowDays) {
  const asOf = parseDay(asOfISO);
  const windowStart = addDays(asOf, -(windowDays - 1));

  const st = { ds: 0, rs: 0, bank: 0, prevCred: 0, curCred: 0, year: null };
  const status = new Map();
  let yearRows = 0;
  let streakStart = null;
  let lastStreak = null;
  let lastStepped = null;

  function yearReset(y) {
    if (st.year !== null && y !== st.year) {
      if (st.ds > 0) lastStreak = { start: streakStart, end: lastStepped, ds: st.ds, rs: st.rs };
      st.ds = st.rs = st.bank = st.prevCred = st.curCred = 0;
      streakStart = null;
      yearRows = 0;
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
    yearRows += count;
    if (d >= windowStart && d <= asOf) {
      const s = count > 0 ? 'rowed' : (st.ds > 0 && st.bank > 0 ? 'rest' : 'missed');
      status.set(dayISO(d), { status: s, count, standing: yearRows - dayOfYear(d) });
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
    if (prev < asOf) {
      yearReset(asOfISO.slice(0, 4));
      status.set(asOfISO, { status: 'pending', count: 0, standing: yearRows - dayOfYear(asOf) });
    }
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

async function loadDays(args) {
  const fs = require('fs');
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
  return days;
}

function parseArgs(argv) {
  return Object.fromEntries(
    argv.filter((a) => a.startsWith('--')).map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );
}

const PALETTE = {
  bg: '#282a36', border: '#ffd200', title: '#f40082', text: '#f8f8f2',
  muted: '#9ba0b0', empty: '#363949', green1: '#2f9e4f', green2: '#50fa7b',
  yellow: '#ffd200', red: '#ff5555', streak: '#f40082',
  water: '#6272a4', waterHi: '#8be9fd',
};

module.exports = {
  parseDay, dayISO, addDays, diffDays, dayOfYear, todayLA, fmtShort,
  parseRows, computeStats, loadDays, parseArgs, PALETTE,
};
