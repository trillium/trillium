# === Trillium's bashrc additions ===
# Append these to the end of the default ~/.bashrc on a new machine

# Homebrew
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv bash)"

# Local bin
export PATH="$HOME/.local/bin:$PATH"

# Go
export PATH="$HOME/go/bin:$PATH"

# pnpm
export PNPM_HOME="/home/trillium/.local/share/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# Bun
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Nix
export PATH="$HOME/.nix-profile/bin:$PATH"

# Rust
. "$HOME/.cargo/env"

# pkg-config
export PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/share/pkgconfig${PKG_CONFIG_PATH:+:${PKG_CONFIG_PATH}}

# Happy / Claude aliases
alias yolo='happy --yolo'
alias Yolo='happy --yolo'
alias forced_yolo='unset CLAUDECODE CLAUDE_CODE_ENTRYPOINT && happy --yolo'

# Safe rm — move to trash instead of permanent delete
alias rm='trash-put'

# Directory navigation
alias ..='cd .. && ls'
alias ...='cd ../.. && ls'
alias ....='cd ../../.. && ls'
alias .....='cd ../../../.. && ls'

# NOTE: Add any API tokens/secrets below this line (do NOT commit them to git)
# export SUPABASE_ACCESS_TOKEN=...
