// Tape layer: each day's row --dry glyph, hanging from a baseline rule.
// Multi-row days stack glyphs vertically downward — depth = effort — capped at
// tapeMax with a numeral for bigger days (+ + 4).

module.exports = {
  name: 'tape',
  render(ctx) {
    const { days, L, C } = ctx;
    const { xOf, baselineY, tapeTop, tapeRow, tapeMax, clipX, clipW } = L;

    const glyphs = days.map((d) => {
      const color = { rowed: C.green2, rest: C.yellow, missed: C.red, pending: C.muted }[d.status];
      const label = `${d.iso}: ${d.status}${d.count > 1 ? ` ×${d.count}` : ''} · pace ${d.standing >= 0 ? '+' : ''}${d.standing}`;
      const cells = [];
      if (d.status === 'rowed') {
        if (d.count <= tapeMax) {
          for (let k = 0; k < d.count; k++) cells.push({ text: '+', size: 11, dy: k * tapeRow });
        } else {
          for (let k = 0; k < tapeMax - 1; k++) cells.push({ text: '+', size: 11, dy: k * tapeRow });
          cells.push({ text: String(d.count), size: 9, dy: (tapeMax - 1) * tapeRow });
        }
      } else {
        cells.push({ text: { rest: '~', missed: '-', pending: '?' }[d.status], size: 11, dy: 0 });
      }
      const texts = cells.map((c) =>
        `<text x="${xOf(d.i)}" y="${tapeTop + c.dy}" text-anchor="middle" font-size="${c.size}" font-weight="bold" fill="${color}">${c.text}</text>`
      ).join('');
      return `<g><title>${label}</title>${texts}</g>`;
    });

    return {
      viewUnder: `<line x1="${clipX}" y1="${baselineY}" x2="${clipX + clipW}" y2="${baselineY}" stroke="${C.muted}" stroke-width="1" opacity="0.35"/>`,
      world: glyphs.join('\n      '),
    };
  },
};
