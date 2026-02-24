#!/bin/bash
# Rotate wallpaper randomly from ~/Pictures/wallpapers/
DIR="$HOME/Pictures/wallpapers"
WALLPAPER=$(find "$DIR" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.jpeg" \) | shuf -n 1)
if [ -n "$WALLPAPER" ]; then
    gsettings set org.cinnamon.desktop.background picture-uri "file://$WALLPAPER"
fi
