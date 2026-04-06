#!/bin/bash
# Loforger Global Installation Script
# Handles permission issues on NTFS/FUSE filesystems by using wrapper script

set -e

echo "=== Loforger Global Installer ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=Linux;;
    Darwin*)    PLATFORM=Mac;;
    CYGWIN*)    PLATFORM=Cygwin;;
    MINGW*)     PLATFORM=MinGW;;
    MSYS*)      PLATFORM=MSYS;;
    *)          PLATFORM="UNKNOWN:${OS}"
esac

echo "Detected platform: $PLATFORM"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

# Get the source directory
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Source directory: $SOURCE_DIR"

# Determine installation prefix
if [ "$PLATFORM" == "Linux" ] || [ "$PLATFORM" == "Mac" ]; then
    if [ -w "/usr/local/bin" ]; then
        PREFIX="/usr/local"
        echo "Installing to /usr/local (system-wide)"
    else
        PREFIX="$HOME/.local"
        echo "Installing to ~/.local (user-only, no sudo required)"
        echo -e "${YELLOW}Note: Make sure $HOME/.local/bin is in your PATH${NC}"
    fi
else
    PREFIX="$HOME/.local"
    echo "Installing to ~/.local"
fi

# Create necessary directories
mkdir -p "$PREFIX/bin"
mkdir -p "$PREFIX/lib/node_modules"

# Remove existing installation if present
if [ -d "$PREFIX/lib/node_modules/loforger" ]; then
    echo "Removing existing installation..."
    rm -rf "$PREFIX/lib/node_modules/loforger"
fi

# Copy package files
echo "Installing loforger package..."
cp -r "$SOURCE_DIR" "$PREFIX/lib/node_modules/loforger"

# Install dependencies
echo "Installing dependencies..."
cd "$PREFIX/lib/node_modules/loforger"
if [ -f "package.json" ]; then
    npm install --production --silent
fi

# Create wrapper script
WRAPPER_SCRIPT="$PREFIX/bin/loforger"
cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
# Loforger CLI Wrapper
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find installation
if [ -f "$SCRIPT_DIR/../lib/node_modules/loforger/dist/index.js" ]; then
    LOFORGER_DIR="$SCRIPT_DIR/../lib/node_modules/loforger"
elif [ -f "/usr/lib/node_modules/loforger/dist/index.js" ]; then
    LOFORGER_DIR="/usr/lib/node_modules/loforger"
elif [ -f "/usr/local/lib/node_modules/loforger/dist/index.js" ]; then
    LOFORGER_DIR="/usr/local/lib/node_modules/loforger"
else
    echo "Error: Loforger not found. Please reinstall." >&2
    exit 1
fi

exec node "$LOFORGER_DIR/dist/index.js" "$@"
EOF

chmod +x "$WRAPPER_SCRIPT"

echo ""
echo -e "${GREEN}✓ Loforger installed successfully!${NC}"
echo ""
echo "Usage:"
echo "  loforger --help          Show help"
echo "  loforger create          Create a new project"
echo "  loforger list-presets    List available presets"
echo ""

# Check if in PATH
if command -v loforger &> /dev/null; then
    echo -e "${GREEN}✓ loforger is available in your PATH${NC}"
else
    echo -e "${YELLOW}⚠ loforger is not in your PATH${NC}"
    echo "Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo "  export PATH=\"$PREFIX/bin:\$PATH\""
fi

echo ""
echo "Installation complete!"
