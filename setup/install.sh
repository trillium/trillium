#!/bin/bash

# Setup script for Trillium's development environment
# This script creates symlinks to config files and sets up the development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setting up Trillium development environment..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="MACOS"
    echo "📱 Detected macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="LINUX"
    echo "🐧 Detected Linux"
else
    echo "⚠️  Unsupported OS: $OSTYPE"
    exit 1
fi

# Setup Karabiner config (macOS only)
if [[ "$OS" == "MACOS" ]]; then
    echo "⌨️  Setting up Karabiner config..."

    # Create Karabiner config directory if it doesn't exist
    mkdir -p ~/.config/karabiner

    # Remove existing symlink or backup existing config
    if [[ -L ~/.config/karabiner/karabiner.json ]]; then
        echo "  Removing existing symlink..."
        rm ~/.config/karabiner/karabiner.json
    elif [[ -f ~/.config/karabiner/karabiner.json ]]; then
        echo "  Backing up existing config to ~/.config/karabiner/karabiner.json.backup"
        cp ~/.config/karabiner/karabiner.json ~/.config/karabiner/karabiner.json.backup
        rm ~/.config/karabiner/karabiner.json
    fi

    # Create symlink
    ln -s "$REPO_ROOT/config/karabiner.json" ~/.config/karabiner/karabiner.json
    echo "  ✅ Karabiner config symlink created"

    echo "🖼️  Setting up wallpaper..."
    mkdir -p ~/Pictures/wallpapers
    WALLPAPER="$HOME/Pictures/wallpapers/omarchy-elk.png"
    if [[ ! -f "$WALLPAPER" ]]; then
        curl -sL "https://files.catbox.moe/593by2.png" -o "$WALLPAPER"
        echo "  Downloaded omarchy-elk.png"
    else
        echo "  Already present, skipping download"
    fi
    osascript -e "tell application \"System Events\" to tell every desktop to set picture to POSIX file \"$WALLPAPER\""
    defaults write com.apple.loginwindow DesktopPicture "$WALLPAPER"
    echo "  ✅ Wallpaper set (desktop + lock screen)"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Install Node.js dependencies: npm install"
echo "2. Start development server: npm run dev"
echo ""
echo "For more information, see setup/README.md"
