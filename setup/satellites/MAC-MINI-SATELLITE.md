# Mac Mini Satellite Setup

Spin up a Mac Mini as a headless compute node controlled from the MacBook.

## Prerequisites

- Mac Mini with macOS installed and logged into your Apple ID
- HDMI dummy plug (~$8, search Amazon for "HDMI dummy plug 4K")
- Both machines on the same network (or Tailscale)

## 1. Set Hostname

**System Settings > General > Sharing > Local Hostname**

Pick something short and memorable: `mini1`, `mini2`, `mini3`.
The machine will be reachable as `mini1.local` on the LAN.

Also set the **Computer Name** in the same pane to match.

## 2. Enable Remote Login (SSH)

**System Settings > General > Sharing > Remote Login** → toggle ON

Under "Allow access for", select your user account.

Verify from the MacBook:

```bash
ssh youruser@mini1.local
```

## 3. Enable Screen Sharing

**System Settings > General > Sharing > Screen Sharing** → toggle ON

This enables Apple's VNC-compatible remote desktop protocol.

Connect from the MacBook:
- **Finder > Go > Connect to Server** (Cmd+K) → `vnc://mini1.local`
- Or open **Screen Sharing.app** from Spotlight

## 4. Plug in the HDMI Dummy Plug

Without a display connected, macOS renders at a terrible resolution and Screen Sharing looks awful.

1. Plug the HDMI dummy plug into the Mini's HDMI port
2. Connect via Screen Sharing
3. Go to **System Settings > Displays** and set your preferred resolution (1920x1080 or higher)

## 5. SSH Key Auth (No Passwords)

From the **MacBook**:

```bash
# Generate a key if you don't have one
ssh-keygen -t ed25519

# Copy your public key to the Mini
ssh-copy-id youruser@mini1.local
```

Now `ssh mini1.local` works without a password prompt.

## 6. SSH Config

Add to `~/.ssh/config` on the **MacBook**:

```
Host mini1
    HostName mini1.local
    User youruser
```

Now you just type `ssh mini1`.

Repeat for each Mini (`mini2`, `mini3`).

## 7. Install tmux

tmux keeps sessions alive after SSH disconnects.

```bash
# If Homebrew isn't installed on the Mini yet:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"

brew install tmux
```

Usage:
```bash
ssh mini1
tmux            # Start a new session
# ... do work ...
# Disconnect (Ctrl+B, D) or just close the terminal

ssh mini1
tmux attach     # Reconnect to the running session
```

## 8. Install Tailscale

For access from anywhere, not just the local LAN.

```bash
brew install --cask tailscale
```

Open Tailscale from Applications, sign in. The Mini gets a stable `100.x.x.x` address and a magic DNS name on the tailnet.

After Tailscale is up, update `~/.ssh/config` on the MacBook to use the Tailscale hostname as a fallback:

```
Host mini1
    HostName mini1.local
    User youruser

Host mini1-ts
    HostName mini1
    User youruser
```

## 9. Energy Settings

Prevent the Mini from sleeping when headless:

**System Settings > Energy** (or Battery/Energy Saver depending on macOS version):
- **Prevent automatic sleeping when the display is off** → ON
- **Wake for network access** → ON
- **Start up automatically after a power failure** → ON

## 10. Auto-Login (Optional)

If the Mini needs to come back up unattended after a reboot:

**System Settings > Users & Groups > Login Options > Automatic login** → select your user

Note: This disables FileVault. Only do this if the Mini is in a trusted physical location.

## Spin-Down

To shut down a satellite:

```bash
ssh mini1 'sudo shutdown -h now'
```

To put it to sleep:

```bash
ssh mini1 'pmset sleepnow'
```

To wake it (if Wake for network access is enabled):

```bash
# From the MacBook, send a Wake-on-LAN packet
# Install: brew install wakeonlan
wakeonlan <MAC-ADDRESS>
```

Find the MAC address: `ssh mini1 'ifconfig en0 | grep ether'`

## Verification Checklist

- [ ] `ssh mini1` connects without password prompt
- [ ] Screen Sharing shows the desktop at good resolution
- [ ] `tmux` is installed and sessions persist across disconnects
- [ ] `tailscale status` shows the Mini on the tailnet
- [ ] Mini does not sleep when idle
- [ ] Mini recovers after power loss (auto-restart enabled)
