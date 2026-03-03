# Cross-Machine Data Preservation

How to safely pull code from a remote machine (e.g., Mac Mini) to the primary workstation.

## Prerequisites

- SSH access to the remote machine (`~/.ssh/config` entry recommended)
- `rsync` installed on both machines
- Git installed on both machines

## Step 1: Audit the remote machine

Run the audit script on the remote machine to identify repos with unpushed or dirty state:

```bash
ssh trillium-mini 'for repo in ~/code/*/; do
  name=$(basename "$repo")
  cd "$repo" 2>/dev/null || continue
  if [ -d .git ]; then
    dirty=$(git status --porcelain 2>/dev/null | head -5 | wc -l | tr -d " ")
    unpushed=$(git log --oneline @{upstream}..HEAD 2>/dev/null | wc -l | tr -d " ")
    if [ "$dirty" -gt 0 ] || [ "$unpushed" -gt 0 ]; then
      echo "$name: dirty=$dirty unpushed=$unpushed"
    fi
  fi
done'
```

Or use `repos/audit-repos.sh` if it's present on that machine.

## Step 2: Categorize repos

Compare the remote repo list against local:

```bash
# Remote repos
ssh trillium-mini "ls ~/code/ | sort" > /tmp/mini-repos.txt

# Local repos
ls ~/code/ | sort > /tmp/local-repos.txt

# Diff
diff /tmp/local-repos.txt /tmp/mini-repos.txt
```

Repos fall into three categories:

| Category | Strategy |
|----------|----------|
| Only on remote | `rsync` entire directory to `~/code/` |
| On both, same project | Add remote as git remote, `git fetch` |
| On both, different project (name collision) | `rsync` to `~/code/<name>-from-mini/` |

## Step 3: Rsync repos that only exist on the remote

```bash
rsync -avz trillium-mini:~/code/<repo>/ ~/code/<repo>/
```

This preserves the full git history, dirty working directory state, and all branches.

## Step 4: Fetch from shared repos

For repos that exist on both machines, add the remote as a git remote to pull branches without overwriting local work:

```bash
cd ~/code/<repo>
git remote add mini trillium-mini:~/code/<repo>
git fetch mini
```

This brings all remote branches into `mini/*` refs. Local branches and working directory are untouched.

## Step 5: Handle name collisions

If `~/code/massage` locally is a different project than `~/code/massage` on the remote, rsync with a suffix:

```bash
rsync -avz trillium-mini:~/code/massage/ ~/code/massage-from-mini/
```

## Step 6: Verify

Check that dirty files and unpushed commits survived the transfer:

```bash
for repo in awesome-talon obs-aitum-multistream speak speak-web; do
  cd ~/code/$repo
  echo "$repo: dirty=$(git status --porcelain | wc -l | tr -d ' ')"
done
```

For git-fetched repos, verify the remote branches arrived:

```bash
cd ~/code/zed
git branch -r | grep "mini/"
```

## 2026-03-02 Execution Log

Transferred 15 repos from `trillium-mini` (Mac Mini, 192.168.86.32) to primary workstation:

**Rsynced (mini-only):**
awesome-talon, obs-aitum-multistream, row_tracker, speak, speak-web, streamer-bot-re, wardley-ai, zed-cursorless, zeroclaw

**Rsynced with suffix (name collision):**
massage-from-mini, talon-from-mini, trillium-from-mini

**Git fetch (shared repos):**
happier, podflow, zed, VRMS
