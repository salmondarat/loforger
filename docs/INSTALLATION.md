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

## Alternative Implementations

We also provide alternative implementations for better compatibility:

### Bun Binary (Experimental)
Standalone binary compiled with Bun. See `../loforger-bun/README.md`

### Go Edition (Native Binary)
Native Go implementation for maximum compatibility. See `../loforger-go/README.md`
