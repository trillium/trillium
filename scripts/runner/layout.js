// Single source of truth for Row Runner geometry. Every layer reads coordinates
// from here; no layer defines its own. If two layers need the same y, it lives
// here by definition.

const W = 560, H = 272;

// World
const pitch = 14, worldX0 = 12;

// Vertical bands, top to bottom
const skyY = 48;          // top of the zone-wash / watermark sky
const yTop = 84, yBot = 162;  // terrain band (pace line lives here)
const waterY = 172;       // waterline (waves, buoy gates sit here)
const baselineY = 188;    // tape baseline rule
const tapeTop = 200;      // first glyph row of the tape stack
const tapeRow = 11;       // vertical distance between stacked glyphs
const tapeMax = 3;        // stack cap; 4+ shows two glyphs and a numeral

// Viewport clip
const clipX = 10, clipW = W - 20;
const clipY = 44, clipH = tapeTop + tapeMax * tapeRow - clipY; // down past the deepest stack

// Character parked near the left so it rides (and the HUD tracks) nearly the
// whole window.
const charX = 68;

const xOf = (i) => worldX0 + i * pitch;

// yOf is data-dependent (needs the standing range); built once per render.
function makeYOf(standings) {
  const lo = Math.min(...standings), hi = Math.max(...standings);
  const span = Math.max(hi - lo, 4);
  const yOf = (v) => yBot - ((v - lo) / span) * (yBot - yTop);
  return { yOf, lo, hi };
}

module.exports = {
  W, H, pitch, worldX0,
  skyY, yTop, yBot, waterY, baselineY, tapeTop, tapeRow, tapeMax,
  clipX, clipW, clipY, clipH, charX, xOf, makeYOf,
};
