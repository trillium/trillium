// Single source of truth for Row Runner geometry. Every layer reads coordinates
// from here; no layer defines its own. If two layers need the same y, it lives
// here by definition.

const W = 560, H = 232;
const pitch = 14, worldX0 = 12;
const yTop = 74, yBot = 156, tapeY = 184;
const clipX = 10, clipW = W - 20;
const charX = 432;

const xOf = (i) => worldX0 + i * pitch;

// yOf is data-dependent (needs the standing range); built once per render.
function makeYOf(standings) {
  const lo = Math.min(...standings), hi = Math.max(...standings);
  const span = Math.max(hi - lo, 4);
  const yOf = (v) => yBot - ((v - lo) / span) * (yBot - yTop);
  return { yOf, lo, hi };
}

module.exports = { W, H, pitch, worldX0, yTop, yBot, tapeY, clipX, clipW, charX, xOf, makeYOf };
