# Linux Setup

## Prerequisites

Ensure you have the following installed on your Linux system.

### Node.js and npm

#### Ubuntu/Debian-based systems:
```sh
sudo apt update
sudo apt install nodejs npm
```

#### Fedora/RHEL-based systems:
```sh
sudo dnf install nodejs npm
```

#### Arch-based systems:
```sh
sudo pacman -S nodejs npm
```

#### Using NodeSource (for latest LTS version):
```sh
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or for Fedora
curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
```

Verify installation:
```sh
node --version
npm --version
```

### Optional Development Tools

#### Ubuntu/Debian:
```sh
sudo apt install git build-essential
```

#### Fedora/RHEL:
```sh
sudo dnf install git gcc gcc-c++ make
```

#### Arch:
```sh
sudo pacman -S git base-devel
```

## Installation

1. Clone the repo
   ```sh
   git clone https://github.com/trillium/trillium.git
   cd trillium
   ```

2. Install dependencies
   ```sh
   npm install
   ```

3. Run the development server
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Troubleshooting

### Permission Issues with npm
If you get permission errors:
```sh
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Node version manager (recommended alternative)

Using NVM (Node Version Manager):
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
nvm use node
```

### Missing build dependencies
If you encounter build errors:
```sh
# Ubuntu/Debian
sudo apt install python3 build-essential

# Fedora/RHEL
sudo dnf install python3 gcc gcc-c++ make
```
