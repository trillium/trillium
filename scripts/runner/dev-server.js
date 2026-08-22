#!/usr/bin/env node
// Row Runner dev server: serves the combined card plus every layer exploded
// into its own card, re-rendering from source on each request (require cache
// is busted, so file edits show up on refresh). The page polls /version and
// reloads the SVGs only when a source file actually changes.
//   node scripts/runner/dev-server.js --rows-file=path [--today=YYYY-MM-DD] [--port=8787]
// Local-only tooling; never runs in CI.

const http = require('http');
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '..');
const argv = process.argv.slice(2);
const args = Object.fromEntries(argv.filter((a) => a.startsWith('--')).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const PORT = Number(args.port) || 8787;

function bustCache() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(SCRIPTS_DIR)) delete require.cache[key];
  }
}

function sourceVersion() {
  let latest = 0;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else latest = Math.max(latest, fs.statSync(p).mtimeMs);
    }
  };
  walk(SCRIPTS_DIR);
  return String(latest);
}

function render(only) {
  bustCache();
  const { parseRows, todayLA } = require(path.join(SCRIPTS_DIR, 'lib/rowing-data'));
  const { renderRunner } = require(path.join(SCRIPTS_DIR, 'runner'));
  const text = fs.readFileSync(args['rows-file'], 'utf8');
  const days = parseRows(text);
  const asOf = args.today || todayLA();
  return renderRunner(days, asOf, only ? { only: [only] } : {}).svg;
}

function layerNames() {
  bustCache();
  return require(path.join(SCRIPTS_DIR, 'runner')).LAYERS.map((l) => l.name);
}

function page() {
  const names = layerNames();
  const card = (title, src) => `
    <section>
      <h2>${title}</h2>
      <img data-src="/${src}" alt="${title}" />
    </section>`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Row Runner — layer lab</title>
<style>
  body { background: #1b1c24; color: #f8f8f2; font-family: 'Segoe UI', Ubuntu, sans-serif; margin: 2rem; }
  h1 { color: #f40082; } h2 { color: #ffd200; font-size: 1rem; margin: 0 0 .5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(580px, 1fr)); gap: 1.5rem; }
  section { background: #21222c; padding: 1rem; border-radius: 12px; }
  img { max-width: 100%; }
  .bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
  button { background: #f40082; color: white; border: 0; padding: .5rem 1rem; border-radius: 8px; cursor: pointer; }
  .combined section { border: 2px solid #ffd200; }
  #status { color: #9ba0b0; font-size: .85rem; }
</style></head>
<body>
<h1>🕹️ Row Runner — layer lab</h1>
<div class="bar">
  <button onclick="reloadAll()">Reload now</button>
  <label><input type="checkbox" id="auto" checked> reload automatically when source files change</label>
  <span id="status"></span>
</div>
<div class="combined grid">${card('ALL LAYERS COMBINED', 'full.svg')}</div>
<h1 style="font-size:1.2rem">Exploded layers</h1>
<div class="grid">
${names.map((n) => card(n, `solo/${n}.svg`)).join('\n')}
</div>
<script>
  let version = null;
  function reloadAll() {
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src + '?t=' + Date.now();
    });
    document.getElementById('status').textContent = 'reloaded ' + new Date().toLocaleTimeString();
  }
  async function poll() {
    try {
      const v = await (await fetch('/version')).text();
      if (version === null) version = v;
      else if (v !== version && document.getElementById('auto').checked) { version = v; reloadAll(); }
      else version = v;
    } catch (e) { /* server restarting; keep polling */ }
    setTimeout(poll, 1500);
  }
  reloadAll(); poll();
</script>
</body></html>`;
}

http.createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html' }).end(page());
    } else if (url.pathname === '/version') {
      res.writeHead(200, { 'content-type': 'text/plain' }).end(sourceVersion());
    } else if (url.pathname === '/full.svg') {
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }).end(render());
    } else if (url.pathname.startsWith('/solo/') && url.pathname.endsWith('.svg')) {
      const name = url.pathname.slice('/solo/'.length, -'.svg'.length);
      res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'no-store' }).end(render(name));
    } else {
      res.writeHead(404).end('not found');
    }
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(err && err.stack || err));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Row Runner layer lab → http://localhost:${PORT}/`);
});
