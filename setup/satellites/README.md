# Satellite Machine Setup

Trillium's fleet: one main MacBook controlling headless satellites via SSH + Screen Sharing.

## The Fleet

| Machine | Role | OS | Access Method |
|---|---|---|---|
| MacBook Pro | **Main workstation** | macOS | — |
| Mac Mini 1 | Satellite (compute) | macOS | SSH + Screen Sharing |
| Mac Mini 2 | Satellite (compute) | macOS | SSH + Screen Sharing |
| Mac Mini 3 | Satellite (compute) | macOS | SSH + Screen Sharing |
| Linux Laptop | Satellite (compute) | Linux Mint | SSH + VNC |

## Architecture

The satellites are **headless compute nodes** in service to the MacBook. They are not interactive workstations. The MacBook is the single point of control.

```
┌─────────────┐
│  MacBook Pro │  ← keyboard, mouse, monitor
│   (main)     │
└──────┬───┬──┘
  SSH/ │   │ SSH/
  VNC  │   │ VNC
┌──────┴┐ ┌┴───────┐ ┌─────────┐ ┌─────────────┐
│ mini1 │ │ mini2  │ │ mini3   │ │ mint laptop │
│ macOS │ │ macOS  │ │ macOS   │ │ Linux Mint  │
└───────┘ └────────┘ └─────────┘ └─────────────┘
```

## Guides

- **[Mac Mini Satellite](./MAC-MINI-SATELLITE.md)** — headless macOS setup (SSH, Screen Sharing, dummy plug)
- **[Linux Satellite](./LINUX-SATELLITE.md)** — headless Linux Mint setup (SSH, VNC)

## Why Not Universal Control?

Apple Universal Control supports a **maximum of 3 devices** total and has **no Linux support**.
With 4 Macs + 1 Linux machine, it can't cover the fleet. SSH + Screen Sharing is:

- Unlimited devices
- Cross-platform (macOS + Linux)
- Works remotely via Tailscale
- No additional software to install on macOS satellites
- Free

## Network

All machines are on the same Tailscale tailnet for access from anywhere.
On the local LAN, machines are reachable via mDNS (`.local` hostnames).
