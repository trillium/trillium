// Single source of truth for the Row Runner clock. The world scroll, the
// character ride, and any per-day HUD frames must all derive their timing from
// here so they can never desynchronize.

const RUN_SECONDS = 60;  // full animation duration cap (scroll + hold)
const HOLD_PCT = 8;      // % of the loop spent parked at "today" before restart

function makeTimeline(rideStart, lastI) {
  const scrollPct = 100 - HOLD_PCT;
  // Percent of the loop at which the character is over day i (linear scroll:
  // every day gets an equal slice).
  const dayToPct = (i) => (scrollPct * (i - rideStart)) / (lastI - rideStart);
  return { RUN_SECONDS, HOLD_PCT, scrollPct, dayToPct };
}

module.exports = { RUN_SECONDS, HOLD_PCT, makeTimeline };
