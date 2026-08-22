// Terrain layer: the pace-standing line the character rides — area fill,
// polyline, streak-span overlay, and the fixed "on pace" reference line.

module.exports = {
  name: 'terrain',
  render(ctx) {
    const { days, stats, L, C } = ctx;
    const { xOf, yOf, lo, hi, yBot, clipX, clipW, lastI } = L;

    const terrain = days.map((d) => `${xOf(d.i)},${yOf(d.standing).toFixed(1)}`).join(' ');
    const area = `M ${xOf(0)} ${yBot + 8} L ${terrain.replace(/ /g, ' L ')} L ${xOf(lastI)} ${yBot + 8} Z`;

    let streakOverlay = '';
    if (stats.streak) {
      const sIso = ctx.dayISO(stats.streak.start), eIso = ctx.dayISO(stats.streak.end);
      const seg = days.filter((d) => d.iso >= sIso && d.iso <= eIso);
      if (seg.length > 1) {
        const pts = seg.map((d) => `${xOf(d.i)},${yOf(d.standing).toFixed(1)}`).join(' ');
        streakOverlay = `<polyline class="terrain-glow" points="${pts}" fill="none" stroke="${C.streak}" stroke-width="3" stroke-linecap="round"/>`;
      }
    }

    const zeroLine = lo <= 0 && hi >= 0
      ? `<line x1="${clipX}" y1="${yOf(0).toFixed(1)}" x2="${clipX + clipW}" y2="${yOf(0).toFixed(1)}" stroke="${C.muted}" stroke-width="1" stroke-dasharray="3 5" opacity="0.6"/>` +
        `<text x="${clipX + 4}" y="${(yOf(0) - 4).toFixed(1)}" font-size="9" fill="${C.muted}">on pace</text>`
      : '';

    return {
      css: `.terrain-glow { animation: terrain-glow 2.4s ease-in-out infinite; }
    @keyframes terrain-glow { 0%,100% { stroke-opacity: .95 } 50% { stroke-opacity: .4 } }`,
      viewUnder: zeroLine,
      world: `<path d="${area}" fill="${C.green1}" fill-opacity="0.18"/>
      <polyline points="${terrain}" fill="none" stroke="${C.green2}" stroke-width="2" stroke-linejoin="round"/>
      ${streakOverlay}`,
    };
  },
};
