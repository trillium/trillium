# === Trillium's .profile additions ===
# Append these to the end of the default ~/.profile on a new machine

if [ -e /home/trillium/.nix-profile/etc/profile.d/nix.sh ]; then
  . /home/trillium/.nix-profile/etc/profile.d/nix.sh
fi
. "$HOME/.cargo/env"
