// Zones layer: month delineation inside the scrolling world. (Currently the
// simple marker lines + labels; will grow into hue washes, watermark month
// names, and buoy gates at the boundaries.)

module.exports = {
  name: 'zones',
  render(ctx) {
    const { days, L, C } = ctx;
    const { xOf, yTop, tapeY } = L;

    const markers = days
      .filter((d) => d.iso.endsWith('-01'))
      .map((d) =>
        `<line x1="${xOf(d.i)}" y1="${yTop - 10}" x2="${xOf(d.i)}" y2="${tapeY + 6}" stroke="${C.empty}" stroke-width="1"/>` +
        `<text x="${xOf(d.i) + 4}" y="${yTop - 12}" font-size="9" fill="${C.muted}">${ctx.parseDay(d.iso).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</text>`
      );

    return { world: markers.join('\n      ') };
  },
};
