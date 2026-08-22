// Water layer: drifting foreground waves, fixed in the viewport.

module.exports = {
  name: 'water',
  render(ctx) {
    const { L, C } = ctx;
    const { clipX, clipW } = L;

    function wave(y, amp, wl) {
      let p = `M ${clipX - wl * 2} ${y}`;
      for (let x = clipX - wl * 2; x < clipX + clipW + wl * 2; x += wl) {
        p += ` q ${wl / 4} ${-amp} ${wl / 2} 0 q ${wl / 4} ${amp} ${wl / 2} 0`;
      }
      return p;
    }

    return {
      css: `.water-1 { animation: water-drift 6s linear infinite; }
    .water-2 { animation: water-drift 9s linear infinite reverse; }
    @keyframes water-drift { from { transform: translateX(0) } to { transform: translateX(-44px) } }`,
      viewOver: `<path class="water-1" d="${wave(166, 3, 44)}" fill="none" stroke="${C.water}" stroke-width="2"/>
    <path class="water-2" d="${wave(172, 2.5, 44)}" fill="none" stroke="${C.waterHi}" stroke-width="1.5" opacity="0.45"/>`,
    };
  },
};
