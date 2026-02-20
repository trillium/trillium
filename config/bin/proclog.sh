#!/usr/bin/env bash
# proclog.sh — lightweight process resource logger with spike detection
#
# Output: TSV format for easy parsing
# Two files:
#   proclog.tsv       — main log (one row per process per snapshot)
#   proclog-spikes.tsv — detailed dumps when CPU/MEM spike detected
#
# Usage: proclog.sh [interval_seconds] [log_dir] [max_log_mb]
#
# Spike thresholds (env overridable):
#   SPIKE_CPU=80    — total CPU % across all cores triggers spike
#   SPIKE_MEM=70    — total RAM % usage triggers spike
#   SPIKE_PROC=50   — single process CPU % triggers spike
#
# Adaptive polling:
#   Normal:  sleeps INTERVAL (default 3s)
#   Spike:   drops to SPIKE_INTERVAL (default 0.5s) for high-res capture
#   Cooldown: stays fast for SPIKE_COOLDOWN (default 10) normal cycles after
#             last spike before returning to slow polling

INTERVAL="${1:-3}"
LOGDIR="${2:-$HOME/logs}"
MAX_LOG_MB="${3:-50}"

SPIKE_CPU="${SPIKE_CPU:-80}"
SPIKE_MEM="${SPIKE_MEM:-70}"
SPIKE_PROC="${SPIKE_PROC:-50}"
SPIKE_INTERVAL="${SPIKE_INTERVAL:-0.5}"
SPIKE_COOLDOWN="${SPIKE_COOLDOWN:-10}"

MAINLOG="$LOGDIR/proclog.tsv"
SPIKELOG="$LOGDIR/proclog-spikes.tsv"

mkdir -p "$LOGDIR"
max_bytes=$((MAX_LOG_MB * 1048576))

# Adaptive polling state
cooldown_remaining=0

# Write headers if files are new
write_headers() {
    if [ ! -s "$MAINLOG" ]; then
        printf 'timestamp\tpid\tuser\tcpu%%\tmem%%\trss_kb\tvsz_kb\tcommand\ttotal_cpu\ttotal_mem%%\tload1\tload5\tload15\tspike\tpoll_hz\n' > "$MAINLOG"
    fi
    if [ ! -s "$SPIKELOG" ]; then
        printf 'timestamp\tspike_type\tpid\tuser\tcpu%%\tmem%%\trss_kb\tvsz_kb\tcommand\tstate\tstarted\tfull_cmd\n' > "$SPIKELOG"
    fi
}

rotate_if_needed() {
    local f="$1"
    if [ -f "$f" ]; then
        local size
        size=$(stat -c%s "$f" 2>/dev/null || echo 0)
        if [ "$size" -ge "$max_bytes" ]; then
            mv "$f" "${f}.old"
        fi
    fi
}

get_total_cpu() {
    ps -eo %cpu --no-headers | awk '{s+=$1} END {printf "%.1f", s}'
}

get_mem_pct() {
    free | awk 'NR==2 {printf "%.1f", $3/$2*100}'
}

get_load() {
    awk '{print $1, $2, $3}' /proc/loadavg
}

snapshot_top() {
    local ts="$1" total_cpu="$2" mem_pct="$3" load1="$4" load5="$5" load15="$6" spike="$7" poll="$8"
    {
        ps -eo pid,user,%cpu,%mem,rss,vsz,comm --sort=-%cpu --no-headers | head -10
        ps -eo pid,user,%cpu,%mem,rss,vsz,comm --sort=-%mem --no-headers | head -10
    } | sort -u -k1,1n | while read -r pid user cpu mem rss vsz comm; do
        printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
            "$ts" "$pid" "$user" "$cpu" "$mem" "$rss" "$vsz" "$comm" \
            "$total_cpu" "$mem_pct" "$load1" "$load5" "$load15" "$spike" "$poll"
    done
}

spike_dump() {
    local ts="$1" spike_type="$2"
    ps -eo pid,user,%cpu,%mem,rss,vsz,comm,stat,lstart --sort=-%cpu --no-headers | \
    while read -r pid user cpu mem rss vsz comm state lstart_rest; do
        if awk "BEGIN{exit ($cpu < 0.5 && $mem < 0.5) ? 0 : 1}"; then
            continue
        fi
        local fullcmd
        fullcmd=$(tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | head -c 200)
        printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
            "$ts" "$spike_type" "$pid" "$user" "$cpu" "$mem" "$rss" "$vsz" \
            "$comm" "$state" "$lstart_rest" "$fullcmd"
    done
}

write_headers

while true; do
    rotate_if_needed "$MAINLOG"
    rotate_if_needed "$SPIKELOG"

    ts=$(date '+%Y-%m-%d %H:%M:%S.%N' | cut -c1-23)
    total_cpu=$(get_total_cpu)
    mem_pct=$(get_mem_pct)
    read -r load1 load5 load15 <<< "$(get_load)"

    # Detect spikes
    spike=""
    top_proc_cpu=$(ps -eo %cpu --sort=-%cpu --no-headers | head -1 | tr -d ' ')

    if awk "BEGIN{exit ($total_cpu >= $SPIKE_CPU) ? 0 : 1}"; then
        spike="cpu_total"
    elif awk "BEGIN{exit ($mem_pct >= $SPIKE_MEM) ? 0 : 1}"; then
        spike="mem_total"
    elif awk "BEGIN{exit ($top_proc_cpu >= $SPIKE_PROC) ? 0 : 1}"; then
        spike="cpu_proc"
    fi

    # Determine polling speed
    if [ -n "$spike" ]; then
        cooldown_remaining=$SPIKE_COOLDOWN
        current_interval="$SPIKE_INTERVAL"
        poll_label="fast"
    elif [ "$cooldown_remaining" -gt 0 ]; then
        cooldown_remaining=$((cooldown_remaining - 1))
        current_interval="$SPIKE_INTERVAL"
        poll_label="cooldown"
    else
        current_interval="$INTERVAL"
        poll_label="normal"
    fi

    # Always write the normal snapshot
    snapshot_top "$ts" "$total_cpu" "$mem_pct" "$load1" "$load5" "$load15" "${spike:-normal}" "$poll_label" >> "$MAINLOG"

    # On spike, also write detailed dump
    if [ -n "$spike" ]; then
        spike_dump "$ts" "$spike" >> "$SPIKELOG"
    fi

    sleep "$current_interval"
done
