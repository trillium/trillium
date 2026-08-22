# Agent notes — Trillium's machine fleet

Durable knowledge for agent sessions on any of Trillium's machines. Machine
onboarding lives in `SETUP.md`; the full project inventory lives in
`PROJECTS.md`. Keep entries here concise and point to authoritative files
rather than duplicating them.

## Reaching other machines (SSH over Tailscale) — common ask

Directing one machine to interact with files on another is a frequent
request; the `fleet` skill (`.claude/skills/fleet/`) has the full recipes
and caveats. The short version: all machines are on one Tailscale tailnet,
with SSH aliases managed by the `fleet-ssh-sync` block in `~/.ssh/config`
on each node:

| Alias     | Machine          | SSH user      |
| --------- | ---------------- | ------------- |
| `macbook` | MacBook Pro      | trilliumsmith |
| `mini2`   | Mac mini 2       | mini2         |
| `mini3`   | Mac mini 3 (2020)| 2020mini_2    |

`ssh macbook '<command>'` and `scp macbook:path localpath` work directly —
keys are already in place, no password prompts. Check peer liveness with
`tailscale status` (the Tailscale CLI may be at
`/Applications/Tailscale.app/Contents/MacOS/Tailscale` on macOS). Do not
hand-edit the fleet-ssh-sync block; it is overwritten by the sync tool.

## The rowing tool (`row`)

The rowing tracker CLI **is part of the row_tracker repo**
(github.com/trillium/row_tracker). It lives on the MacBook:

- Script: `~/code/row_tracker/row.sh` (committed to the repo). The `row`
  command is a zsh function in `~/.zshrc.pre-nix` on the MacBook that wraps it.
- Data: `~/code/row_tracker/rows.txt` — the real training log, one ISO 8601
  timestamp per row. **Never edit rows.txt by hand** (per the repo's
  AGENTS.md); copy it into fixtures for testing instead.
- The same repo also contains a Next.js web view (`src/`); the CLI and its
  streak logic are entirely in `row.sh`, not `src/`.

Usage (`row --help` is authoritative):

- `row` / `row --dry` — show stats without logging
- `row now` or `row <YYYY-MM-DDTHH:MM:SS±HH:MM>` — log a row: appends to
  rows.txt, git commits and pushes, and posts stats to Slack (creds in the
  untracked `.slack-creds` file)
- `row --replace <timestamp>` — replace the last entry (rewrites the last
  commit and force-pushes)
- `row post-slack` — re-post the last logged row's stats without logging
- `row pomodoro` — read-only view of the Talon Pomodoro timer state
  (`~/.talon/pomodoro-state.json`, owned by the Talon side)

Sharp edges: `row.sh` fetches and rebases onto origin/main before every
commit (multi-machine safe, fails loudly on conflict). Streaks use the
"rest-day bank" rule documented at the top of `row.sh`; its bash tests run
with `npm run test:sh` in the repo (Jest covers only the web view). Over
SSH, run it as `PATH=/bin:/usr/bin:$PATH ~/code/row_tracker/row.sh ...` —
the MacBook's nix PATH puts GNU date first and the script needs BSD
`date -j`. See also the `row` skill in `.claude/skills/row/`.
