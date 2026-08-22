// Tape layer: the row --dry glyph for each day (+ / ++ / ~ / -), scrolling
// with the world beneath the terrain.

module.exports = {
  name: 'tape',
  render(ctx) {
    const { days, L, C } = ctx;
    const { xOf, tapeY } = L;

    const glyphs = days.map((d) => {
      const g = { rowed: '+'.repeat(Math.min(d.count, 3)), rest: '~', missed: '-', pending: '?' }[d.status];
      const color = { rowed: C.green2, rest: C.yellow, missed: C.red, pending: C.muted }[d.status];
      return `<text x="${xOf(d.i)}" y="${tapeY}" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${g}<title>${d.iso}: ${d.status}${d.count > 1 ? ` ×${d.count}` : ''} · pace ${d.standing >= 0 ? '+' : ''}${d.standing}</title></text>`;
    });

    return { world: glyphs.join('\n      ') };
  },
};
