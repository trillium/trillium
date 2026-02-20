# Claude Code Instructions

## Research First
When asked about APIs, behavior, conventions, or any technical claim — always verify on the web (wiki, docs, search) before acting. Do not rely on trained knowledge or make assumptions. Look it up first.

## Forbidden Tools
**NEVER** use the `AskUserQuestion` tool. Just ask questions directly in your response text.

## Beads (Issue Tracking)
[Beads](https://github.com/steveyegge/beads) is installed at `~/.local/bin/bd` (v0.49.6). It's an AI-native issue tracker that lives in the repo.

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
- `bd create "Child" --parent <full-id>` — create child (**MUST use full ID with prefix**, e.g. `massage-q2t` not `q2t`)
- `bd children <id>` — list children
- `bd epic status <id>` — epic completion progress

### Beads Aliases (separate databases, same `bd` commands)
These are standalone wrappers in `~/.local/bin/` that point `bd` at different beads databases:

| Command | Database location | Purpose |
|---------|------------------|---------|
| `bd` | `.beads/` in current repo | Default beads in current project |
| `ops` | `.ops/` in current repo | Ops-flavored beads (uses `BEADS_DIR=.ops`) |
| `friction` | `~/.friction/.beads/` | Personal friction log — things that slow you down |
| `idea` | `~/.idea/.beads/` | Idea capture — features, bugs, brainstorms |
| `tool-errors` | `~/.tool-errors/.beads/` | Agent self-reporting (see below) |

All aliases accept the same subcommands as `bd` (e.g. `friction list`, `idea create "something"`, `ops show <id>`).

### tool-errors: Agent Self-Reporting
Use `tool-errors` proactively to log issues with your own tooling and environment. If you notice any of the following during a session, create an issue:

- A tool behaves unexpectedly or returns confusing output
- A command fails in a way that seems like a bug (not a user error)
- Something that should work doesn't, and you had to use a workaround
- An API or integration is flaky, slow, or returns bad data
- You spot a gap — something that would make you more effective if it existed
- A workflow feels clunky and could be improved

**Do not ask permission** — just log it. Example: `tool-errors create "nohup doesn't persist in Claude Code bash — need systemd for background scripts"`

Check `tool-errors list` at the start of sessions to see if any past issues are relevant to current work.
