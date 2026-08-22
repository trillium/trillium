// HUD layer: the top-right scoreboard that ticks through the run — date, pace
// standing, and the live streak counter — one pre-rendered frame per day,
// flipped by opacity keyframes on the shared timeline. During the end-of-loop
// hold it parks on today's values, and that final frame is also the static
// default (what prefers-reduced-motion viewers see). Bottom stats line and
// glyph legend live here too.

module.exports = {
  name: 'hud',
  render(ctx) {
    const { days, stats, L, T, C } = ctx;
    const { W, H, rideStart, lastI } = L;
    const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

    const frames = [];
    const css = [];
    for (let i = rideStart; i <= lastI; i++) {
      const d = days[i];
      const from = T.dayToPct(i);
      const to = i === lastI ? 100 : T.dayToPct(i + 1);
      const date = ctx.parseDay(d.iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
      const paceColor = d.standing > 0 ? C.green2 : d.standing < 0 ? C.red : C.text;
      const pace = `${d.standing > 0 ? '+' : ''}${d.standing}`;
      const streak = d.ds > 0 ? `🔥${String(d.ds).padStart(2, ' ')}d` : '·  0d';
      const last = i === lastI;

      const kf = last
        ? (from <= 0
          ? `0%,100% { opacity: 1 }`
          : `0%,${(from - 0.01).toFixed(2)}% { opacity: 0 } ${from.toFixed(2)}%,100% { opacity: 1 }`)
        : (from <= 0
          ? `0%,${(to - 0.01).toFixed(2)}% { opacity: 1 } ${to.toFixed(2)}%,100% { opacity: 0 }`
          : `0%,${(from - 0.01).toFixed(2)}% { opacity: 0 } ${from.toFixed(2)}%,${(to - 0.01).toFixed(2)}% { opacity: 1 } ${to.toFixed(2)}%,100% { opacity: 0 }`);
      css.push(`.hud-f${i} { animation: hud-f${i} ${T.RUN_SECONDS}s linear infinite; }
    @keyframes hud-f${i} { ${kf} }`);

      frames.push(
        `<text class="hud-f${i}" style="opacity:${last ? 1 : 0}" x="${W - 16}" y="33" text-anchor="end" font-size="14" font-weight="bold" font-family="${mono}">` +
        `<tspan fill="${C.muted}">${date}</tspan>` +
        `<tspan fill="${paceColor}" dx="10">${pace}</tspan>` +
        `<tspan fill="${C.yellow}" dx="10">${streak}</tspan>` +
        `</text>`
      );
    }

    const today = days[lastI];
    const pace = today.standing > 0
      ? { text: `📈 ${today.standing} ahead of pace`, color: C.green2 }
      : today.standing < 0
        ? { text: `📉 ${-today.standing} behind pace`, color: C.red }
        : { text: '📊 exactly on pace', color: C.text };
    const streakNote = stats.streak
      ? ` · 🔥 ${stats.streak.ds}-day streak${stats.streakActive ? '' : ' (last)'}`
      : '';

    return {
      css: css.join('\n    '),
      fixed: `${frames.join('\n  ')}
  <text x="16" y="${H - 14}" font-size="12" fill="${C.text}">${stats.windowRows} rows in ${days.length} days · <tspan font-weight="bold" fill="${pace.color}">${pace.text}</tspan>${streakNote}</text>
  <text x="${W - 16}" y="${H - 14}" text-anchor="end" font-size="11" fill="${C.muted}"><tspan fill="${C.green2}">+</tspan> row · <tspan fill="${C.yellow}">~</tspan> rest · <tspan fill="${C.red}">-</tspan> miss</text>`,
      paceText: pace.text,
    };
  },
};
