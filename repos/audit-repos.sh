#!/bin/bash

# Audit all repos in /code for:
# 1. No upstream remote
# 2. Unpushed features

cd /Users/trilliumsmith/code
REPORT="/Users/trilliumsmith/code/trillium/trillium/repos/audit-report.md"

{
  echo "# Repository Audit Report"
  echo "Generated: $(date)"
  echo ""
  
  find . -maxdepth 3 -type d -name ".git" | sort | while read gitdir; do
    repo=$(dirname "$gitdir")
    repo_name=$(echo "$repo" | sed 's|./||')
    
    cd "$repo" || continue
    
    # Check for upstream
    has_upstream=$(git remote | grep -c "^upstream$")
    
    # Check for unpushed commits
    if git rev-parse @{u} >/dev/null 2>&1; then
      unpushed=$(git rev-list @{u}.. 2>/dev/null | wc -l)
    else
      unpushed=0
    fi
    
    # Report issues
    if [ "$has_upstream" -eq 0 ] || [ "$unpushed" -gt 0 ]; then
      echo "📌 **$repo_name**"
      if [ "$has_upstream" -eq 0 ]; then
        echo "  - ⚠️  No upstream remote"
      fi
      if [ "$unpushed" -gt 0 ]; then
        echo "  - 📤 $unpushed unpushed commits"
      fi
    fi
    
    cd /Users/trilliumsmith/code >/dev/null
  done
} > "$REPORT"

cat "$REPORT"
