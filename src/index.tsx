#!/usr/bin/env node
import { program } from "commander";
import { createCommand } from "./cli/commands/create.js";

program
	.name("loforger")
	.description("Interactive CLI for scaffolding modern web projects")
	.version("0.1.0");

program
	.command("create")
	.description("Create a new project interactively")
	.option("-p, --preset <preset>", "Use a preset configuration")
	.option("-m, --mode <mode>", "Project mode (mvp, production, extend)")
	.option("--platform <platform>", "Target platform")
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
