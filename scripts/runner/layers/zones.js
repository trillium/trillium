// Zones layer: each month is a biome. A barely-there hue wash colors its air,
// a giant watermark name fills its sky, and a buoy gate at the waterline marks
// the boundary — so crossing July → August visibly brings a new frame into
// frame. Hue per month is fixed (deterministic year over year).

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const hueOf = (m) => (m * 30 + 10) % 360;

module.exports = {
  name: 'zones',
  render(ctx) {
    const { days, L, C } = ctx;
    const { xOf, pitch, skyY, waterY, tapeTop } = L;

    // Group window days into month runs.
    const runs = [];
    for (const d of days) {
      const m = Number(d.iso.slice(5, 7)) - 1;
      if (!runs.length || runs[runs.length - 1].m !== m) runs.push({ m, startI: d.i, endI: d.i });
      else runs[runs.length - 1].endI = d.i;
    }

    const washes = [];
    const watermarks = [];
    const gates = [];
    for (const r of runs) {
      const x = xOf(r.startI) - pitch / 2;
      const w = (r.endI - r.startI + 1) * pitch;
      washes.push(`<rect x="${x.toFixed(1)}" y="${skyY}" width="${w}" height="${waterY - skyY}" fill="hsl(${hueOf(r.m)} 65% 60%)" fill-opacity="0.06"/>`);
      if (w > 130) {
        watermarks.push(`<text x="${(x + 14).toFixed(1)}" y="${skyY + 26}" font-size="34" font-weight="bold" letter-spacing="4" fill="${C.text}" fill-opacity="0.06">${MONTHS[r.m]}</text>`);
      }
      // Buoy gate on the boundary at the run's start (skip the window's cut edge).
      if (days[r.startI - days[0].i] && days.find((d) => d.i === r.startI).iso.endsWith('-01')) {
        const bx = x.toFixed(1);
        gates.push(
          `<g>` +
          `<line x1="${bx}" y1="${waterY - 26}" x2="${bx}" y2="${waterY + 2}" stroke="${C.muted}" stroke-width="1.5"/>` +
          `<rect x="${bx}" y="${waterY - 26}" width="26" height="13" rx="2" fill="hsl(${hueOf(r.m)} 65% 45%)"/>` +
          `<text x="${Number(bx) + 13}" y="${waterY - 16.5}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="${C.text}">${SHORT[r.m]}</text>` +
          `<circle cx="${bx}" cy="${waterY + 3}" r="3.5" fill="${C.red}"/>` +
          `</g>`
        );
      }
    }

    return { world: [...washes, ...watermarks, ...gates].join('\n      ') };
  },
};
