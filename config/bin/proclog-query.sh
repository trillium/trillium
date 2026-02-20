#!/usr/bin/env bash
# proclog-query.sh — query proclog TSV data
#
# Usage:
#   proclog-query.sh <command> [options]
#
# Commands:
#   summary              — overview: time range, snapshots, spike count
#   spikes               — list all spike events
#   top-cpu [N]          — top N processes by peak CPU (default 10)
#   top-mem [N]          — top N processes by peak memory (default 10)
#   process <name>       — history for a specific process name
#   timeline [minutes]   — system-level stats over time (default: last 30 min)
#   hogs [threshold]     — processes that exceeded CPU% threshold (default 25)
#   spike-detail [type]  — show full spike dump details (cpu_total|mem_total|cpu_proc)

LOGDIR="${PROCLOG_DIR:-$HOME/logs}"
MAINLOG="$LOGDIR/proclog.tsv"
SPIKELOG="$LOGDIR/proclog-spikes.tsv"

if [ ! -f "$MAINLOG" ]; then
    echo "No log found at $MAINLOG"
    exit 1
fi

cmd="${1:-summary}"
shift 2>/dev/null

case "$cmd" in
    summary)
        echo "=== proclog summary ==="
        echo "Main log:  $MAINLOG ($(du -h "$MAINLOG" | cut -f1))"
        [ -f "$SPIKELOG" ] && echo "Spike log: $SPIKELOG ($(du -h "$SPIKELOG" | cut -f1))"
        echo ""
        awk -F'\t' 'NR>1 {
            if (!first) {first=$1}
            last=$1
            snapshots[$1]=1
            if ($14 != "normal") spikes[$1]=$14
        } END {
            printf "Time range:  %s → %s\n", first, last
            printf "Snapshots:   %d\n", length(snapshots)
            printf "Spike events: %d\n", length(spikes)
        }' "$MAINLOG"
        if [ -f "$SPIKELOG" ]; then
            echo ""
            echo "Spike breakdown:"
            awk -F'\t' 'NR>1 {types[$2]++} END {for (t in types) printf "  %-12s %d\n", t, types[t]}' "$SPIKELOG"
        fi
        ;;

    spikes)
        echo "=== spike events ==="
        awk -F'\t' 'NR>1 && $14 != "normal" {
            if ($1 != last_ts) {
                printf "\n%s  [%s]  total_cpu=%s  mem=%s%%  load=%s\n", $1, $14, $9, $10, $11
                last_ts = $1
            }
            printf "  PID %-7s %-15s  cpu=%5s%%  mem=%5s%%  rss=%sKB\n", $2, $8, $4, $5, $6
        }' "$MAINLOG"
        ;;

    top-cpu)
        n="${1:-10}"
        echo "=== top $n by peak CPU ==="
        awk -F'\t' 'NR>1 {
            key=$8; if ($4+0 > peak[key]+0) {peak[key]=$4; pid[key]=$2; mem[key]=$5; rss[key]=$6; ts[key]=$1}
        } END {
            for (k in peak) printf "%s\t%s\t%s\t%s\t%s\t%s\n", peak[k], k, pid[k], mem[k], rss[k], ts[k]
        }' "$MAINLOG" | sort -t$'\t' -k1 -rn | head -"$n" | \
        awk -F'\t' 'BEGIN {printf "%-20s %7s %7s %7s %10s  %s\n", "COMMAND","PID","CPU%","MEM%","RSS_KB","WHEN"}
            {printf "%-20s %7s %7s %7s %10s  %s\n", $2, $3, $1, $4, $5, $6}'
        ;;

    top-mem)
        n="${1:-10}"
        echo "=== top $n by peak MEM ==="
        awk -F'\t' 'NR>1 {
            key=$8; if ($5+0 > peak[key]+0) {peak[key]=$5; pid[key]=$2; cpu[key]=$4; rss[key]=$6; ts[key]=$1}
        } END {
            for (k in peak) printf "%s\t%s\t%s\t%s\t%s\t%s\n", peak[k], k, pid[k], cpu[k], rss[k], ts[k]
        }' "$MAINLOG" | sort -t$'\t' -k1 -rn | head -"$n" | \
        awk -F'\t' 'BEGIN {printf "%-20s %7s %7s %7s %10s  %s\n", "COMMAND","PID","MEM%","CPU%","RSS_KB","WHEN"}
            {printf "%-20s %7s %7s %7s %10s  %s\n", $2, $3, $1, $4, $5, $6}'
        ;;

    process)
        name="$1"
        if [ -z "$name" ]; then echo "Usage: proclog-query.sh process <name>"; exit 1; fi
        echo "=== history for '$name' ==="
        awk -F'\t' -v name="$name" 'NR>1 && $8 ~ name {
            printf "%s  PID=%-7s  cpu=%5s%%  mem=%5s%%  rss=%sKB\n", $1, $2, $4, $5, $6
        }' "$MAINLOG"
        ;;

    timeline)
        mins="${1:-30}"
        cutoff=$(date -d "$mins minutes ago" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')
        echo "=== system timeline (last ${mins}m) ==="
        printf "%-20s %9s %6s %6s %6s  %s\n" "TIMESTAMP" "TOTAL_CPU" "MEM%" "LOAD1" "LOAD5" "SPIKE"
        awk -F'\t' -v cutoff="$cutoff" 'NR>1 && $1 >= cutoff {
            if ($1 != last) {
                printf "%-20s %9s %6s %6s %6s  %s\n", $1, $9, $10, $11, $12, $14
                last=$1
            }
        }' "$MAINLOG"
        ;;

    hogs)
        threshold="${1:-25}"
        echo "=== processes that exceeded ${threshold}% CPU ==="
        awk -F'\t' -v t="$threshold" 'NR>1 && $4+0 >= t {
            printf "%s  %-20s  PID=%-7s  cpu=%5s%%  mem=%5s%%\n", $1, $8, $2, $4, $5
        }' "$MAINLOG"
        ;;

    spike-detail)
        filter="${1:-}"
        if [ ! -f "$SPIKELOG" ]; then echo "No spike log found."; exit 0; fi
        echo "=== spike details ${filter:+(filtered: $filter)} ==="
        if [ -n "$filter" ]; then
            awk -F'\t' -v f="$filter" 'NR==1 || $2==f' "$SPIKELOG" | column -t -s$'\t' | head -60
        else
            column -t -s$'\t' "$SPIKELOG" | head -60
        fi
        ;;

    *)
        echo "Unknown command: $cmd"
        echo "Commands: summary, spikes, top-cpu, top-mem, process, timeline, hogs, spike-detail"
        exit 1
        ;;
esac
