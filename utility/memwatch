#!/usr/bin/env bash
# memwatch.sh — kill runaway processes before they OOM the system
#
# Checks every INTERVAL seconds. Kills any process exceeding its
# per-process RSS limit, and/or if total system memory exceeds threshold.
#
# Usage: memwatch.sh [interval_seconds]
#
# Config via env:
#   MEM_TOTAL_KILL=90    — kill biggest offender if system mem% exceeds this
#   LOGFILE              — where to log kills (default ~/logs/memwatch.log)
#
# Per-process limits defined in WATCH_RULES below.

INTERVAL="${1:-5}"
MEM_TOTAL_KILL="${MEM_TOTAL_KILL:-90}"
LOGFILE="${LOGFILE:-$HOME/logs/memwatch.log}"

mkdir -p "$(dirname "$LOGFILE")"

# Rules: process_name:max_rss_mb
# Add more lines to watch additional processes.
WATCH_RULES=(
    "rust-analyzer:4000"
    "rustc:3000"
    "cargo:3000"
    "next-server:3000"
)

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $*" | tee -a "$LOGFILE"
}

kill_process() {
    local pid=$1 name=$2 reason=$3 rss_mb=$4
    log "KILL pid=$pid name=$name rss=${rss_mb}MB reason=\"$reason\""
    kill "$pid" 2>/dev/null
    sleep 2
    if kill -0 "$pid" 2>/dev/null; then
        log "SIGKILL pid=$pid (didn't die to SIGTERM)"
        kill -9 "$pid" 2>/dev/null
    fi
}

check_per_process() {
    for rule in "${WATCH_RULES[@]}"; do
        local name="${rule%%:*}"
        local max_mb="${rule##*:}"
        local max_kb=$((max_mb * 1024))

        ps -eo pid,rss,comm --no-headers | while read -r pid rss comm; do
            if [[ "$comm" == "$name"* ]] && [ "$rss" -gt "$max_kb" ]; then
                local rss_mb=$((rss / 1024))
                kill_process "$pid" "$comm" "exceeded ${max_mb}MB limit" "$rss_mb"
            fi
        done
    done
}

check_system_total() {
    local mem_pct
    mem_pct=$(free | awk 'NR==2 {printf "%.0f", $3/$2*100}')

    if [ "$mem_pct" -ge "$MEM_TOTAL_KILL" ]; then
        # Find the biggest process and kill it
        read -r pid rss comm <<< "$(ps -eo pid,rss,comm --sort=-rss --no-headers | head -1)"
        local rss_mb=$((rss / 1024))
        log "SYSTEM MEM=${mem_pct}% — killing top process"
        kill_process "$pid" "$comm" "system at ${mem_pct}% mem" "$rss_mb"
    fi
}

log "memwatch started — interval=${INTERVAL}s total_kill=${MEM_TOTAL_KILL}%"
for rule in "${WATCH_RULES[@]}"; do
    log "  rule: ${rule%%:*} max ${rule##*:}MB"
done

while true; do
    check_per_process
    check_system_total
    sleep "$INTERVAL"
done
