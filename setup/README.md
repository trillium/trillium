# Getting Started

To view my portfolio or explore my projects, visit [trilliumsmith.com](https://trilliumsmith.com).

## Quick Setup

1. Clone the repo
   ```sh
   git clone https://github.com/trillium/trillium.git
   cd trillium
   ```

2. Run the setup script
   ```sh
   bash setup/install.sh
   ```

   This script will:
   - Detect your OS (macOS or Linux)
   - Set up Karabiner config symlink (macOS only)
   - Provide next steps

3. Install dependencies and run
   ```sh
   npm install
   npm run dev
   ```

## OS-Specific Setup

For detailed setup instructions for your operating system, see:

- **[macOS Setup](./MACOS.md)** - Homebrew, Node.js via Homebrew, M-series troubleshooting
- **[Linux Setup](./LINUX.md)** - Ubuntu/Debian, Fedora, Arch, and NVM options

## Satellite Machines

For setting up headless compute nodes controlled from the MacBook:

- **[Satellite Overview](./satellites/README.md)** - Fleet architecture and approach
- **[Mac Mini Satellite](./satellites/MAC-MINI-SATELLITE.md)** - Headless macOS setup
- **[Linux Satellite](./satellites/LINUX-SATELLITE.md)** - Headless Linux Mint setup
- **[Gas Town Node](./satellites/GAS-TOWN-NODE.md)** - Gas Town software stack (gt, bd, Dolt, polecats)

## Prerequisites

For development or contributions, ensure you have:

- Node.js (v16 or higher recommended)
- npm or yarn
