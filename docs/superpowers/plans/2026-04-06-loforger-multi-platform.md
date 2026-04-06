# Loforger Multi-Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create three distribution methods for Loforger CLI: 1) Node.js/TypeScript with wrapper script documentation, 2) Bun-compiled standalone binary, 3) Go rewrite

**Architecture:** Three parallel tracks - original Node/TS project gets wrapper script and documentation fixes, Bun project experiments with Bun's compile-to-binary feature, Go project provides a native binary alternative

**Tech Stack:** TypeScript, Bun, Go, Shell scripting

---

## Track 1: Node.js/TypeScript Project (Original)

**Location:** `/media/data/Projects/claude-template-scaffold`

### Task 1.1: Create Wrapper Script for Global Installation

**Files:**
- Create: `scripts/loforger-wrapper.sh`
- Create: `scripts/install.sh`
- Modify: `README.md`

- [ ] **Step 1: Create shell wrapper script**

Create `scripts/loforger-wrapper.sh`:
```bash
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
```

- [ ] **Step 2: Create install script**

Create `scripts/install.sh`:
```bash
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
```

- [ ] **Step 3: Make scripts executable and test**

```bash
chmod +x scripts/loforger-wrapper.sh
chmod +x scripts/install.sh

# Test wrapper script
./scripts/loforger-wrapper.sh --help
```

Expected output: Shows loforger help menu

- [ ] **Step 4: Commit wrapper scripts**

```bash
git add scripts/
git commit -m "feat: add wrapper scripts for global installation

Add install.sh and loforger-wrapper.sh to handle permission issues
on NTFS/FUSE filesystems. This allows loforger to work correctly
when installed globally, bypassing executable bit requirements."
```

### Task 1.2: Document Installation Methods

**Files:**
- Modify: `README.md`
- Create: `docs/INSTALLATION.md`

- [ ] **Step 1: Create comprehensive installation documentation**

Create `docs/INSTALLATION.md`:
```markdown
# Loforger Installation Guide

## Quick Start

### Method 1: Using npx (Recommended - No Installation)
```bash
npx loforger create
```

### Method 2: Using install.sh Script (For NTFS/FUSE filesystems)
```bash
git clone <repo-url>
cd loforger
./scripts/install.sh
```

### Method 3: Standard npm Global Install (Linux/macOS only)
```bash
npm install -g loforger
```

## Detailed Installation Methods

### Method 1: npx (Recommended)

The easiest way to use loforger without any installation issues.

**Pros:**
- No permission issues
- Always uses latest version
- Works on any filesystem

**Cons:**
- Requires internet connection
- Slight delay on first run

```bash
# Create a new project
npx loforger create my-project

# Or with options
npx loforger create my-project --preset nextjs-supabase-mvp
```

### Method 2: Custom Install Script (For All Platforms)

Use this if you're on Windows, WSL, or have an NTFS/FUSE filesystem.

**Why this method?**
Standard npm global installation creates executable symlinks that don't work
on NTFS/FUSE filesystems. Our install script uses a wrapper that calls
`node` directly, bypassing the permission issue.

**Installation:**
```bash
# Clone the repository
git clone https://github.com/yourusername/loforger.git
cd loforger

# Run install script
./scripts/install.sh

# Or install to specific location
PREFIX=$HOME/.local ./scripts/install.sh
```

**Uninstallation:**
```bash
rm -rf ~/.local/lib/node_modules/loforger
rm ~/.local/bin/loforger
```

### Method 3: npm Global Install (Linux/macOS ext4/APFS only)

Standard installation. Only use if your filesystem supports Unix permissions.

```bash
npm install -g loforger
```

**Verification:**
```bash
which loforger
loforger --version
```

## Platform-Specific Notes

### Windows (NTFS)
- Use Method 1 (npx) or Method 2 (install script)
- Do NOT use standard npm global install

### WSL (Windows Subsystem for Linux)
- If project is on `/mnt/c/` (NTFS mount): Use Method 1 or 2
- If project is on WSL ext4 filesystem: Method 3 works fine

### macOS
- Method 3 (npm global) should work on APFS
- Use Method 1 or 2 if you encounter issues

### Linux
- Method 3 works on ext4, btrfs, xfs
- Use Method 1 or 2 for NTFS mounts

## Troubleshooting

### "Permission denied" error
**Cause:** Filesystem doesn't support Unix executable bit

**Solution:**
```bash
# Use npx instead
npx loforger create

# Or use install.sh
./scripts/install.sh
```

### "command not found: loforger"
**Cause:** Binary not in PATH

**Solution:**
```bash
# Check installation location
which node
ls -la ~/.local/bin/loforger

# Add to PATH if needed
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### "Cannot find module"
**Cause:** Dependencies not installed

**Solution:**
```bash
# Reinstall
cd /path/to/loforger
npm install
npm run build
```

## Alternative: Local Development Setup

If you want to develop or modify loforger:

```bash
# Clone repository
git clone https://github.com/yourusername/loforger.git
cd loforger

# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js --help

# Or use npm link (may have permission issues on NTFS)
npm link
```
```

- [ ] **Step 2: Update main README.md**

Update the Installation section in `README.md`:
```markdown
## Installation

### Quick Start (Recommended)
```bash
npx loforger create
```

### Global Installation

**For NTFS/FUSE filesystems (Windows, WSL):**
```bash
git clone https://github.com/yourusername/loforger.git
cd loforger
./scripts/install.sh
```

**For standard Unix filesystems:**
```bash
npm install -g loforger
```

See [docs/INSTALLATION.md](docs/INSTALLATION.md) for detailed installation options.
```

- [ ] **Step 3: Commit documentation**

```bash
git add docs/INSTALLATION.md README.md
git commit -m "docs: add comprehensive installation guide

Document multiple installation methods to handle permission
issues on NTFS/FUSE filesystems. Include troubleshooting
guide and platform-specific notes."
```

---

## Track 2: Bun Binary Compilation Project

**Location:** `/media/data/Projects/loforger-bun`

### Task 2.1: Initialize Bun Project

**Files:**
- Create: `/media/data/Projects/loforger-bun/package.json`
- Create: `/media/data/Projects/loforger-bun/README.md`

- [ ] **Step 1: Create Bun project structure**

```bash
cd /media/data/Projects/loforger-bun
cat > package.json << 'EOF'
{
  "name": "loforger-bun",
  "version": "0.1.0",
  "description": "Loforger CLI compiled to standalone binary with Bun",
  "type": "module",
  "bin": {
    "loforger": "./dist/index.js"
  },
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target bun",
    "compile": "bun build ./src/index.ts --compile --outfile loforger",
    "dev": "bun run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "commander": "^11.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF
```

- [ ] **Step 2: Create Bun README**

```bash
cat > README.md << 'EOF'
# Loforger (Bun Binary)

Experimental standalone binary version of Loforger CLI compiled with Bun.

## Prerequisites

- [Bun](https://bun.sh/) installed

## Build

```bash
# Install dependencies
bun install

# Compile to standalone binary
bun run compile

# Binary will be at: ./loforger
```

## Usage

```bash
# Run compiled binary
./loforger --help
./loforger create my-project
```

## Comparison

| Feature | Node.js | Bun Binary |
|---------|---------|------------|
| Startup | ~100ms | ~10ms |
| File Size | ~50MB (with node) | ~50MB |
| Dependencies | node required | Self-contained |
| Permissions | chmod issues on NTFS | Works everywhere |
EOF
```

- [ ] **Step 3: Copy source files from original project**

```bash
mkdir -p /media/data/Projects/loforger-bun/src
cp /media/data/Projects/claude-template-scaffold/src/index.tsx /media/data/Projects/loforger-bun/src/index.ts
# Note: Will need to adapt for Bun (remove React/Ink dependencies)
```

### Task 2.2: Adapt Code for Bun

**Files:**
- Create: `/media/data/Projects/loforger-bun/src/index.ts`
- Create: `/media/data/Projects/loforger-bun/tsconfig.json`

- [ ] **Step 1: Create Bun-compatible CLI (without React/Ink)**

Create `/media/data/Projects/loforger-bun/src/index.ts`:
```typescript
#!/usr/bin/env bun
import { Command } from "commander";

const program = new Command();

program
  .name("loforger")
  .description("Interactive CLI for scaffolding modern web projects (Bun edition)")
  .version("0.1.0");

program
  .command("create [project-name]")
  .description("Create a new project interactively")
  .option("-p, --preset <preset>", "Use a preset configuration")
  .option("-m, --mode <mode>", "Project mode (mvp, production, extend)")
  .action(async (projectName: string | undefined, options: any) => {
    console.log("🚀 Creating new project...");
    if (projectName) {
      console.log(`Project name: ${projectName}`);
    }
    if (options.preset) {
      console.log(`Using preset: ${options.preset}`);
    }
    console.log("\n✨ This is the Bun experimental version!");
    console.log("Full interactive mode coming soon...");
  });

program
  .command("list-presets")
  .description("List available presets")
  .action(() => {
    console.log("Available presets:");
    console.log("  - nextjs-supabase-mvp    Next.js + Supabase MVP");
    console.log("  - nestjs-postgres-mvp    NestJS + PostgreSQL MVP");
  });

program.parse();
```

- [ ] **Step 2: Create Bun tsconfig**

Create `/media/data/Projects/loforger-bun/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Install dependencies and test compile**

```bash
cd /media/data/Projects/loforger-bun
bun install
bun run compile
```

Expected: Creates standalone `loforger` binary in current directory

- [ ] **Step 4: Test binary**

```bash
./loforger --help
./loforger list-presets
```

Expected: Commands work without node installed

---

## Track 3: Go Rewrite Project

**Location:** `/media/data/Projects/loforger-go`

### Task 3.1: Initialize Go Project

**Files:**
- Create: `/media/data/Projects/loforger-go/go.mod`
- Create: `/media/data/Projects/loforger-go/README.md`
- Create: `/media/data/Projects/loforger-go/main.go`

- [ ] **Step 1: Initialize Go module**

```bash
cd /media/data/Projects/loforger-go
go mod init github.com/yourusername/loforger-go
```

- [ ] **Step 2: Create Go README**

Create `/media/data/Projects/loforger-go/README.md`:
```markdown
# Loforger (Go Edition)

Native Go implementation of Loforger CLI for maximum compatibility
and performance.

## Features

- ✅ Single binary, no dependencies
- ✅ Works on all filesystems (NTFS, ext4, APFS)
- ✅ Fast startup (< 10ms)
- ✅ Small file size (~10-20MB)
- ✅ Cross-platform (Linux, macOS, Windows)

## Installation

### Pre-built Binaries
Download from releases page.

### Build from Source
```bash
# Clone repository
git clone https://github.com/yourusername/loforger-go.git
cd loforger-go

# Build
go build -o loforger

# Or install to $GOPATH/bin
go install
```

## Usage

```bash
# Create new project
./loforger create my-project

# With preset
./loforger create my-project --preset nextjs-supabase-mvp

# List presets
./loforger list-presets
```

## Comparison

| Feature | Node.js | Go |
|---------|---------|-----|
| Binary Size | ~50MB | ~15MB |
| Startup Time | ~100ms | ~5ms |
| Dependencies | Node.js runtime | None |
| Permissions | chmod issues | Works everywhere |
| Memory Usage | ~50MB | ~10MB |
```

### Task 3.2: Implement Go CLI

**Files:**
- Create: `/media/data/Projects/loforger-go/main.go`
- Create: `/media/data/Projects/loforger-go/cmd/create.go`
- Create: `/media/data/Projects/loforger-go/cmd/list.go`
- Create: `/media/data/Projects/loforger-go/cmd/root.go`

- [ ] **Step 1: Create main entry point**

Create `/media/data/Projects/loforger-go/main.go`:
```go
package main

import (
	"fmt"
	"os"

	"github.com/yourusername/loforger-go/cmd"
)

func main() {
	if err := cmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
```

- [ ] **Step 2: Create root command**

Create `/media/data/Projects/loforger-go/cmd/root.go`:
```go
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "loforger",
	Short: "Interactive CLI for scaffolding modern web projects",
	Long: `Loforger is a CLI tool for scaffolding modern web projects
with best practices and optimized configurations.`,
	Version: "0.1.0",
}

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.CompletionOptions.DisableDefaultCmd = true
}
```

- [ ] **Step 3: Create create command**

Create `/media/data/Projects/loforger-go/cmd/create.go`:
```go
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var (
	preset string
	mode   string
)

var createCmd = &cobra.Command{
	Use:   "create [project-name]",
	Short: "Create a new project interactively",
	Long:  `Create a new project with interactive prompts for configuration.`,
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		projectName := "my-project"
		if len(args) > 0 {
			projectName = args[0]
		}

		fmt.Printf("🚀 Creating new project: %s\n", projectName)
		
		if preset != "" {
			fmt.Printf("Using preset: %s\n", preset)
		}
		if mode != "" {
			fmt.Printf("Mode: %s\n", mode)
		}

		fmt.Println("\n✨ Go edition - Full implementation coming soon!")
		fmt.Println("This is a proof-of-concept showing the CLI structure.")
		
		return nil
	},
}

func init() {
	rootCmd.AddCommand(createCmd)
	createCmd.Flags().StringVarP(&preset, "preset", "p", "", "Use a preset configuration")
	createCmd.Flags().StringVarP(&mode, "mode", "m", "", "Project mode (mvp, production, extend)")
}
```

- [ ] **Step 4: Create list-presets command**

Create `/media/data/Projects/loforger-go/cmd/list.go`:
```go
package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list-presets",
	Short: "List available presets",
	Long:  `Display a list of all available project presets.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Available presets:")
		fmt.Println("  - nextjs-supabase-mvp    Next.js + Supabase MVP")
		fmt.Println("  - nestjs-postgres-mvp    NestJS + PostgreSQL MVP")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(listCmd)
}
```

- [ ] **Step 5: Install dependencies and build**

```bash
cd /media/data/Projects/loforger-go
go get github.com/spf13/cobra
go mod tidy
go build -o loforger
```

Expected: Creates `loforger` binary

- [ ] **Step 6: Test Go binary**

```bash
./loforger --help
./loforger list-presets
./loforger create test-project --preset nextjs-supabase-mvp
```

Expected: Commands work correctly

---

## Summary & Next Steps

### What We've Built

1. **Node.js/TS Project**: Wrapper scripts + comprehensive documentation
2. **Bun Project**: Experimental compile-to-binary approach
3. **Go Project**: Native binary implementation

### Recommended Usage

- **End users**: Use `npx loforger` or the install script
- **NTFS/Windows users**: Use Bun binary or Go binary
- **Performance critical**: Use Go binary

### Future Enhancements

- [ ] Add full interactive prompts to Bun version
- [ ] Add full interactive prompts to Go version (using bubbletea)
- [ ] Create GitHub Actions for automated releases
- [ ] Add template scaffolding logic to Go version
- [ ] Cross-compile Go binary for all platforms
