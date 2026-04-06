#!/usr/bin/env node
/**
 * Cross-platform permission fix for the CLI entry point.
 * Gracefully handles NTFS/FUSE filesystems where chmod is not supported.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distEntry = path.join(__dirname, "..", "dist", "index.js");

if (fs.existsSync(distEntry)) {
	try {
		fs.chmodSync(distEntry, 0o755);
	} catch {
		// NTFS/FUSE: chmod not supported — skip silently.
		// The shebang line (#!/usr/bin/env node) handles execution on Unix,
		// and on Windows npm creates a .cmd shim automatically.
	}
}
