#!/usr/bin/env node
// Polls the Twitch Helix API for the captain's live state and flips the
// README's LIVE-STATUS marker block between LIVE and offline.
// Run by .github/workflows/live-status.yml; safe to run locally:
//   TWITCH_CHANNEL=some_login TWITCH_CLIENT_ID=x TWITCH_CLIENT_SECRET=y \
//     node scripts/update-live-status.js
//
// Configuration (repo variable + secrets — never commit real values here):
//   TWITCH_CHANNEL       repo variable: Twitch channel login, e.g. "trillium"
//   TWITCH_CLIENT_ID     repo secret:   Twitch app client id (dev.twitch.tv/console)
//   TWITCH_CLIENT_SECRET repo secret:   Twitch app client secret (client-credentials
//                        flow only — no user OAuth, no login needed)
//
// If any of the three are missing (or still the placeholder), the script prints
// SKIP and exits 0 without touching the README, so scheduled runs are harmless
// before the captain finishes setup.
//
// Test-only overrides (not used by the workflow):
//   TWITCH_API_BASE, TWITCH_AUTH_BASE — point at a stub server.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const README = path.join(ROOT, 'README.md');
const MARKER = 'LIVE-STATUS';
const PLACEHOLDER = 'YOUR_TWITCH_LOGIN';

const API_BASE = process.env.TWITCH_API_BASE || 'https://api.twitch.tv/helix';
const AUTH_BASE = process.env.TWITCH_AUTH_BASE || 'https://id.twitch.tv/oauth2';

function replaceBetween(content, marker, replacement) {
  const start = `<!-- ${marker}:START -->`;
  const end = `<!-- ${marker}:END -->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (!regex.test(content)) {
    throw new Error(`README is missing markers ${start} ... ${end}`);
  }
  return content.replace(regex, `${start}\n${replacement}\n${end}`);
}

function renderLive(channel, stream) {
  const url = `https://www.twitch.tv/${channel}`;
  const title = (stream && stream.title ? stream.title.replace(/[\[\]]/g, '') : 'Live now').slice(0, 120);
  return [
    `[![🔴 LIVE on Twitch](https://img.shields.io/badge/🔴_LIVE_on_Twitch-9146FF?style=for-the-badge&logo=twitch&logoColor=white)](${url})`,
    '',
    `**🔴 LIVE NOW** — streaming on [Twitch](${url})${title ? ` — *${title}*` : ''}`,
  ].join('\n');
}

function renderOffline(channel) {
  const url = `https://www.twitch.tv/${channel}`;
  return [
    `[![Twitch status](https://img.shields.io/badge/Twitch-offline-555555?style=for-the-badge&logo=twitch&logoColor=white)](${url})`,
    '',
    `Currently offline — catch the next stream on [Twitch](${url}).`,
  ].join('\n');
}

async function getAppToken(clientId, clientSecret) {
  const res = await fetch(`${AUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error(`token request failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.access_token) throw new Error('token response had no access_token');
  return data.access_token;
}

async function getLiveStream(channel, clientId, token) {
  const res = await fetch(`${API_BASE}/streams?user_login=${encodeURIComponent(channel)}`, {
    headers: { 'Client-Id': clientId, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`streams request failed: HTTP ${res.status}`);
  const data = await res.json();
  return data && Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : null;
}

async function main() {
  const channel = (process.env.TWITCH_CHANNEL || '').trim();
  const clientId = (process.env.TWITCH_CLIENT_ID || '').trim();
  const clientSecret = (process.env.TWITCH_CLIENT_SECRET || '').trim();

  if (!channel || channel === PLACEHOLDER || !clientId || !clientSecret) {
    console.log('SKIP: TWITCH_CHANNEL (repo variable) and TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET (repo secrets) are not all configured. See README "Stream Status" setup section. README left untouched.');
    return;
  }

  const token = await getAppToken(clientId, clientSecret);
  const stream = await getLiveStream(channel, clientId, token);

  const content = fs.readFileSync(README, 'utf8');
  const next = replaceBetween(content, MARKER, stream ? renderLive(channel, stream) : renderOffline(channel));
  if (next === content) {
    console.log(stream ? 'NO-CHANGE: already LIVE.' : 'NO-CHANGE: already offline.');
    return;
  }
  fs.writeFileSync(README, next);
  console.log(stream ? `UPDATED: now LIVE (${stream.title || 'untitled'}).` : 'UPDATED: now offline.');
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
