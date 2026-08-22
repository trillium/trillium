---
name: fleet
description: Read, search, copy, or run commands against files on Trillium's other machines (macbook, mini2, mini3) over SSH/Tailscale. Use whenever the user asks to look at, fetch, or interact with something that lives on another machine in the fleet.
---

# Fleet: working with files on other machines

All machines share one Tailscale tailnet with passwordless SSH aliases,
managed by the `fleet-ssh-sync` block in `~/.ssh/config` (never hand-edit
that block):

| Alias     | Machine           | SSH user      |
| --------- | ----------------- | ------------- |
| `macbook` | MacBook Pro       | trilliumsmith |
| `mini2`   | Mac mini 2        | mini2         |
| `mini3`   | Mac mini 3 (2020) | 2020mini_2    |

Check liveness first if unsure: `tailscale status` (macOS CLI may be at
`/Applications/Tailscale.app/Contents/MacOS/Tailscale`).

## Recipes

```bash
# Run a command / read a file
ssh macbook 'ls ~/code'
ssh macbook 'cat ~/code/some/file'

# Copy a file locally for heavy reading or editing (prefer the scratchpad)
scp macbook:code/some/file "$SCRATCHPAD/file"

# Find things (Spotlight index or find)
ssh macbook 'mdfind -name <term> | head'
ssh macbook 'find ~/code -maxdepth 2 -iname "*term*" -not -path "*/node_modules/*"'

# Search shell history for how a tool is actually invoked
ssh macbook 'grep -i <term> ~/.zsh_history | tail'

# Resolve what a command really is (functions/aliases need an interactive shell)
ssh macbook 'zsh -ic "which -a <cmd>; type <cmd>"'
```

## Caveats

- **Non-interactive SSH shells don't load zshrc functions or aliases.** A
  command that "exists" interactively may be a function — resolve it with
  `zsh -ic 'type <cmd>'` and call the underlying script directly.
- **Nix machines shadow BSD tools with GNU coreutils** (e.g. the MacBook).
  Scripts written for BSD flags (like `date -j`) need
  `PATH=/bin:/usr/bin:$PATH` prefixed to the remote command.
- Quote remote paths/globs so they expand on the remote side, not locally.
- Read/copy freely, but treat remote writes, deletes, git operations, and
  anything with side effects (Slack posts, force-pushes) as actions needing
  an explicit user ask.
- For multi-file exploration, `scp` the files to the local scratchpad and
  read there rather than making many round-trips.
