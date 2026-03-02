# Linux Satellite Setup (Mint)

Spin up a Linux Mint laptop as a headless compute node controlled from the MacBook.

## Prerequisites

- Linux Mint installed and logged in
- Both machines on the same network (or Tailscale)

## 1. Set Hostname

```bash
sudo hostnamectl set-hostname mint-sat
```

Edit `/etc/hosts` to include the new hostname:

```
127.0.1.1   mint-sat
```

The machine will be reachable as `mint-sat.local` on the LAN (requires Avahi — see step 3).

## 2. Enable SSH

```bash
sudo apt update
sudo apt install openssh-server
sudo systemctl enable --now ssh
```

Verify from the MacBook:

```bash
ssh youruser@mint-sat.local
```

## 3. Enable mDNS (Avahi)

mDNS lets the MacBook find this machine as `mint-sat.local` without configuring DNS.

```bash
sudo apt install avahi-daemon
sudo systemctl enable --now avahi-daemon
```

## 4. SSH Key Auth (No Passwords)

From the **MacBook**:

```bash
ssh-copy-id youruser@mint-sat.local
```

Now `ssh mint-sat.local` works without a password prompt.

## 5. SSH Config

Add to `~/.ssh/config` on the **MacBook**:

```
Host mint
    HostName mint-sat.local
    User youruser
```

Now you just type `ssh mint`.

## 6. Install VNC Server

For GUI access when SSH isn't enough. TigerVNC is reliable on Mint.

```bash
sudo apt install tigervnc-standalone-server tigervnc-common
```

Set a VNC password:

```bash
vncpasswd
```

### Option A: On-Demand VNC (start when needed)

```bash
vncserver :1 -geometry 1920x1080 -depth 24
```

Connect from the MacBook:
- Open **Screen Sharing.app** or any VNC client → `vnc://mint-sat.local:5901`

Stop when done:

```bash
vncserver -kill :1
```

### Option B: Persistent VNC (systemd service)

Create `/etc/systemd/system/vncserver@.service`:

```ini
[Unit]
Description=TigerVNC Server on display %i
After=network-online.target

[Service]
Type=simple
User=youruser
ExecStart=/usr/bin/vncserver :%i -geometry 1920x1080 -depth 24 -fg
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl enable --now vncserver@1
```

Now VNC is always running on port 5901.

### VNC over SSH Tunnel (Secure)

Instead of exposing VNC directly, tunnel through SSH:

```bash
# From the MacBook:
ssh -L 5901:localhost:5901 mint

# Then connect VNC to localhost:5901
```

This encrypts the VNC traffic and avoids exposing port 5901 on the network.

## 7. Install tmux

```bash
sudo apt install tmux
```

Usage is the same as the Mac Mini guide — start sessions with `tmux`, reconnect with `tmux attach`.

## 8. Install Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

Follow the auth URL printed to the terminal. After login, the laptop gets a stable Tailscale IP and DNS name.

Update `~/.ssh/config` on the MacBook:

```
Host mint
    HostName mint-sat.local
    User youruser

Host mint-ts
    HostName mint-sat
    User youruser
```

## 9. Prevent Sleep When Lid Closed

If the laptop will run headless with the lid closed:

Edit `/etc/systemd/logind.conf`:

```ini
HandleLidSwitch=ignore
HandleLidSwitchExternalPower=ignore
HandleLidSwitchDocked=ignore
```

Apply:

```bash
sudo systemctl restart systemd-logind
```

**Warning**: This logs you out of the GUI session. Do this over SSH.

## 10. Power Management

Keep the machine awake:

```bash
# Disable suspend
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target

# Enable Wake-on-LAN (if supported)
sudo apt install ethtool
IFACE=$(ip route get 1 | awk '{print $5; exit}')
sudo ethtool -s "$IFACE" wol g
```

To make Wake-on-LAN persistent across reboots, add a NetworkManager dispatcher script or a udev rule.

## Spin-Down

```bash
ssh mint 'sudo shutdown -h now'
```

To suspend:

```bash
ssh mint 'systemctl suspend'
```

To wake (if WoL is enabled):

```bash
wakeonlan <MAC-ADDRESS>
```

Find the MAC address: `ssh mint 'ip link show | grep ether'`

## Verification Checklist

- [ ] `ssh mint` connects without password prompt
- [ ] `mint-sat.local` resolves on the LAN (Avahi working)
- [ ] VNC connection works from Screen Sharing.app or a VNC client
- [ ] `tmux` is installed and sessions persist across disconnects
- [ ] `tailscale status` shows the laptop on the tailnet
- [ ] Lid close does not suspend the machine
- [ ] Machine does not auto-suspend when idle
