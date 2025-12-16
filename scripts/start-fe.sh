#!/bin/bash

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)

if [ -z "$NODE_VERSION" ]; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

if [ "$NODE_VERSION" -lt 16 ]; then
    echo "Error: Node.js version $NODE_VERSION is too old"
    echo "This project requires Node.js 16 or higher"
    echo ""
    echo "Current Node.js: $(node -v)"
    echo "Current npm: $(npm -v 2>/dev/null || echo 'not found')"
    echo ""
    echo "To fix this on macOS:"
    echo "  1. Install Node.js 18+ from https://nodejs.org/"
    echo "  2. Or use nvm: brew install nvm && nvm install 18 && nvm use 18"
    echo "  3. Or use Homebrew: brew install node@18"
    exit 1
fi

echo "Using Node.js $(node -v)"

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_DIR/frontend"

echo "Installing dependencies..."
npm install

echo "Starting React development server..."
npm start
