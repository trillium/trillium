# New Computer Setup — Agent Instructions

You are setting up a new Linux workstation for Trillium (trillium@trilliumsmith.com).
This document describes everything that was on the previous machine. Your job is to
reproduce this environment as completely as possible on the new machine.

**Previous machine**: Linux Mint 22.3 (Cinnamon desktop) on x86_64.

Work through each section in order. Ask before making substitutions or skipping anything.

---

## 1. Base OS

Install **Linux Mint** with the **Cinnamon** desktop (or whatever distro Trillium chooses).
Ensure the username is `trillium`.

---

## 2. Package Managers

Install these in order — later tools depend on earlier ones.

### 2a. Nix (single-user install)

Nix is the primary package manager for dev tools.

```bash
sh <(curl -L https://nixos.org/nix/install) --no-daemon
# Then source the profile:
. ~/.nix-profile/etc/profile.d/nix.sh
```

Install all Nix packages:

```bash
nix-env -iA \
  nixpkgs.bat \
  nixpkgs.curl \
  nixpkgs.discord \
  nixpkgs.fd \
  nixpkgs.gcc \
  nixpkgs.gh \
  nixpkgs.go \
  nixpkgs.google-chrome \
  nixpkgs.htop \
  nixpkgs.jq \
  nixpkgs.nodejs \
  nixpkgs.openssl \
  nixpkgs.pkg-config \
  nixpkgs.ripgrep \
  nixpkgs.rustup \
  nixpkgs.SDL2 \
  nixpkgs.SDL2_gfx \
  nixpkgs.SDL2_image \
  nixpkgs.SDL2_mixer \
  nixpkgs.SDL2_ttf \
  nixpkgs.slack \
  nixpkgs.tree \
  nixpkgs.ulauncher \
  nixpkgs.vscode \
  nixpkgs.wget
```

After Nix is set up, initialize Rust:

```bash
rustup default stable
```

### 2b. Homebrew / Linuxbrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"
```

Install Brew packages:

```bash
brew install \
  claude-code \
  difftastic \
  ffmpeg \
  happy-coder \
  pnpm \
  python@3.14 \
  sdl2 \
  trash-cli \
  uv \
  vercel-cli \
  xclip \
  yarn
```

### 2c. apt (system packages)

```bash
sudo apt update && sudo apt install -y \
  build-essential \
  cmake \
  clang \
  git \
  qutebrowser \
  vim
```

### 2d. Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

---

## 3. Tailscale

Tailscale is used for networking between devices. The tailnet includes:
- `lnx` — this Linux workstation
- `homeassistant` — Home Assistant (offers exit node)
- `ipad-pro-12-9-gen-4` — iPad
- `iphone182` — iPhone
- `trilliums-macbook-pro` — MacBook Pro

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo systemctl enable --now tailscaled
sudo tailscale up
```

After login, Tailscale also serves the OpenClaw gateway (see section 10).
Enable `tailscale serve` once the openclaw-gateway service is running:

```bash
sudo tailscale serve --bg --https=443 http://127.0.0.1:18789
```

---

## 4. Shell Configuration

Shell is **bash** (default). Set up `~/.bashrc` with these additions at the end
(after the default Mint bashrc content):

```bash
# Homebrew
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"

# Local bin
export PATH="$HOME/.local/bin:$PATH"

# Go
export PATH="$HOME/go/bin:$PATH"

# pnpm
export PNPM_HOME="/home/trillium/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Nix
export PATH="$HOME/.nix-profile/bin:$PATH"

# Rust
. "$HOME/.cargo/env"

# pkg-config
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}

# Happy / Claude aliases
alias yolo='happy --yolo'
alias Yolo='happy --yolo'
alias forced_yolo='unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT && happy --yolo'

# Safe rm — move to trash instead of permanent delete
alias rm='trash-put'

# Directory navigation
alias ..='cd .. && ls'
alias ...='cd ../.. && ls'
alias ....='cd ../../.. && ls'
alias .....='cd ../../../.. && ls'
```

Set up `~/.profile` to source Nix and Cargo:

```bash
# (after default content)
if [ -e /home/trillium/.nix-profile/etc/profile.d/nix.sh ]; then
  . /home/trillium/.nix-profile/etc/profile.d/nix.sh
fi
. "$HOME/.cargo/env"
```

---

## 5. Git Configuration

```bash
git config --global user.name "Trillium Smith"
git config --global user.email "trillium@trilliumsmith.com"
```

Git credentials are managed via `gh auth login`:

```bash
gh auth login
# Choose: GitHub.com → HTTPS → Login with a web browser
```

---

## 6. SSH Keys

Generate a new SSH key and add to GitHub:

```bash
ssh-keygen -t ed25519 -C "trillium@trilliumsmith.com"
gh ssh-key add ~/.ssh/id_ed25519.pub --title "new-machine"
```

---

## 7. VS Code

VS Code is installed via Nix (see section 2a). Install these extensions:

```bash
code --install-extension anthropic.claude-code
code --install-extension pokey.command-server
code --install-extension pokey.cursorless
code --install-extension pokey.parse-tree
```

---

## 8. Talon (Voice Control)

Talon is the voice control system — this is critical infrastructure.

### 8a. Install Talon

Download and install from https://talonvoice.com. Follow their Linux install instructions.

### 8b. Clone the voice command repo

```bash
cd ~/.talon/user
git clone https://github.com/trillium/trillium_talon.git talon_community
cd talon_community
git checkout restore-from-original
git remote add knausj https://github.com/knausj85/knausj_talon.git
```

The repo includes:
- Community Talon commands (forked from knausj)
- Custom commands in `trillium/` directory
- Parrot noise integration (mode switching, scroll, click by sound)
- Recall plugin (voice-activated window management)
- Mode indicator with Anthropic API usage display
- Slash commands plugin for Claude Code
- Dictation replacements and vocabulary

### 8c. Cursorless for Talon

```bash
cd ~/.talon/user
git clone https://github.com/cursorless-dev/cursorless-talon.git cursorless-talon-dev
```

### 8d. Cursorless settings

The `cursorless-settings/` directory in `talon_community` has settings — it should work as-is after cloning.

---

## 9. Claude Code Configuration

### 9a. Config files

Create `~/.claude/CLAUDE.md` with these global instructions:

```markdown
# Claude Code Instructions

## Research First
When asked about APIs, behavior, conventions, or any technical claim — always verify
on the web (wiki, docs, search) before acting. Do not rely on trained knowledge or
make assumptions. Look it up first.

## Forbidden Tools
**NEVER** use the `AskUserQuestion` tool. Just ask questions directly in your response text.

## Beads (Issue Tracking)
[Beads](https://github.com/steveyegge/beads) is installed at `~/.local/bin/bd` (v0.49.6).
It's an AI-native issue tracker that lives in the repo.

- **Data**: `.beads/issues.jsonl` + `beads.db` (SQLite)
- **WARNING**: `bd edit` opens vim — doesn't work non-interactively. Use `bd update` instead.

**Core commands:**
- `bd list` / `bd ready` / `bd blocked` — find work
- `bd show <id>` — issue details
- `bd create "Title" -d "desc" -p 2 -l "label1,label2"` — create issue
- `bd update <id> --status <status>` — update (also: --title, -d, --notes, --add-label)
- `bd close <id>` — close (supports multiple: `bd close <id1> <id2>`)

**Dependencies:**
- `bd dep <blocker> -b <blocked>` — blocker blocks blocked
- `bd dep add <issue> <depends-on>` — issue depends on depends-on
- `bd dep tree <id>` — dependency tree

**Epics & Parent-Child:**
- `bd create "Title" -t epic` — create an epic
- `bd create "Child" --parent <full-id>` — create child (**MUST use full ID with prefix**)
- `bd children <id>` — list children
- `bd epic status <id>` — epic completion progress

### Beads Aliases
| Command | Database location | Purpose |
|---------|------------------|---------|
| `bd` | `.beads/` in current repo | Default beads in current project |
| `ops` | `.ops/` in current repo | Ops-flavored beads |
| `friction` | `~/.friction/.beads/` | Personal friction log |
| `idea` | `~/.idea/.beads/` | Idea capture |
| `tool-errors` | `~/.tool-errors/.beads/` | Agent self-reporting |

### tool-errors: Agent Self-Reporting
Use `tool-errors` proactively to log issues with your own tooling and environment.
```

### 9b. Settings

Create `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  },
  "enabledPlugins": {
    "ralph-loop@claude-plugins-official": true,
    "context7@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "rust-analyzer-lsp@claude-plugins-official": true
  },
  "alwaysThinkingEnabled": false,
  "skipDangerousModePermissionPrompt": true,
  "promptSuggestionEnabled": false
}
```

### 9c. Claude Plugins

Install from the official marketplace:
- **ralph-loop** — Ralph Loop agent plugin
- **context7** — Documentation lookup via Context7
- **frontend-design** — Frontend design generation
- **rust-analyzer-lsp** — Rust LSP integration

### 9d. Custom slash commands

Create `~/.claude/commands/clean-code-review.md` and `~/.claude/commands/linus-review.md`
(these are PR review commands — copy from the old machine or from this repo).

### 9e. CCLine status bar

CCLine is a compiled binary for the Claude Code status line. It needs to be built or
copied to `~/.claude/ccline/ccline`. Check if it's available as a Nix package or
build from source.

---

## 10. Custom Scripts (`~/.local/bin/`)

Create these scripts:

### `~/.local/bin/friction`
```bash
#!/bin/sh
exec env BEADS_DIR="$HOME/.friction/.beads" BD_NAME=friction bd "$@"
```

### `~/.local/bin/idea`
```bash
#!/bin/sh
exec env BEADS_DIR="$HOME/.idea/.beads" BD_NAME=idea bd "$@"
```

### `~/.local/bin/tool-errors`
```bash
#!/bin/sh
exec env BEADS_DIR="$HOME/.tool-errors/.beads" BD_NAME=tool-errors bd "$@"
```

### `~/.local/bin/ops`
```bash
#!/bin/bash
export BEADS_DIR=.ops
exec bd "$@"
```

### `~/.local/bin/rotate-wallpaper.sh`
```bash
#!/bin/bash
DIR="$HOME/Pictures/wallpapers"
WALLPAPER=$(find "$DIR" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
if [ -n "$WALLPAPER" ]; then
  gsettings set org.cinnamon.desktop.background picture-uri "file://$WALLPAPER"
fi
```

Make all scripts executable:

```bash
chmod +x ~/.local/bin/{friction,idea,tool-errors,ops,rotate-wallpaper.sh}
```

### `bd` (beads binary)

The `bd` binary is compiled from https://github.com/steveyegge/beads. Install it:

```bash
# Check if there's a release binary, otherwise build from source
# Place the binary at ~/.local/bin/bd
```

### `speak` (TTS utility)

The `speak` script is a local TTS tool using **Kokoro** (default) or **Piper** engines.
Copy it from the old machine or from `~/code/speak/`. It lives at `~/.local/bin/speak`
and stores voice models in `~/.local/share/speak/`.

---

## 11. Helper Scripts (`~/bin/`)

```bash
mkdir -p ~/bin
```

These utility scripts were in `~/bin/`:
- `memwatch.sh` — Kills runaway processes before OOM
- `proclog.sh` — Logs process resource usage
- `proclog-query.sh` — Query process logs
- `rust-analyzer-limited` — Wrapper to run rust-analyzer with resource limits

Copy these from the old machine.

---

## 12. Systemd User Services

Create these service files in `~/.config/systemd/user/`:

### `apple-refurb-chrome.service`
```ini
[Unit]
Description=Headless Chrome for Apple refurb scraper

[Service]
Type=simple
ExecStart=/home/trillium/.nix-profile/bin/google-chrome-stable --remote-debugging-port=9222 --headless=new --no-sandbox --disable-gpu
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

### `apple-refurb-watcher.service`
```ini
[Unit]
Description=Apple refurb Mac Mini watcher with Telegram notifications
After=apple-refurb-chrome.service
Requires=apple-refurb-chrome.service

[Service]
Type=simple
Environment=PATH=/home/trillium/.nix-profile/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/trillium/.nix-profile/bin/node /home/trillium/code/refurbished_apple/apple-refurb-monitor/scraper.js mac --watch --telegram --filter "mac mini"
Restart=on-failure
RestartSec=5
WorkingDirectory=/home/trillium/code/refurbished_apple/apple-refurb-monitor

[Install]
WantedBy=default.target
```

### `openclaw-gateway.service`
```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/home/linuxbrew/.linuxbrew/bin/node /home/trillium/openclaw/dist/index.js gateway --port 18789 --bind loopback --tailscale serve
Restart=always
RestartSec=5
KillMode=process
Environment=HOME=/home/trillium
Environment=OPENCLAW_GATEWAY_PORT=18789
Environment="OPENCLAW_SYSTEMD_UNIT=openclaw-gateway.service"
Environment=OPENCLAW_SERVICE_MARKER=openclaw
Environment=OPENCLAW_SERVICE_KIND=gateway

[Install]
WantedBy=default.target
```

**Note**: The `OPENCLAW_GATEWAY_TOKEN` environment variable needs to be set — ask Trillium for the token value. Do NOT hardcode it.

### `poll-usage.service`
```ini
[Unit]
Description=Poll Anthropic API usage for mode indicator

[Service]
ExecStart=/usr/bin/python3 /home/trillium/.talon/user/talon_community/trillium/plugin/mode_indicator/poll_usage.py
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
```

### `memwatch.service`
```ini
[Unit]
Description=Memory watchdog — kill runaway processes before OOM
After=default.target

[Service]
Type=simple
ExecStart=/home/trillium/bin/memwatch.sh 5
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

### `proclog.service`
```ini
[Unit]
Description=Process resource logger (proclog)
After=default.target

[Service]
Type=simple
ExecStart=/home/trillium/bin/proclog.sh 3 /home/trillium/logs 50
Restart=always
RestartSec=5

[Install]
WantedBy=default.target
```

Enable and start all services:

```bash
mkdir -p ~/.config/systemd/user
# (copy all .service files above)
systemctl --user daemon-reload
systemctl --user enable --now apple-refurb-chrome apple-refurb-watcher
systemctl --user enable --now openclaw-gateway
systemctl --user enable --now poll-usage
systemctl --user enable --now memwatch
systemctl --user enable --now proclog
```

---

## 13. Crontab

```bash
crontab -e
# Add:
*/15 * * * * DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus /home/trillium/.local/bin/rotate-wallpaper.sh
```

---

## 14. Applications to Install (non-package-manager)

These may need manual installation:

- **Zoom** — Download from https://zoom.us/download
- **Talon** — Download from https://talonvoice.com
- **Min browser** — https://minbrowser.org

---

## 15. Clone All Projects

```bash
mkdir -p ~/code

# Active projects
git clone https://github.com/trillium/trillium_talon.git ~/code/talon
cd ~/code/talon && git checkout feature/recall-plugin

git clone https://github.com/trillium/massage.git ~/code/massage
git clone https://github.com/trillium/talon_recall.git ~/code/recall
git clone https://github.com/trillium/parrot.py.git ~/code/parrot
git clone https://github.com/trillium/beads.git ~/code/beads
git clone https://github.com/trillium/awesome-talon.git ~/code/awesome-talon
git clone https://github.com/trillium/row_tracker.git ~/code/row_tracker
git clone https://github.com/trillium/torc.git ~/torc
git clone https://github.com/openclaw/openclaw.git ~/openclaw
git clone https://github.com/trillium/CCometixLine.git ~/code/CCometixLine

# Zed editor fork (Rust — large repo)
git clone https://github.com/trillium/zed.git ~/code/zed
cd ~/code/zed && git checkout feature/decoration-api

# Cursorless fork
git clone https://github.com/cursorless-dev/cursorless.git ~/code/cursorless
cd ~/code/cursorless && git remote add trillium https://github.com/trillium/cursorless.git
git checkout feature/zed-integration

# VRMS (Hack for LA)
git clone https://github.com/hackforla/VRMS.git ~/code/vrms
git clone https://github.com/hackforla/VRMS.git ~/VRMS
```

---

## 16. Beads Databases

These contain issue tracking data. Copy from the old machine:

```bash
# On old machine, tar them up:
tar czf beads-data.tar.gz ~/.friction/.beads ~/.idea/.beads ~/.tool-errors/.beads

# On new machine:
tar xzf beads-data.tar.gz -C /
```

Counts on old machine:
- `~/.friction/.beads/` — 20 issues (personal friction log)
- `~/.idea/.beads/` — 28 issues (idea capture)
- `~/.tool-errors/.beads/` — 2 issues (agent self-reporting)

---

## 17. Wallpapers

Copy `~/Pictures/wallpapers/` from the old machine. The crontab rotates through
these every 15 minutes.

---

## 18. Secrets & Tokens (ask Trillium)

These need to be manually configured — do NOT copy from this file:

- **Anthropic API key** — needed for `poll-usage.py` (Talon mode indicator)
- **OPENCLAW_GATEWAY_TOKEN** — for the openclaw-gateway systemd service
- **SUPABASE_ACCESS_TOKEN** — add to `~/.bashrc` if still needed
- **Telegram bot token** — for the apple-refurb-watcher notifications
- **`gh auth login`** — GitHub CLI authentication
- **`tailscale up`** — Tailscale login

---

## 19. Verification Checklist

After setup, verify each of these works:

- [ ] `node --version` → 24.x
- [ ] `python3 --version` → 3.14.x
- [ ] `rustc --version` → 1.93+
- [ ] `go version` → 1.25+
- [ ] `gh auth status` → logged in
- [ ] `tailscale status` → shows all devices
- [ ] `code --version` → VS Code runs
- [ ] `claude --version` → Claude Code runs
- [ ] `happy --version` → Happy runs
- [ ] `bd --version` → Beads runs
- [ ] `friction list` → shows friction log issues
- [ ] `idea list` → shows idea issues
- [ ] Talon is running and responding to voice
- [ ] Cursorless works in VS Code
- [ ] `systemctl --user status apple-refurb-watcher` → active
- [ ] `systemctl --user status openclaw-gateway` → active
- [ ] `systemctl --user status poll-usage` → active
- [ ] Chrome opens
- [ ] Discord opens
- [ ] Slack opens
- [ ] Ulauncher launches with its hotkey
- [ ] Wallpaper rotates (run `~/.local/bin/rotate-wallpaper.sh` manually to test)
