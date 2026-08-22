// Row Runner composer: builds the render context and assembles the layers in
// z-order. Each layer exports render(ctx) → { css?, defs?, fixed?, viewUnder?,
// world?, viewOver? } and never reads another layer's output — shared geometry
// lives in layout.js, shared timing in timeline.js.

const {
  parseDay, dayISO, addDays, todayLA, computeStats, PALETTE,
} = require('../lib/rowing-data');
const layoutMod = require('./layout');
const { RUN_SECONDS, makeTimeline } = require('./timeline');

const LAYERS = [
  require('./layers/zones'),
  require('./layers/terrain'),
  require('./layers/tape'),
  require('./layers/water'),
  require('./layers/character'),
  require('./layers/hud'),
];

function buildDays(stats) {
  const asOf = parseDay(stats.asOfISO);
  const start = parseDay(stats.windowStart);
  const days = [];
  for (let d = start, i = 0; d <= asOf; d = addDays(d, 1), i++) {
    const iso = dayISO(d);
    days.push({ iso, i, ...(stats.status.get(iso) || { status: 'missed', count: 0, standing: null, ds: 0, rs: 0 }) });
  }
  // Days before the log started have no standing; carry the first known one back.
  const firstKnown = days.find((d) => d.standing !== null)?.standing ?? 0;
  let carry = firstKnown;
  for (const d of days) {
    if (d.standing === null) d.standing = carry;
    carry = d.standing;
  }
  return days;
}

function buildCtx(stats, layerNames) {
  const days = buildDays(stats);
  const lastI = days.length - 1;
  const { yOf, lo, hi } = layoutMod.makeYOf(days.map((d) => d.standing));
  const rideStart = Math.round((layoutMod.charX - layoutMod.worldX0) / layoutMod.pitch);
  // Two-phase camera: the world scrolls while the character holds at charX,
  // until the level's right edge reaches the viewport; then the camera parks
  // and the character travels the remaining days itself.
  const scrollMax = Math.max(0, layoutMod.xOf(lastI) - (layoutMod.clipX + layoutMod.clipW - 26));
  const scrollAt = (i) => Math.min(Math.max(0, layoutMod.xOf(i) - layoutMod.charX), scrollMax);
  const charTx = (i) => layoutMod.xOf(i) - scrollAt(i) - layoutMod.charX;
  const L = { ...layoutMod, yOf, lo, hi, rideStart, lastI, scrollMax, scrollAt, charTx };
  const T = makeTimeline(rideStart, lastI);
  return { days, stats, L, T, C: PALETTE, parseDay, dayISO, layerNames };
}

function compose(stats, { only } = {}) {
  const active = only ? LAYERS.filter((l) => only.includes(l.name)) : LAYERS;
  const ctx = buildCtx(stats, active.map((l) => l.name));
  const parts = active.map((l) => ({ name: l.name, ...l.render(ctx) }));
  const collect = (key, sep) => parts.map((p) => p[key]).filter(Boolean).join(sep);
  const { L, T } = ctx;
  const { W, H, clipX, clipY, clipW, clipH } = L;
  const paceText = parts.find((p) => p.paceText)?.paceText || '';

  // World scroll keyframes ride the same per-day clock as the character and
  // HUD; the camera parks once scrollMax is reached.
  const worldFrames = [];
  for (let i = L.rideStart; i <= L.lastI; i++) {
    worldFrames.push(`${T.dayToPct(i).toFixed(2)}% { transform: translateX(-${L.scrollAt(i).toFixed(1)}px) }`);
  }
  worldFrames.push(`100% { transform: translateX(-${L.scrollMax.toFixed(1)}px) }`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Segoe UI', Ubuntu, Helvetica, Arial, sans-serif" role="img" aria-label="Row Runner: last ${ctx.days.length} days of rowing as a side-scroller">
  <title>Row Runner — the last ${ctx.days.length} days scroll past; the rower rides the pace line${paceText ? ` (${paceText.replace(/^..\s/, '')})` : ''}</title>
  <style>
    .world { animation: world-scroll ${T.RUN_SECONDS}s linear infinite; }
    @keyframes world-scroll { ${worldFrames.join(' ')} }
    .scene { animation: scene-seam ${T.RUN_SECONDS}s linear infinite; }
    @keyframes scene-seam { 0% { opacity: .3 } 2.5% { opacity: 1 } 97.5% { opacity: 1 } 100% { opacity: .3 } }
    ${collect('css', '\n    ')}
    @media (prefers-reduced-motion: reduce) { svg *, .world, .scene { animation: none !important } }
  </style>
  ${collect('defs', '\n  ')}
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="10" fill="${ctx.C.bg}" stroke="${ctx.C.border}"/>
  <text x="16" y="34" font-size="18" font-weight="bold" fill="${ctx.C.title}">🕹️ Row Runner — last ${ctx.days.length} days</text>
  ${collect('fixed', '\n  ')}

  <clipPath id="view"><rect x="${clipX}" y="${clipY}" width="${clipW}" height="${clipH}"/></clipPath>
  <g class="scene" clip-path="url(#view)">
    ${collect('viewUnder', '\n    ')}
    <g class="world" transform="translate(-${L.scrollMax.toFixed(1)} 0)">
      ${collect('world', '\n      ')}
    </g>
    ${collect('viewOver', '\n    ')}
  </g>
</svg>
`;
}

function renderRunner(days, asOfISO, opts = {}) {
  const stats = computeStats(days, asOfISO, opts.window || 90);
  return { svg: compose(stats, opts), stats };
}

module.exports = { renderRunner, compose, LAYERS, RUN_SECONDS };
