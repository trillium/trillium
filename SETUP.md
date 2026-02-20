# New Computer Setup — Agent Instructions

You are setting up a new Linux workstation for Trillium (trillium@trilliumsmith.com).
This repo contains all the config files, scripts, and data needed to reproduce the
previous environment. Everything referenced below is committed to this repo under `config/`.

**Previous machine**: Linux Mint 22.3 (Cinnamon desktop) on x86_64.

Work through each section in order. Ask before making substitutions or skipping anything.

## Repo Layout

```
config/
├── bashrc_additions.sh          # Append to ~/.bashrc
├── profile_additions.sh         # Append to ~/.profile
├── scripts/                     # → copy to ~/.local/bin/
│   ├── friction                 # Beads alias for friction log
│   ├── idea                     # Beads alias for idea capture
│   ├── tool-errors              # Beads alias for agent self-reporting
│   ├── ops                      # Beads alias for ops
│   ├── bead-review              # Beads review helper
│   ├── bead-ship                # Beads ship helper
│   ├── recall-test              # Talon recall test script
│   ├── rotate-wallpaper.sh      # Cinnamon wallpaper rotator
│   └── speak                    # Local TTS (Kokoro/Piper)
├── bin/                         # → copy to ~/bin/
│   ├── memwatch.sh              # OOM prevention watchdog
│   ├── proclog.sh               # Process resource logger
│   ├── proclog-query.sh         # Query process logs
│   └── rust-analyzer-limited    # Resource-limited rust-analyzer
├── systemd/                     # → copy to ~/.config/systemd/user/
│   ├── apple-refurb-chrome.service
│   ├── apple-refurb-watcher.service
│   ├── memwatch.service
│   ├── openclaw-gateway.service  # NOTE: token placeholder, needs real value
│   ├── poll-usage.service
│   └── proclog.service
├── claude/                      # → copy to ~/.claude/
│   ├── CLAUDE.md                # Global Claude Code instructions
│   ├── settings.json            # Claude Code settings
│   ├── settings.local.json      # Local permission settings
│   └── commands/                # Custom slash commands
│       ├── clean-code-review.md
│       └── linus-review.md
└── beads-exports/               # Beads issue tracking databases
    ├── friction-beads/          # → copy to ~/.friction/.beads/
    ├── idea-beads/              # → copy to ~/.idea/.beads/
    ├── tool-errors-beads/       # → copy to ~/.tool-errors/.beads/
    ├── friction-issues.txt      # Human-readable friction log (20 issues)
    ├── idea-issues.txt          # Human-readable idea list (28 issues)
    └── tool-errors-issues.txt   # Human-readable tool-errors (2 issues)
```

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

After login, Tailscale also serves the OpenClaw gateway (see section 12).
Enable `tailscale serve` once the openclaw-gateway service is running:

```bash
sudo tailscale serve --bg --https=443 http://127.0.0.1:18789
```

---

## 4. Shell Configuration

Shell is **bash** (default).

```bash
# Append the bashrc additions from this repo:
cat config/bashrc_additions.sh >> ~/.bashrc

# Append the profile additions:
cat config/profile_additions.sh >> ~/.profile

source ~/.bashrc
```

The file `config/bashrc_additions.sh` includes:
- PATH entries for Nix, Brew, Bun, Go, pnpm, Cargo, `~/.local/bin`
- Aliases: `yolo`/`Yolo` (happy --yolo), `rm` (trash-put), `..`/`...`/etc
- pkg-config paths

**IMPORTANT**: After appending, manually add any secret tokens (Supabase, etc.)
to the bottom of `~/.bashrc`. They are NOT in the committed file.

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

```bash
ssh-keygen -t ed25519 -C "trillium@trilliumsmith.com"
gh ssh-key add ~/.ssh/id_ed25519.pub --title "new-machine"
```

---

## 7. VS Code

VS Code is installed via Nix (section 2a). Install these extensions:

```bash
code --install-extension anthropic.claude-code
code --install-extension pokey.command-server
code --install-extension pokey.cursorless
code --install-extension pokey.parse-tree
```

---

## 8. Talon (Voice Control)

Talon is the voice control system — this is **critical infrastructure**.

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

The `cursorless-settings/` directory in `talon_community` has settings — it works as-is after cloning.

---

## 9. Claude Code Configuration

Copy config files from this repo:

```bash
mkdir -p ~/.claude/commands
cp config/claude/CLAUDE.md ~/.claude/CLAUDE.md
cp config/claude/settings.json ~/.claude/settings.json
cp config/claude/settings.local.json ~/.claude/settings.local.json
cp config/claude/commands/*.md ~/.claude/commands/
```

### Plugins

After Claude Code is running, install these plugins from the official marketplace:
- **ralph-loop** — Ralph Loop agent plugin
- **context7** — Documentation lookup via Context7
- **frontend-design** — Frontend design generation
- **rust-analyzer-lsp** — Rust LSP integration

### CCLine status bar

CCLine is a compiled binary for the Claude Code status line (`~/.claude/ccline/ccline`).
It needs to be built or installed separately — check if it's available as a package
or build from source. The settings.json already references it.

---

## 10. Install Scripts

### `~/.local/bin/` scripts (from this repo)

```bash
mkdir -p ~/.local/bin
cp config/scripts/* ~/.local/bin/
chmod +x ~/.local/bin/*
```

This installs: `friction`, `idea`, `tool-errors`, `ops`, `bead-review`, `bead-ship`,
`recall-test`, `rotate-wallpaper.sh`, `speak`

### `bd` / `beads` binary

The `bd` binary is NOT in this repo (it's a compiled Go binary, ~50MB).
Install from https://github.com/steveyegge/beads/releases:

```bash
# Download the latest linux-amd64 release
# Place at ~/.local/bin/bd
# Optionally symlink: ln -s ~/.local/bin/bd ~/.local/bin/beads
chmod +x ~/.local/bin/bd
```

### `speak` dependencies

The `speak` TTS script uses **Kokoro** (default engine). Voice models are stored
in `~/.local/share/speak/kokoro/`. Run `speak --daemon` to set up on first use.
It also supports **Piper** as an alternative engine.

---

## 11. Helper Scripts (`~/bin/`)

```bash
mkdir -p ~/bin
cp config/bin/* ~/bin/
chmod +x ~/bin/*
```

This installs: `memwatch.sh`, `proclog.sh`, `proclog-query.sh`, `rust-analyzer-limited`

---

## 12. Systemd User Services

```bash
mkdir -p ~/.config/systemd/user
cp config/systemd/*.service ~/.config/systemd/user/
```

**IMPORTANT**: Before enabling, edit `openclaw-gateway.service` and replace
`__REPLACE_WITH_TOKEN__` with the actual `OPENCLAW_GATEWAY_TOKEN` value.
Ask Trillium for the token.

```bash
# Edit the token:
nano ~/.config/systemd/user/openclaw-gateway.service

# Then enable all services:
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
(crontab -l 2>/dev/null; echo '*/15 * * * * DISPLAY=:0 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus /home/trillium/.local/bin/rotate-wallpaper.sh') | crontab -
```

---

## 14. Restore Beads Databases

These are the issue tracking databases — friction log, ideas, and tool-errors.

```bash
mkdir -p ~/.friction ~/.idea ~/.tool-errors
cp -r config/beads-exports/friction-beads ~/.friction/.beads
cp -r config/beads-exports/idea-beads ~/.idea/.beads
cp -r config/beads-exports/tool-errors-beads ~/.tool-errors/.beads
```

Verify:
```bash
friction list   # Should show 20 issues
idea list       # Should show 28 issues
tool-errors list # Should show 2 issues
```

Human-readable exports are also in `config/beads-exports/*.txt` for reference.

---

## 15. Applications to Install (non-package-manager)

These need manual installation:

- **Zoom** — Download from https://zoom.us/download
- **Talon** — Download from https://talonvoice.com (see section 8)
- **Min browser** — https://minbrowser.org

---

## 16. Clone All Projects

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
cd ~/code/cursorless && git remote add trillium https://github.com/trillium/cursorless.git && git checkout feature/zed-integration

# VRMS (Hack for LA)
git clone https://github.com/hackforla/VRMS.git ~/code/vrms
git clone https://github.com/hackforla/VRMS.git ~/VRMS

# Apple refurb monitor (needed for systemd service)
mkdir -p ~/code/refurbished_apple
git clone https://github.com/kanishkaverma/apple-refurb-monitor.git ~/code/refurbished_apple/apple-refurb-monitor
```

---

## 17. Wallpapers

Copy `~/Pictures/wallpapers/` from the old machine or transfer separately.
The crontab (section 13) rotates through these every 15 minutes.

```bash
mkdir -p ~/Pictures/wallpapers
# Transfer wallpaper files here
```

---

## 18. Secrets & Tokens (ask Trillium)

These need to be manually configured — they are NOT in this repo:

- **Anthropic API key** — needed for `poll-usage.py` (Talon mode indicator)
- **OPENCLAW_GATEWAY_TOKEN** — replace placeholder in `openclaw-gateway.service`
- **SUPABASE_ACCESS_TOKEN** — add to `~/.bashrc` if still needed
- **Telegram bot token** — for the apple-refurb-watcher notifications
- **`gh auth login`** — GitHub CLI authentication
- **`tailscale up`** — Tailscale login
- **`claude auth login`** — Claude Code authentication (if needed)

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
- [ ] `friction list` → shows 20 issues
- [ ] `idea list` → shows 28 issues
- [ ] `tool-errors list` → shows 2 issues
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
- [ ] `speak "hello world"` → speaks aloud
