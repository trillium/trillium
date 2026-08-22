// Character layer: the fixed rower who rides the terrain as the world scrolls.
// Ride keyframes come from the same timeline as the world scroll, so they
// cannot desynchronize. The static transform attribute is the final "today"
// pose, which is what prefers-reduced-motion viewers see.

module.exports = {
  name: 'character',
  render(ctx) {
    const { days, L, T } = ctx;
    const { charX, yBot, yOf, rideStart, lastI } = L;

    const pose = (i) => `translate(${L.charTx(i).toFixed(1)}px, ${(yOf(days[i].standing) - yBot).toFixed(1)}px)`;
    const rideFrames = [];
    for (let i = rideStart; i <= lastI; i++) {
      rideFrames.push(`${T.dayToPct(i).toFixed(2)}% { transform: ${pose(i)} }`);
    }
    rideFrames.push(`100% { transform: ${pose(lastI)} }`);

    const finalPose = `translate(${L.charTx(lastI).toFixed(1)} ${(yOf(days[lastI].standing) - yBot).toFixed(1)})`;
    return {
      css: `.char-ride { animation: char-ride ${T.RUN_SECONDS}s linear infinite; }
    @keyframes char-ride { ${rideFrames.join(' ')} }
    .char-bob { animation: char-bob 2s ease-in-out infinite; }
    @keyframes char-bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-2.5px) } }`,
      viewOver: `<g transform="translate(${charX} ${yBot})"><g class="char-ride" transform="${finalPose}"><g class="char-bob"><text x="0" y="-8" text-anchor="middle" font-size="20">🚣</text></g></g></g>`,
    };
  },
};
