// HUD layer: fixed chrome-level readouts — streak headline (top right) and the
// bottom stats/legend line. Will grow into the per-day ticking scoreboard.

module.exports = {
  name: 'hud',
  render(ctx) {
    const { days, stats, L, C } = ctx;
    const { W, H, lastI } = L;

    const today = days[lastI];
    const pace = today.standing > 0
      ? { text: `📈 ${today.standing} ahead of pace`, color: C.green2 }
      : today.standing < 0
        ? { text: `📉 ${-today.standing} behind pace`, color: C.red }
        : { text: '📊 exactly on pace', color: C.text };

    const headline = stats.streak
      ? `<text class="hud-pulse" x="${W - 16}" y="34" text-anchor="end" font-size="16" font-weight="bold" fill="${C.yellow}">🔥 ${stats.streak.ds}d · ${stats.streak.rs}r</text>`
      : '';

    return {
      css: `.hud-pulse { animation: hud-pulse 2.4s ease-in-out infinite; }
    @keyframes hud-pulse { 0%,100% { opacity: 1 } 50% { opacity: .55 } }`,
      fixed: `${headline}
  <text x="16" y="${H - 14}" font-size="12" fill="${C.text}">${stats.windowRows} rows in ${days.length} days · <tspan font-weight="bold" fill="${pace.color}">${pace.text}</tspan></text>
  <text x="${W - 16}" y="${H - 14}" text-anchor="end" font-size="11" fill="${C.muted}"><tspan fill="${C.green2}">+</tspan> row · <tspan fill="${C.yellow}">~</tspan> rest · <tspan fill="${C.red}">-</tspan> miss</text>`,
      paceText: pace.text,
    };
  },
};
