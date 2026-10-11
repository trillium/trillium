#!/usr/bin/env node
// Gate for the scheduled sync: GitHub cron is UTC-only, so the workflow lists
// both UTC hours that can be 3:00 AM in America/Los_Angeles (10:00 during PDT,
// 11:00 during PST) and this decides which of the two is the real one.
// Keyed on the cron's UTC hour versus the current LA offset (not the wall clock),
// so a delayed run still counts and exactly one cron per day proceeds.
// Non-schedule events (push, workflow_dispatch) always run.
// Prints run=true|false and appends it to $GITHUB_OUTPUT when set.
// Reads GITHUB_EVENT_NAME and SCHEDULE_CRON (= github.event.schedule).

const fs = require('fs');

const TARGET_LA_HOUR = 3;

// Hours LA is behind UTC at instant `now` (7 during PDT, 8 during PST).
function laOffsetHours(now) {
  const laHour = Number(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', hourCycle: 'h23',
  }).format(now));
  return (now.getUTCHours() - laHour + 24) % 24;
}

// UTC hour at which it is 3:00 AM in LA right now.
function intendedUtcHour(now) {
  return (TARGET_LA_HOUR + laOffsetHours(now)) % 24;
}

function shouldRun(eventName, cron, now = new Date()) {
  if (eventName !== 'schedule') return true;
  const utcHour = Number((cron || '').trim().split(/\s+/)[1]);
  return utcHour === intendedUtcHour(now);
}

function main() {
  const run = shouldRun(process.env.GITHUB_EVENT_NAME, process.env.SCHEDULE_CRON);
  console.log(`run=${run}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
}

if (require.main === module) main();

module.exports = { laOffsetHours, intendedUtcHour, shouldRun };
