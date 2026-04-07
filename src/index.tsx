#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { program } from "commander";
import { createCommand } from "./cli/commands/create.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
	readFileSync(path.join(__dirname, "..", "package.json"), "utf-8"),
);

program
	.name("loforger")
	.description("Interactive CLI for scaffolding modern web projects")
	.version(pkg.version);

program
	.command("create")
	.description("Create a new project interactively")
	.option("-p, --preset <preset>", "Use a preset configuration")
	.option("-m, --mode <mode>", "Project mode (mvp, production, extend)")
	.option("--platform <platform>", "Target platform")
	.option("-n, --name <name>", "Project name (used as output directory)")
	.action(createCommand);

program
	.command("list-presets")
	.description("List available presets")
	.action(() => {
		console.log("Available presets:");
		console.log("  - nextjs-supabase-mvp    Next.js + Supabase MVP");
		console.log("  - nestjs-postgres-mvp    NestJS + PostgreSQL MVP");
	});

program.parse();
