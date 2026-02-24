# New Computer Setup — Agent Instructions

You are setting up a new **macOS** workstation for Trillium (trillium@trilliumsmith.com).
This repo contains all the config files, scripts, and data needed to reproduce the
previous environment. Everything referenced below is committed to this repo under `config/`.

**Previous machine**: Linux Mint 22.3 (Cinnamon desktop) on x86_64.
**New machine**: macOS (Mac).

Many config files in `config/` were written for Linux. Where noted, you will need to
adapt paths and commands to macOS equivalents. The shell scripts in `config/scripts/`
are portable (sh/bash), but systemd services must be converted to launchd plists.

Work through each section in order. Ask before making substitutions or skipping anything.

## Repo Layout

```
config/
├── bashrc_additions.sh          # Shell config additions (adapt for macOS — see section 4)
├── profile_additions.sh         # Login shell additions (adapt for macOS)
├── scripts/                     # → copy to ~/.local/bin/
│   ├── bead-review              # Beads review helper
│   ├── bead-ship                # Beads ship helper
│   ├── friction                 # Beads alias for friction log
│   ├── fumble                   # Error capture (reads last failed command)
│   ├── idea                     # Beads alias for idea capture
│   ├── ops                      # Beads alias for ops
│   ├── recall-set-path          # Talon recall path setter
│   ├── recall-test              # Talon recall test script
│   ├── rotate-wallpaper.sh      # Wallpaper rotator (needs macOS adaptation)
│   ├── speak                    # Local TTS (Kokoro/Piper)
│   ├── talon                    # Talon voice control integration
│   ├── task                     # System-wide beads tracker (~/.task/.beads/)
│   └── tool-errors              # Beads alias for agent self-reporting
├── bin/                         # → copy to ~/bin/
│   ├── memwatch.sh              # OOM prevention watchdog
│   ├── proclog.sh               # Process resource logger
│   ├── proclog-query.sh         # Query process logs
│   └── rust-analyzer-limited    # Resource-limited rust-analyzer
├── systemd/                     # Linux systemd services (convert to launchd on macOS)
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

macOS should already be installed. Ensure:
- Xcode Command Line Tools are installed: `xcode-select --install`
- The user account name is `trillium` (or adapt paths below accordingly)

### Full Xcode (required for Zed/Cursorless development)

After Homebrew is installed (section 2a), install the full Xcode via `xcodes`:

```bash
brew install xcodes
xcodes install --latest
sudo xcode-select -s /Applications/Xcode-*.app/Contents/Developer
sudo xcodebuild -license accept
```

---

## 2. Package Managers

Install these in order — later tools depend on earlier ones.

### 2a. Homebrew (primary on macOS)

Homebrew is the primary package manager on macOS.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Install Brew packages:

```bash
brew install \
  antigen \
  bat \
  chruby \
  claude-code \
  cmake \
  curl \
  difftastic \
  fd \
  ffmpeg \
  fnm \
  gcc \
  gh \
  go \
  google-chrome \
  happy-coder \
  htop \
  jq \
  node \
  openssl \
  pkg-config \
  pnpm \
  python@3.14 \
  ripgrep \
  ruby-install \
  rustup \
  sdl2 \
  sdl2_gfx \
  sdl2_image \
  sdl2_mixer \
  sdl2_ttf \
  thefuck \
  trash-cli \
  tree \
  uv \
  vercel-cli \
  vim \
  wget \
  xcodes \
  yarn
```

After Brew is set up, initialize Rust:

```bash
rustup default stable
```

Install Ruby via ruby-install (managed by chruby):

```bash
ruby-install ruby 3.2.2
```

### 2b. Nix (optional — was primary on Linux, now supplementary)

Nix can still be installed on macOS if desired, but Homebrew covers most tools.
If Trillium wants Nix:

```bash
sh <(curl -L https://nixos.org/nix/install)
. ~/.nix-profile/etc/profile.d/nix.sh
```

### 2c. Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2d. GUI Applications via Brew Cask

```bash
brew install --cask \
  discord \
  firefox \
  google-chrome \
  karabiner-elements \
  min \
  obs \
  qutebrowser \
  raycast \
  rode-connect \
  slack \
  visual-studio-code \
  zoom
```

---

## 3. Tailscale

Tailscale is used for networking between devices. The tailnet includes:
- `lnx` — the old Linux workstation
- `homeassistant` — Home Assistant (offers exit node)
- `ipad-pro-12-9-gen-4` — iPad
- `iphone182` — iPhone
- `trilliums-macbook-pro` — this Mac

Install via Brew or Mac App Store:

```bash
brew install --cask tailscale
```

Then open Tailscale from Applications and sign in.

After login, Tailscale also serves the OpenClaw gateway (see section 13).
Enable `tailscale serve` once the openclaw-gateway service is running:

```bash
tailscale serve --bg --https=443 http://127.0.0.1:18789
```

---

## 4. Shell Configuration

macOS uses **zsh** by default. Adapt the config for `~/.zshrc` (or `~/.bashrc` if
Trillium switches to bash).

Use `config/bashrc_additions.sh` as a reference but adapt paths for macOS:

```bash
# Append to ~/.zshrc (or ~/.bashrc if using bash):

# Ensure system paths are always present (VS Code terminal can start with minimal PATH)
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
export PATH="$HOME/bin:$PATH"

# Homebrew (Apple Silicon path)
eval "$(/opt/homebrew/bin/brew shellenv)"

# Local bin
export PATH="$HOME/.local/bin:$PATH"

# Go
export PATH="$HOME/go/bin:$PATH"

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"

# Nix (if installed)
[ -e "$HOME/.nix-profile/etc/profile.d/nix.sh" ] && . "$HOME/.nix-profile/etc/profile.d/nix.sh"

# Rust (rustup is keg-only on macOS)
export PATH="/opt/homebrew/opt/rustup/bin:$PATH"
[[ -f "$HOME/.cargo/env" ]] && . "$HOME/.cargo/env"

# trash-cli (keg-only on macOS)
export PATH="/opt/homebrew/opt/trash-cli/bin:$PATH"

# fnm (fast node manager) — reads .nvmrc, auto-switches on cd
eval "$(fnm env --use-on-cd --shell zsh)"

# chruby (Ruby version manager)
source /opt/homebrew/opt/chruby/share/chruby/chruby.sh
source /opt/homebrew/opt/chruby/share/chruby/auto.sh
chruby ruby-3.2.2

# thefuck — command correction (cached alias generation)
_thefuck_cache=~/.cache/thefuck-aliases.zsh
_thefuck_bin=$(command -v thefuck)
if [[ ! -f "$_thefuck_cache" || "$_thefuck_bin" -nt "$_thefuck_cache" ]]; then
  thefuck --alias FUCK > "$_thefuck_cache" && thefuck --alias fuck >> "$_thefuck_cache"
fi
source "$_thefuck_cache"
unset _thefuck_cache _thefuck_bin

# Antigen (zsh plugin manager)
source /opt/homebrew/share/antigen/antigen.zsh
antigen init ~/.antigenrc

# Worktree Wrangler — git worktree management
mkdir -p ~/.local/share/zsh/site-functions
fpath=(~/.local/share/zsh/site-functions $fpath)
if [[ -f ~/.local/share/worktree-wrangler/worktree-wrangler.zsh ]]; then
    source ~/.local/share/worktree-wrangler/worktree-wrangler.zsh
fi

# OpenClaw completions
[[ -f ~/.openclaw/completions/openclaw.zsh ]] && source ~/.openclaw/completions/openclaw.zsh
export OPS_DIR="$HOME/.openclaw/.ops"

# Gas Town shell hook integration
[[ -f "$HOME/.config/gastown/shell-hook.sh" ]] && source "$HOME/.config/gastown/shell-hook.sh"

# Terminal title: show full working directory for Talon recall path detection
_talon_title_precmd() { printf '\e]1;%s\a' "${PWD/#$HOME/~}"; }
autoload -U add-zsh-hook
add-zsh-hook precmd _talon_title_precmd

# Happy / Claude aliases
yolo() {
  unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT
  happy --yolo "$@"
}
Yolo() { yolo "$@"; }
alias forced_yolo='unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT && happy --yolo'

# Safe rm — move to trash instead of permanent delete
alias rm='trash-put'

# Directory navigation
alias ..='cd .. && ls'
alias ...='cd ../.. && ls'
alias ....='cd ../../.. && ls'
alias .....='cd ../../../.. && ls'
```

**IMPORTANT**: After setting up, manually add any secret tokens (Supabase, etc.)
to the bottom of the shell rc file. They are NOT in the committed file.

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
gh ssh-key add ~/.ssh/id_ed25519.pub --title "macbook"
```

---

## 7. Karabiner-Elements (Keyboard Remapping)

Karabiner-Elements is installed via Brew Cask (section 2d). It's used to remap
Capslock to a Super key (acts as hyper modifier).

Configuration lives at `~/.config/karabiner/`. If a config is backed up in this
repo under `config/karabiner/`, copy it:

```bash
mkdir -p ~/.config/karabiner
cp -r config/karabiner/* ~/.config/karabiner/
```

Open Karabiner-Elements from Applications and grant the required accessibility
permissions when prompted.

---

## 8. VS Code

VS Code is installed via Brew Cask (section 2d). Install these extensions:

```bash
code --install-extension anthropic.claude-code
code --install-extension pokey.command-server
code --install-extension pokey.cursorless
code --install-extension pokey.parse-tree
```

---

## 9. Talon (Voice Control)

Talon is the voice control system — this is **critical infrastructure**.

### 8a. Install Talon

Download and install from https://talonvoice.com. Follow their **macOS** install
instructions. Talon runs natively on macOS.

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

**Note**: Some commands in the `trillium/` directory have Linux-specific code paths.
The repo already has macOS support for most features (it was originally developed on
macOS). Check for any `platform: linux` contexts that may need `platform: mac` equivalents.

### 8c. Cursorless for Talon

```bash
cd ~/.talon/user
git clone https://github.com/cursorless-dev/cursorless-talon.git cursorless-talon-dev
```

### 8d. Cursorless settings

The `cursorless-settings/` directory in `talon_community` has settings — it works as-is after cloning.

---

## 10. Claude Code Configuration

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
It needs to be built from source for macOS (the Linux binary won't work).
See PROJECTS.md section on CCometixLine for build instructions.

---

## 11. Install Scripts

### `~/.local/bin/` scripts (from this repo)

```bash
mkdir -p ~/.local/bin
cp config/scripts/* ~/.local/bin/
chmod +x ~/.local/bin/*
```

This installs: `friction`, `fumble`, `idea`, `ops`, `recall-set-path`, `recall-test`,
`rotate-wallpaper.sh`, `speak`, `talon`, `task`, `tool-errors`, `bead-review`, `bead-ship`

**Note on `rotate-wallpaper.sh`**: The Linux version uses `gsettings` for Cinnamon.
On macOS, replace the wallpaper command with:
```bash
osascript -e "tell application \"Finder\" to set desktop picture to POSIX file \"$WALLPAPER\""
```

**Note on `speak`**: The speak script uses `aplay` (Linux ALSA) for audio playback.
On macOS, replace `aplay -r 24000 -f S16_LE -c 1 -t raw -q` with:
```bash
afplay
```
Or use `sox` (`brew install sox`) with `play -r 24000 -b 16 -e signed -c 1 -t raw -`.
See PROJECTS.md for full speak setup instructions.

### Worktree Wrangler

Worktree Wrangler provides git worktree management via zsh. Clone and install:

```bash
git clone https://github.com/trillium/worktree-wrangler.git ~/code/worktree-wrangler
cd ~/code/worktree-wrangler
./install.sh
```

This installs to `~/.local/share/worktree-wrangler/` and is sourced from `~/.zshrc`
(see section 4).

### `bd` / `beads` binary

The `bd` binary is NOT in this repo (it's a compiled Go binary).
Install from https://github.com/steveyegge/beads/releases:

```bash
# Download the latest darwin-arm64 (Apple Silicon) or darwin-amd64 (Intel) release
# Place at ~/.local/bin/bd
# Optionally symlink: ln -s ~/.local/bin/bd ~/.local/bin/beads
chmod +x ~/.local/bin/bd
```

---

## 12. Helper Scripts (`~/bin/`)

```bash
mkdir -p ~/bin
cp config/bin/* ~/bin/
chmod +x ~/bin/*
```

This installs: `memwatch.sh`, `proclog.sh`, `proclog-query.sh`, `rust-analyzer-limited`

**Note**: `memwatch.sh` and `proclog.sh` may need adaptation for macOS (e.g. `ps` flags,
`/proc` doesn't exist on macOS). Review and adapt before running.

---

## 13. Background Services (launchd — replaces systemd)

macOS uses **launchd** instead of systemd. The `config/systemd/` directory contains
Linux service files that need to be converted to launchd plist files.

Create plist files in `~/Library/LaunchAgents/`:

### `com.trillium.apple-refurb-chrome.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trillium.apple-refurb-chrome</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</string>
        <string>--remote-debugging-port=9222</string>
        <string>--headless=new</string>
        <string>--no-sandbox</string>
        <string>--disable-gpu</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

### `com.trillium.apple-refurb-watcher.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trillium.apple-refurb-watcher</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/trillium/code/refurbished_apple/apple-refurb-monitor/scraper.js</string>
        <string>mac</string>
        <string>--watch</string>
        <string>--telegram</string>
        <string>--filter</string>
        <string>mac mini</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/trillium/code/refurbished_apple/apple-refurb-monitor</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

### `com.trillium.openclaw-gateway.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trillium.openclaw-gateway</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/node</string>
        <string>/Users/trillium/openclaw/dist/index.js</string>
        <string>gateway</string>
        <string>--port</string>
        <string>18789</string>
        <string>--bind</string>
        <string>loopback</string>
        <string>--tailscale</string>
        <string>serve</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>OPENCLAW_GATEWAY_PORT</key>
        <string>18789</string>
        <key>OPENCLAW_GATEWAY_TOKEN</key>
        <string>__REPLACE_WITH_TOKEN__</string>
        <key>OPENCLAW_SYSTEMD_UNIT</key>
        <string>com.trillium.openclaw-gateway</string>
        <key>OPENCLAW_SERVICE_MARKER</key>
        <string>openclaw</string>
        <key>OPENCLAW_SERVICE_KIND</key>
        <string>gateway</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

### `com.trillium.poll-usage.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trillium.poll-usage</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/python3</string>
        <string>/Users/trillium/.talon/user/talon_community/trillium/plugin/mode_indicator/poll_usage.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

**IMPORTANT**: Before loading, edit `com.trillium.openclaw-gateway.plist` and replace
`__REPLACE_WITH_TOKEN__` with the actual token. Ask Trillium for the value.

Load all services:

```bash
# Copy plists to LaunchAgents
cp com.trillium.*.plist ~/Library/LaunchAgents/

# Load them
launchctl load ~/Library/LaunchAgents/com.trillium.apple-refurb-chrome.plist
launchctl load ~/Library/LaunchAgents/com.trillium.apple-refurb-watcher.plist
launchctl load ~/Library/LaunchAgents/com.trillium.openclaw-gateway.plist
launchctl load ~/Library/LaunchAgents/com.trillium.poll-usage.plist
```

### `com.trillium.system-monitor` (from system-monitor repo)

The system-monitor service is installed separately from its own repo:

```bash
cd ~/code/system-monitor
./install.sh
```

This copies the plist to `~/Library/LaunchAgents/` and bootstraps it via `launchctl`.

**Note**: `memwatch` and `proclog` services are Linux-specific and may not be needed
on macOS (macOS has its own memory pressure handling). Skip unless Trillium asks for them.

---

## 14. Wallpaper Rotation (launchd cron equivalent)

On macOS, use a launchd plist instead of crontab. Create
`~/Library/LaunchAgents/com.trillium.rotate-wallpaper.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.trillium.rotate-wallpaper</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/trillium/.local/bin/rotate-wallpaper.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>900</integer>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.trillium.rotate-wallpaper.plist
```

Remember to also update `rotate-wallpaper.sh` to use macOS's `osascript` instead
of `gsettings` (see section 11 note).

---

## 15. Restore Beads Databases

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

## 16. Applications to Install (non-package-manager)

These may need manual installation if not covered by Brew Cask:

- **Talon** — Download from https://talonvoice.com (see section 9)

Most other apps are covered by `brew install --cask` in section 2d.

---

## 17. Clone All Projects

See **PROJECTS.md** for the full list of projects with clone commands, branch info,
remote configuration, and a single clone-everything script.

---

## 18. Wallpapers

Copy `~/Pictures/wallpapers/` from the old machine or transfer separately.
The launchd agent (section 14) rotates through these every 15 minutes.

```bash
mkdir -p ~/Pictures/wallpapers
# Transfer wallpaper files here
```

---

## 19. Secrets & Tokens (ask Trillium)

These need to be manually configured — they are NOT in this repo:

- **Anthropic API key** — needed for `poll-usage.py` (Talon mode indicator)
- **OPENCLAW_GATEWAY_TOKEN** — replace placeholder in openclaw-gateway plist
- **SUPABASE_ACCESS_TOKEN** — add to `~/.zshrc` if still needed
- **Telegram bot token** — for the apple-refurb-watcher notifications
- **`gh auth login`** — GitHub CLI authentication
- **`tailscale` login** — Sign in via Tailscale app
- **`claude auth login`** — Claude Code authentication (if needed)

---

## 20. Verification Checklist

After setup, verify each of these works:

- [ ] `node --version` → 24.x
- [ ] `python3 --version` → 3.14.x
- [ ] `rustc --version` → 1.93+
- [ ] `go version` → 1.25+
- [ ] `ruby --version` → 3.2.2
- [ ] `gh auth status` → logged in
- [ ] `tailscale status` → shows all devices
- [ ] `code --version` → VS Code runs
- [ ] `claude --version` → Claude Code runs
- [ ] `happy --version` → Happy runs
- [ ] `bd --version` → Beads runs
- [ ] `task list` → system-wide task tracker works
- [ ] `friction list` → shows 20 issues
- [ ] `idea list` → shows 28 issues
- [ ] `tool-errors list` → shows 2 issues
- [ ] `fumble view` → error capture works
- [ ] Talon is running and responding to voice
- [ ] Cursorless works in VS Code
- [ ] Karabiner-Elements running (Capslock → Super key)
- [ ] Raycast opens (launcher)
- [ ] `launchctl list | grep trillium` → shows loaded services
- [ ] Chrome opens
- [ ] Discord opens
- [ ] Slack opens
- [ ] OBS opens
- [ ] Wallpaper rotates (run `~/.local/bin/rotate-wallpaper.sh` manually to test)
- [ ] `speak "hello world"` → speaks aloud
- [ ] `thefuck` corrects a typo'd command
- [ ] Worktree Wrangler zsh functions available
