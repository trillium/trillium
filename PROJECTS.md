# Projects — Agent Instructions

This document describes every project Trillium is working on. After completing the
main setup (see `SETUP.md`), clone these repos and restore the working state described
below.

All dirty working trees have been committed with `WIP:` prefixed commit messages as
of 2026-02-19 so that no work is lost during migration. Some repos that couldn't push
to their upstream (forks of org repos) were pushed to `migration/*` branches on
Trillium's fork.

---

## Voice Control (Talon ecosystem)

These are the highest priority — Trillium uses voice control for coding.

### trillium_talon (primary voice commands)

The main Talon voice command set. This is a fork of the community (knausj) command set
with extensive custom commands.

```bash
# Already cloned in SETUP.md section 8b to ~/.talon/user/talon_community
# Also has a second checkout:
git clone https://github.com/trillium/trillium_talon.git ~/code/talon
cd ~/code/talon && git checkout feature/recall-plugin
git remote add upstream https://github.com/talonhub/community.git
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/trillium_talon |
| Branches | `restore-from-original` (main working branch, ~/.talon/user/), `feature/recall-plugin` (~/code/talon), `mine_main` |
| Remotes | `origin`/`mine` → trillium/trillium_talon, `knausj`/`upstream` → upstream community |
| Key dirs | `trillium/` (custom commands), `plugin/` (mode indicator, recall, slash commands) |

Custom features built into this repo:
- **Parrot noise integration** — mode switching, scroll, click by mouth sounds
- **Recall plugin** — save/switch windows by voice
- **Mode indicator** — shows current mode + Anthropic API usage/burn rate
- **Slash commands plugin** — voice commands for Claude Code `/` commands
- **Dictation replacements** — custom word corrections and vocabulary
- **Poll usage service** — Python script that polls Anthropic API (runs as systemd service)

### talon_recall (standalone recall plugin)

Recall as a standalone Talon plugin (also integrated into trillium_talon).

```bash
git clone https://github.com/trillium/talon_recall.git ~/code/recall
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/talon_recall |
| Branch | `main` (also has `standalone` branch) |
| What | Save specific windows and switch between them by voice |

### parrot.py (noise recognition)

Fork of chaosparrot/parrot.py — parrot noise recognition for Talon.

```bash
git clone https://github.com/trillium/parrot.py.git ~/code/parrot
cd ~/code/parrot && git checkout monorepo
git remote add upstream-source https://github.com/chaosparrot/parrot.py.git
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/parrot.py |
| Branch | `monorepo` |
| What | Noise recognition (pop, hiss, shush, etc.) for hands-free control |

### awesome-talon (resource directory)

Curated list of Talon resources with a website featuring a command search engine.

```bash
git clone https://github.com/trillium/awesome-talon.git ~/code/awesome-talon
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/awesome-talon |
| Branch | `main` |
| What | Website + crawled command index across community Talon repos |
| Key dirs | `website/` (Next.js site), `scripts/` (crawlers/indexers), `.playground/` (research) |

### cursorless-talon-dev

Cursorless Talon integration (cloned in SETUP.md section 8c).

```bash
cd ~/.talon/user
git clone https://github.com/cursorless-dev/cursorless-talon.git cursorless-talon-dev
```

---

## Zed Editor Integration

Trillium is working on bringing Cursorless voice-coding to the Zed editor.
This spans three related repos.

### zed (editor fork)

Fork of Zed with a decoration API for rendering cursorless hats.

```bash
git clone https://github.com/trillium/zed.git ~/code/zed
cd ~/code/zed
git checkout feature/decoration-api
git remote add upstream https://github.com/zed-industries/zed.git
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/zed |
| Branch | `feature/decoration-api` |
| Language | Rust |
| What | Adding a decoration rendering API to Zed for cursorless hat overlays |
| Key dirs | `crates/cursorless/` (new crate), `extensions/decoration-test/` |
| Note | Large repo (~1GB). Build with `cargo build` |

### zed-cursorless (adapter)

Cursorless-Zed engine adapter — WASM extension that bridges cursorless to Zed.

```bash
git clone https://github.com/trillium/zed-cursorless.git ~/code/zed-cursorless
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/zed-cursorless (private) |
| Branch | `master` |
| Language | Rust |
| What | WASM adapter + protocol types for cursorless ↔ Zed communication |
| Key dirs | `src/` (lib), `extension/` (Zed extension), `engine-wrapper/` (TS transport) |

### cursorless (upstream fork)

Fork of cursorless-dev/cursorless with Zed integration packages.

```bash
git clone https://github.com/cursorless-dev/cursorless.git ~/code/cursorless
cd ~/code/cursorless
git remote add trillium https://github.com/trillium/cursorless.git
git checkout feature/zed-integration
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/cursorless (fork) |
| Branch | `feature/zed-integration` |
| Language | TypeScript |
| What | New `packages/zed-common/` with engine wrapper, protocol types, CLI |
| Upstream | https://github.com/cursorless-dev/cursorless |

---

## Web Projects

### massage (scheduling site)

Massage therapy scheduling site with Google Calendar + Gmail API integration.

```bash
git clone https://github.com/trillium/massage.git ~/code/massage
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/massage |
| Branch | `main` (also has PR branches: `claude/implement-supabase-auth-*`, `fix/massage-*`) |
| Stack | Next.js, TypeScript, Tailwind, Redux, Vercel |
| What | Client booking tool for in-person and online appointments |
| Live | https://trilliummassage.la/ |
| Note | Has 5 stashes from pre-migration — check `git stash list` |

### row_tracker

Next.js row tracking application.

```bash
git clone https://github.com/trillium/row_tracker.git ~/code/row_tracker
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/row_tracker |
| Branch | `main` |
| Stack | Next.js |

### platform-new (multi-tenant platform)

Next.js 15 multi-tenant platform (forked from Vercel's platforms starter).

```bash
git clone https://github.com/trillium/platform-new.git ~/code/platform/new
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/platform-new (private) |
| Branch | `main` |
| Stack | Next.js 15, React 19, Upstash Redis, Tailwind 4, shadcn/ui |
| What | Custom subdomain routing, tenant management, admin interface |
| Note | Fork of vercel/platforms — `origin` remote was Vercel's, `mine` is trillium's |

### platform-old (legacy platform fork)

Older platforms starter kit fork.

```bash
git clone https://github.com/trillium/platform-old.git ~/code/platform/old
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/platform-old (private) |
| Branch | `main` |
| Stack | Next.js 13, Prisma, PlanetScale, NextAuth, Tailwind 3 |
| Note | WIP fork, probably superseded by platform-new |

---

## Open Source / Hack for LA

### VRMS (Volunteer Resource Management System)

Trillium is the **lead developer** on this Hack for LA project.

```bash
git clone https://github.com/hackforla/VRMS.git ~/code/vrms
git clone https://github.com/hackforla/VRMS.git ~/VRMS
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/hackforla/VRMS (upstream) |
| Fork | https://github.com/trillium/VRMS |
| Branches | `development` (~/code/vrms), `dev/run-tests` (~/VRMS) |
| Stack | React, Vite, Express, MongoDB, Docker, AWS ECS, GitHub Actions |
| Live | https://www.vrms.io/ |
| Migration branches | `migration/development-wip`, `migration/dev/run-tests-wip` on trillium/VRMS |
| Note | Two local checkouts — `~/code/vrms` and `~/VRMS` |

To restore working state on new machine:
```bash
cd ~/code/vrms
git remote add trillium https://github.com/trillium/VRMS.git
git fetch trillium
git checkout -b development trillium/migration/development-wip

cd ~/VRMS
git remote add trillium https://github.com/trillium/VRMS.git
git fetch trillium
git checkout -b dev/run-tests trillium/migration/dev/run-tests-wip
```

---

## Infrastructure / Tools

### openclaw

OpenClaw project. Runs as a gateway service via systemd + Tailscale serve.

```bash
git clone https://github.com/openclaw/openclaw.git ~/openclaw
cd ~/openclaw
git remote add trillium https://github.com/trillium/openclaw.git
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/openclaw/openclaw (upstream) |
| Fork | https://github.com/trillium/openclaw |
| Branch | `main` |
| Migration branch | `migration/main-wip` on trillium/openclaw |
| Systemd | `openclaw-gateway.service` (see SETUP.md section 12) |
| Tailscale | Served at https://lnx.hippo-tilapia.ts.net on port 18789 |

To restore working state:
```bash
cd ~/openclaw
git fetch trillium
git reset --hard trillium/migration/main-wip
```

### .openclaw (config)

OpenClaw configuration repo.

```bash
git clone https://github.com/trillium/.openclaw.git ~/code/.openclaw
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/.openclaw |
| Branch | `main` |

### beads (issue tracker fork)

Fork of steveyegge/beads — AI-native issue tracker.

```bash
git clone https://github.com/trillium/beads.git ~/code/beads
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/beads |
| Branch | `main` |
| What | Distributed, git-backed graph issue tracker used extensively in all projects |

### torc

```bash
git clone https://github.com/trillium/torc.git ~/torc
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/torc |
| Branch | `main` |

### apple-refurb-monitor

Monitors Apple refurb store for Mac Minis, sends Telegram alerts.

```bash
mkdir -p ~/code/refurbished_apple
git clone https://github.com/kanishkaverma/apple-refurb-monitor.git ~/code/refurbished_apple/apple-refurb-monitor
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/kanishkaverma/apple-refurb-monitor |
| Branch | `main` |
| Runtime | Node.js + headless Chrome |
| Systemd | `apple-refurb-watcher.service` + `apple-refurb-chrome.service` |

### speak (TTS CLI)

Local text-to-speech CLI tool supporting Kokoro and Piper engines.

```bash
git clone https://github.com/trillium/speak.git ~/code/speak
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/speak (private) |
| Branch | `main` |
| What | `speak "hello"` — daemon-based TTS with voice selection, speed control |
| Install | Run `./install.sh` to symlink scripts to `~/.local/bin/` |
| Voice models | Stored in `~/.local/share/speak/` (not in repo — download on first use) |

### CCometixLine (Claude Code status line)

Rust-based status line tool for Claude Code terminal UI.

```bash
git clone https://github.com/trillium/CCometixLine.git ~/code/CCometixLine
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/CCometixLine |
| Branch | `master` |
| Upstream | https://github.com/Haleclipse/CCometixLine |
| Language | Rust |
| What | High-performance status line with git integration, usage tracking, TUI config |
| Build | `cargo build --release`, copy binary to `~/.claude/ccline/ccline` |

---

## Data / Analytics

### overview

GitHub activity analytics — commit history analysis scripts and generated reports.

```bash
git clone https://github.com/trillium/overview.git ~/code/overview
```

| Detail | Value |
|--------|-------|
| Repo | https://github.com/trillium/overview (private) |
| Branch | `main` |
| What | Scripts to collect and analyze GitHub commit history (2024-02 to 2026-02) |

---

## Clone All Projects (single script)

```bash
mkdir -p ~/code ~/code/platform ~/code/refurbished_apple

# Talon ecosystem
git clone https://github.com/trillium/trillium_talon.git ~/code/talon && cd ~/code/talon && git checkout feature/recall-plugin && git remote add upstream https://github.com/talonhub/community.git
git clone https://github.com/trillium/talon_recall.git ~/code/recall
git clone https://github.com/trillium/parrot.py.git ~/code/parrot && cd ~/code/parrot && git checkout monorepo && git remote add upstream-source https://github.com/chaosparrot/parrot.py.git
git clone https://github.com/trillium/awesome-talon.git ~/code/awesome-talon

# Zed integration
git clone https://github.com/trillium/zed.git ~/code/zed && cd ~/code/zed && git checkout feature/decoration-api && git remote add upstream https://github.com/zed-industries/zed.git
git clone https://github.com/trillium/zed-cursorless.git ~/code/zed-cursorless
git clone https://github.com/cursorless-dev/cursorless.git ~/code/cursorless && cd ~/code/cursorless && git remote add trillium https://github.com/trillium/cursorless.git && git checkout feature/zed-integration

# Web projects
git clone https://github.com/trillium/massage.git ~/code/massage
git clone https://github.com/trillium/row_tracker.git ~/code/row_tracker
git clone https://github.com/trillium/platform-new.git ~/code/platform/new
git clone https://github.com/trillium/platform-old.git ~/code/platform/old

# VRMS (two checkouts)
git clone https://github.com/hackforla/VRMS.git ~/code/vrms && cd ~/code/vrms && git remote add trillium https://github.com/trillium/VRMS.git && git fetch trillium && git checkout -b development trillium/migration/development-wip
git clone https://github.com/hackforla/VRMS.git ~/VRMS && cd ~/VRMS && git remote add trillium https://github.com/trillium/VRMS.git && git fetch trillium && git checkout -b dev/run-tests trillium/migration/dev/run-tests-wip

# Infrastructure / tools
git clone https://github.com/openclaw/openclaw.git ~/openclaw && cd ~/openclaw && git remote add trillium https://github.com/trillium/openclaw.git && git fetch trillium && git reset --hard trillium/migration/main-wip
git clone https://github.com/trillium/.openclaw.git ~/code/.openclaw
git clone https://github.com/trillium/beads.git ~/code/beads
git clone https://github.com/trillium/torc.git ~/torc
git clone https://github.com/kanishkaverma/apple-refurb-monitor.git ~/code/refurbished_apple/apple-refurb-monitor
git clone https://github.com/trillium/speak.git ~/code/speak
git clone https://github.com/trillium/CCometixLine.git ~/code/CCometixLine

# Analytics
git clone https://github.com/trillium/overview.git ~/code/overview
```

---

## Post-Clone Steps

1. **Build CCometixLine** and install to `~/.claude/ccline/ccline`:
   ```bash
   cd ~/code/CCometixLine && cargo build --release
   mkdir -p ~/.claude/ccline
   cp target/release/ccometixline ~/.claude/ccline/ccline
   ```

2. **Install speak**:
   ```bash
   cd ~/code/speak && ./install.sh
   ```

3. **Restore massage stashes** — there were 5 stashes pre-migration. They are lost
   (stashes don't transfer via push). The WIP commit contains the working tree state.

4. **Install project dependencies** where needed:
   ```bash
   cd ~/code/massage && npm install
   cd ~/code/awesome-talon/website && npm install
   cd ~/code/vrms && npm install
   cd ~/VRMS && npm install
   ```
