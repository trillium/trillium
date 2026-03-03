# Adding a Compute Node to Gas Town

This guide documents how to onboard a new machine as a satellite compute node
in a multi-machine Gas Town fleet. The satellite runs polecats/workers and
connects to the central Dolt server on the primary machine.

**Prerequisite**: Complete the hardware setup first — see [Mac Mini Satellite](./MAC-MINI-SATELLITE.md) or [Linux Satellite](./LINUX-SATELLITE.md).

**Architecture:**
```
Primary machine (e.g., macbookpro)     Satellite node (e.g., mini)
├── Dolt server (port 3307)             ├── bd → connects to primary Dolt
├── gt daemon (patrol, backup)          ├── polecats (workers)
└── mayor session                       └── gt rigs (registered)
```

---

## Prerequisites

On the new node, install:

```bash
# macOS
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install go git tmux gh

# Install Dolt (see https://github.com/dolthub/dolt)
brew install dolt

# Install Gas Town and Beads
go install github.com/steveyegge/gastown/cmd/gt@latest
go install github.com/steveyegge/beads/cmd/bd@latest

# Install Claude Code (default agent)
# See https://claude.ai/claude-code
npm install -g @anthropic-ai/claude-code
```

Ensure `~/go/bin` and `~/.local/bin` are in PATH:

```bash
# Add to ~/.zshrc or ~/.bashrc
export PATH="$HOME/go/bin:$HOME/.local/bin:$PATH"
```

---

## Step 1: Initialize Gas Town Workspace

```bash
# Initialize Gas Town on the new node
# --no-beads: skip local beads init (will connect to central Dolt instead)
# --name: use the machine hostname for identification
gt install ~/gt --no-beads --name $(hostname -s)
```

---

## Step 2: Join the Tailnet (Tailscale)

If not already done during hardware setup, install Tailscale and join the tailnet:

```bash
# macOS: install via App Store or brew
brew install --cask tailscale
open -a Tailscale   # authenticate via browser

# Verify both machines are on the tailnet
/Applications/Tailscale.app/Contents/MacOS/Tailscale status
```

Note the primary machine's Tailscale IP (e.g., `100.83.35.115`). You'll use
this for the Dolt host configuration.

---

## Step 3: Configure Dolt Connection

Add to the new node's `~/.zshrc` (using the primary's **Tailscale IP**,
not the LAN IP, for cross-network resilience):

```bash
export GT_DOLT_HOST=100.83.35.115   # primary machine's Tailscale IP
export GT_DOLT_PORT=3307
```

Verify connectivity:

```bash
source ~/.zshrc
dolt --host $GT_DOLT_HOST --port $GT_DOLT_PORT --no-tls sql -q 'SELECT 1 as connected'
```

---

## Step 4: Configure SSH to Primary

Add to `~/.ssh/config` on the new node:

```
Host primary-machine
    HostName 100.83.35.115     # primary's Tailscale IP
    User <your-username>
```

And on the primary, add an entry for the new node:

```
Host new-node
    HostName 100.xx.xx.xx      # new node's Tailscale IP
    User <your-username>
```

---

## Step 5: Register Rigs

Clone and register the rigs you want to run polecats for:

```bash
gt rig add gastown https://github.com/<org>/gas-town
gt rig add <other-rig> <git-url>
```

Verify rigs are registered:

```bash
gt rig list
```

---

## Step 6: Configure Beads Metadata

After registering rigs, point each rig's beads metadata at the central Dolt server:

```bash
# For each rig that should use the central Dolt:
cd ~/gt/<rig>/mayor/rig
# If .beads/metadata.json doesn't exist or has wrong host, update it:
cat .beads/metadata.json   # check current dolt_server_host
```

The metadata should contain:
```json
{
  "backend": "dolt",
  "database": "<rig-prefix>",
  "dolt_mode": "server",
  "dolt_server_host": "100.83.35.115",
  "dolt_server_port": 3307
}
```

**Important**: Always include explicit `dolt_server_host` and `dolt_server_port`.
Without them, bd may try stale embedded Dolt ports.

---

## Step 7: Auth Setup

```bash
# GitHub auth (needed for gh CLI and git push)
gh auth login

# Claude Code auth (needed for polecats)
claude /login

# Verify SSH key is added to GitHub
ssh -T git@github.com
# Expected: "Hi <username>! You've successfully authenticated..."
```

---

## Step 8: Verify End-to-End

```bash
# 1. Verify bd can reach central Dolt
cd ~/gt/gastown/mayor/rig
bd list --status=open | head -5   # should show issues from central db

# 2. Verify gt status
gt status

# 3. Verify rig list
gt rig list

# 4. Test polecat spawn (optional smoke test)
# Create a test bead and sling it
bd create --title="Node smoke test" --type=task --priority=4 --json | jq -r .id
# gt sling <bead-id> gastown
```

---

## Maintenance Notes

### If Tailscale IP changes

Tailscale IPs are stable per device but may theoretically change. If connectivity
breaks, update:

1. `~/.zshrc` on the satellite: `GT_DOLT_HOST=<new-ip>`
2. Any `metadata.json` files pointing to the primary
3. `~/.ssh/config` host entries

### Dolt server on primary must be accessible

The primary's Dolt server must be running and listening on `0.0.0.0` (all
interfaces) to accept Tailscale connections:

```bash
# Check primary's daemon.json
cat ~/gt/mayor/daemon.json | python3 -m json.tool | grep -A3 dolt_server
# Should show: "host": "0.0.0.0"
```

---

## Quick Reference

| Step | Command |
|------|---------|
| Init workspace | `gt install ~/gt --no-beads --name $(hostname -s)` |
| Check Tailscale | `tailscale status` |
| Test Dolt | `dolt --host $GT_DOLT_HOST --port $GT_DOLT_PORT --no-tls sql -q 'SELECT 1'` |
| Register rig | `gt rig add <name> <git-url>` |
| Verify beads | `cd ~/gt/<rig>/mayor/rig && bd list` |
| Auth GitHub | `gh auth login` |
| Auth Claude | `claude /login` |
