export TALON_REPL_PATH=/Users/trilliumsmith/.talon/.venv/bin/repl

function m() {
  local result=""
    local arg
    # Loop through each argument
    for arg in "$@"; do
        # Check if the argument contains a dash
        echo "actions.sleep(.05)"| $TALON_REPL_PATH > /dev/null
        if [[ "$arg" == *-* ]]; then
            echo "mimic(\"$result\")"| $TALON_REPL_PATH > /dev/null
            result=""
            continue
        fi
        # Concatenate the argument to the result
        if [[ -z "$result" ]]; then
            result="$arg"
        else
            result+=" $arg"
        fi
    done
    echo "mimic(\"$result\")"| $TALON_REPL_PATH > /dev/null
}


function M() {
    echo "mimic(\"command tab\")"| $TALON_REPL_PATH > /dev/null
    local result=""
    local arg
    # Loop through each argument
    for arg in "$@"; do
        echo "actions.sleep(.05)"| $TALON_REPL_PATH > /dev/null
        # Check if the argument contains a dash
        if [[ "$arg" == *-* ]]; then
            echo "mimic(\"$result\")"| $TALON_REPL_PATH > /dev/null
            result=""
            continue
        fi
        # Concatenate the argument to the result
        if [[ -z "$result" ]]; then
            result="$arg"
        else
            result+=" $arg"
        fi
    done
    echo "actions.sleep(.05)"| /Users/trilliumsmith/.talon/.venv/bin/repl > /dev/null
    echo "mimic(\"command tab\")"| /Users/trilliumsmith/.talon/.venv/bin/repl > /dev/null
}