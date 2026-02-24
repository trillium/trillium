# macOS Setup

## Prerequisites

Ensure you have the following installed on your macOS system:

### Package Manager
Install Homebrew (if not already installed):
```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node.js and npm

Using Homebrew (recommended):
```sh
brew install node
```

Or download from [nodejs.org](https://nodejs.org/)

Verify installation:
```sh
node --version
npm --version
```

### Optional Development Tools

For enhanced development experience:
```sh
brew install git
brew install yarn  # Alternative to npm
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

   Or with yarn:
   ```sh
   yarn install
   ```

3. Run the development server
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Troubleshooting

### M1/M2/M3 Mac Issues
If you encounter architecture-related issues:
```sh
arch -arm64 brew install node
```

### Permission Issues
If you get permission errors during npm install:
```sh
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```
