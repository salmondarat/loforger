#!/bin/bash
# Loforger CLI Wrapper Script
# This script wraps the Node.js CLI to handle permission issues on NTFS/FUSE filesystems

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find the installation directory
# Priority: 1. Environment variable, 2. Script location, 3. Default global path
if [ -n "$LOFORGER_HOME" ]; then
    LOFORGER_DIR="$LOFORGER_HOME"
elif [ -f "$SCRIPT_DIR/../dist/index.js" ]; then
    # Running from local development
    LOFORGER_DIR="$SCRIPT_DIR/.."
elif [ -f "/usr/lib/node_modules/loforger/dist/index.js" ]; then
    # Global npm installation (Linux)
    LOFORGER_DIR="/usr/lib/node_modules/loforger"
elif [ -f "/usr/local/lib/node_modules/loforger/dist/index.js" ]; then
    # Global npm installation (macOS/Linux alternative)
    LOFORGER_DIR="/usr/local/lib/node_modules/loforger"
elif [ -f "$HOME/.npm-global/lib/node_modules/loforger/dist/index.js" ]; then
    # User npm installation
    LOFORGER_DIR="$HOME/.npm-global/lib/node_modules/loforger"
elif [ -f "$HOME/.local/lib/node_modules/loforger/dist/index.js" ]; then
    # Alternative user installation
    LOFORGER_DIR="$HOME/.local/lib/node_modules/loforger"
else
    echo "Error: Could not find loforger installation." >&2
    echo "Please install with: npm install -g loforger" >&2
    echo "Or set LOFORGER_HOME environment variable." >&2
    exit 1
fi

# Verify the main script exists
if [ ! -f "$LOFORGER_DIR/dist/index.js" ]; then
    echo "Error: Loforger not found at $LOFORGER_DIR" >&2
    exit 1
fi

# Execute with node
exec node "$LOFORGER_DIR/dist/index.js" "$@"
