# Computer Setup

Last updated: 2026-02-19 (Linux Mint workstation)

## OS

- **Linux Mint 22.3** (Zena) on kernel 6.14.0
- Desktop: Cinnamon

## Package Managers

- **Nix** (primary for dev tools)
- **Homebrew / Linuxbrew** (supplementary)
- **apt** (system packages)

## Dev Tools

| Tool | Version | Source |
|------|---------|--------|
| Node.js | 24.13.0 | Nix |
| npm | 11.6.2 | Nix |
| Bun | 1.3.9 | ~/.bun |
| Python | 3.14.3 | Brew |
| Rust / Cargo | 1.93.1 | Nix (rustup) |
| Go | 1.25.5 | Nix |
| Git | 2.43.0 | apt |
| GitHub CLI (gh) | 2.86.0 | Nix |
| ripgrep | 15.1.0 | Nix |
| fd | 10.3.0 | Nix |
| bat | 0.26.1 | Nix |
| jq | 1.8.1 | Nix |
| tree | 2.3.1 | Nix |
| difftastic | — | Brew |
| uv | — | Brew |
| pnpm | — | Brew |
| yarn | — | Brew |
| cmake | — | apt |
| clang | 18 | apt |

## Nix Packages

```
bat curl discord fd gcc-wrapper gh go google-chrome htop jq
nodejs openssl pkg-config ripgrep rustup sdl2-compat SDL2_gfx
SDL2_image SDL2_mixer SDL2_ttf slack tree ulauncher vscode wget
```

## Brew Packages (notable)

```
claude-code difftastic ffmpeg happy-coder node pnpm python@3.14
ripgrep sdl2 trash-cli uv vercel-cli xclip yarn
```

## Applications

### Development
- **VS Code** (1.109.0 via Nix)
  - Extensions: `anthropic.claude-code`, `pokey.command-server`, `pokey.cursorless`, `pokey.parse-tree`
- **Claude Code** (via Brew)

### Voice Control
- **Talon** (voice coding / hands-free input)
- **Cursorless** (structural code editing via voice, Talon + VS Code)

### Browsers
- **Google Chrome** (145.x via Nix)
- **Firefox** (system)
- **qutebrowser**
- **Min** (minimal browser)

### Communication
- **Discord** (via Nix)
- **Slack** (via Nix)
- **Thunderbird** (email)
- **Zoom**

### Media
- **Celluloid** (video player)
- **Rhythmbox** (music)

### Utilities
- **Ulauncher** (app launcher)
- **htop** (process viewer)
- **Nemo** (file manager, Cinnamon default)
- **Pix** (image viewer)
- **Drawing** (simple image editor)
- **File Roller** (archives)
- **Timeshift** (system backups)
- **Warpinator** (local file sharing)

## CLI Tools & Scripts (`~/.local/bin/`)

| Script | Purpose |
|--------|---------|
| `bd` / `beads` | AI-native issue tracker ([beads](https://github.com/steveyegge/beads)) |
| `friction` | Personal friction log (beads alias → `~/.friction/.beads/`) |
| `idea` | Idea capture (beads alias → `~/.idea/.beads/`) |
| `tool-errors` | Agent self-reporting (beads alias → `~/.tool-errors/.beads/`) |
| `ops` | Ops beads (beads alias → `.ops/` in repo) |
| `rotate-wallpaper.sh` | Random wallpaper rotation (cron, every 15 min) |
| `speak` | TTS utility |

## Systemd User Services

| Service | Description |
|---------|-------------|
| `apple-refurb-watcher` | Monitors Apple refurb Mac Minis, sends Telegram notifications |
| `apple-refurb-chrome` | Headless Chrome for refurb watcher |
| `openclaw-gateway` | OpenClaw gateway server |
| `poll-usage` | Polls Anthropic API usage for Talon mode indicator |
| `memwatch` | Memory monitoring |
| `proclog` | Process logging |

## Crontab

```
*/15 * * * * rotate-wallpaper.sh  # Random wallpaper from ~/Pictures/wallpapers/
```

## Claude Code Config (`~/.claude/`)

- `CLAUDE.md` — global instructions
- `settings.json` / `settings.local.json` — settings
- `commands/` — custom slash commands
- `plugins/` — plugins (includes claude-plugins-official)
- `projects/` — per-project CLAUDE.md files

---

## Projects

### Active / In Development

| Project | Repo | Description |
|---------|------|-------------|
| **trillium_talon** | [trillium/trillium_talon](https://github.com/trillium/trillium_talon) | Voice command set for Talon — custom commands, parrot integration, recall plugin, mode indicator |
| **massage** | [trillium/massage](https://github.com/trillium/massage) | Trillium Massage scheduling site (Next.js / Tailwind / Google Calendar API) |
| **recall** | [trillium/talon_recall](https://github.com/trillium/talon_recall) | Talon plugin — save and switch between windows by voice |
| **parrot** | [trillium/parrot.py](https://github.com/trillium/parrot.py) | Parrot noise recognition for Talon |
| **beads** | [trillium/beads](https://github.com/trillium/beads) | Fork of beads — distributed, git-backed issue tracker for AI agents |
| **zed** | [trillium/zed](https://github.com/trillium/zed) | Fork of Zed editor — working on decoration API for cursorless integration |
| **zed-cursorless** | local | Cursorless integration for Zed editor |
| **cursorless** | fork of [cursorless-dev/cursorless](https://github.com/cursorless-dev/cursorless) | Working on Zed integration branch |
| **openclaw** | [openclaw/openclaw](https://github.com/openclaw/openclaw) | OpenClaw project |
| **torc** | [trillium/torc](https://github.com/trillium/torc) | Torc project |
| **awesome-talon** | [trillium/awesome-talon](https://github.com/trillium/awesome-talon) | Curated list of Talon resources, command sets, and plugins |
| **apple-refurb-monitor** | local (`~/code/refurbished_apple/`) | Monitors Apple refurb store for Mac Minis, sends Telegram alerts |
| **row_tracker** | [trillium/row_tracker](https://github.com/trillium/row_tracker) | Next.js row tracking app |

### Hack for LA

| Project | Repo | Description |
|---------|------|-------------|
| **VRMS** | [hackforla/VRMS](https://github.com/hackforla/VRMS) | Volunteer Resource Management System — lead developer (React / Express / MongoDB / AWS) |

### Other / Exploratory

| Project | Location | Notes |
|---------|----------|-------|
| `CCometixLine` | [trillium/CCometixLine](https://github.com/trillium/CCometixLine) | — |
| `platform` | `~/code/platform/` | Local only (old + new) |
| `speak` | `~/code/speak/` | TTS tooling |
| `recorder` | `~/code/recorder/` | Audio recording |
| `Word` | `~/code/Word/` | — |

---

## Migration Checklist

When setting up a new machine:

1. **OS & Desktop**: Install Linux Mint (Cinnamon) or preferred distro
2. **Package managers**: Install Nix, then Homebrew
3. **Nix packages**: `nix-env -i` the list above (or use a flake/profile)
4. **Brew packages**: `brew install claude-code happy-coder difftastic pnpm uv yarn vercel-cli trash-cli xclip ffmpeg python@3.14`
5. **Bun**: `curl -fsSL https://bun.sh/install | bash`
6. **Talon**: Install from [talonvoice.com](https://talonvoice.com), clone `trillium/trillium_talon` into `~/.talon/user/`
7. **Cursorless**: Install VS Code extensions (`pokey.cursorless`, `pokey.command-server`, `pokey.parse-tree`)
8. **SSH keys**: Generate new keys, add to GitHub
9. **Clone repos**: See project table above
10. **Claude Code config**: Copy `~/.claude/` (CLAUDE.md, settings, commands, plugins)
11. **Beads databases**: Copy `~/.friction/`, `~/.idea/`, `~/.tool-errors/`
12. **Scripts**: Copy `~/.local/bin/` (bd, friction, idea, tool-errors, ops, rotate-wallpaper.sh, speak)
13. **Systemd services**: Copy `~/.config/systemd/user/*.service`, `systemctl --user daemon-reload && systemctl --user enable <service>`
14. **Crontab**: `crontab -e` and add wallpaper rotation
15. **Wallpapers**: Copy `~/Pictures/wallpapers/`
