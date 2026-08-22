---
name: row
description: Check rowing stats/streaks or log a row via the row_tracker CLI on the MacBook (SSH over Tailscale). Use when the user asks about the rowing tool, rowing stats, streaks, pace, or logging a row.
---

# Rowing tracker (`row`)

The CLI lives on the **MacBook** at `~/code/row_tracker/row.sh` (part of
github.com/trillium/row_tracker). The interactive `row` command is a zsh
function on the MacBook; over non-interactive SSH, call the script directly.
**Always prefix `PATH=/bin:/usr/bin:$PATH`** — the MacBook's nix setup puts
GNU coreutils first, and `row.sh` requires BSD `date -j` (verified 2026-08-22:
fails with `date: invalid option -- 'j'` without the prefix):

```bash
ssh macbook 'PATH=/bin:/usr/bin:$PATH ~/code/row_tracker/row.sh --dry'
```

## Commands

| Task | Command (all via `ssh macbook 'PATH=/bin:/usr/bin:$PATH ...'`) |
| ---- | ------- |
| Show stats + last-2-weeks view (no side effects) | `~/code/row_tracker/row.sh --dry` |
| Log a row for right now | `~/code/row_tracker/row.sh now` |
| Log a row at a specific time | `~/code/row_tracker/row.sh 2026-08-22T08:15:00-07:00` |
| Replace the last entry | `~/code/row_tracker/row.sh --replace <timestamp>` |
| Re-post last row's stats to Slack | `~/code/row_tracker/row.sh post-slack` |
| Pomodoro timer state (read-only) | `~/code/row_tracker/row.sh pomodoro` |

Timestamps must be ISO 8601 with a colon in the timezone offset
(`YYYY-MM-DDTHH:MM:SS±HH:MM`).

## Cautions

- **Logging is not read-only**: `now` / a timestamp appends to `rows.txt`,
  makes a git commit, pushes, and posts to Slack. Only log when the user
  explicitly asks to record a row; default to `--dry` for questions.
- `--replace` rewrites the last commit and **force-pushes**.
- Never edit `rows.txt` directly — it is the real training log.
- The script self-syncs (fetch + rebase onto origin/main) before committing
  and fails loudly on conflict; report that error rather than resolving in
  the log repo without being asked.
- Streak semantics ("rest-day bank" rule) are documented at the top of
  `row.sh` — read there before explaining or changing streak behavior.
