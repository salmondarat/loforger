import path from "node:path";
import fs from "fs-extra";
import { render } from "ink";
import React from "react"; // biome-ignore lint/correctness/noUnusedImports: required for JSX runtime
import type { AnswerValue } from "../../types/index.js";
import { FileGenerator } from "../../templates/file-generator.js";
import { TemplateLoader } from "../../templates/template-loader.js";
import App from "../components/App.js";
import type { GenerationContext } from "../types.js";
import { Spinner } from "../utils/spinner.js";
import { renderPostGenerationSummary } from "../utils/post-generation-summary.js";

interface CreateCommandOptions {
	preset?: string;
	mode?: string;
	platform?: string;
	name?: string;
}

const PRESETS: Record<string, Record<string, AnswerValue>> = {
	"nextjs-supabase-mvp": {
		mode: "mvp",
		platform: "web",
		workspace: "single",
		language: "typescript",
		frontend_framework: "nextjs",
		backend_framework: "nextjs-api",
		database: "supabase",
		auth_provider: "supabase-auth",
	},
	"nestjs-postgres-mvp": {
		mode: "mvp",
		platform: "api-only",
		language: "typescript",
		backend_framework: "nestjs",
		database: "postgresql",
		auth_provider: "better-auth",
	},
};

export async function createCommand(options: CreateCommandOptions = {}) {
	let initialAnswers: Record<string, AnswerValue> = {};

	if (options.preset && PRESETS[options.preset]) {
		initialAnswers = PRESETS[options.preset];
		console.log(`Using preset: ${options.preset}`);
	}

	if (options.mode) initialAnswers.mode = options.mode;
	if (options.platform) initialAnswers.platform = options.platform;
	if (options.name) initialAnswers.project_name = options.name;

	const ctx: GenerationContext = {
		answers: {},
		projectName: options.name || "",
		isConfirmed: false,
	};

	const { waitUntilExit } = render(
		<App initialAnswers={initialAnswers} generationCtx={ctx} />,
	);
	await waitUntilExit();

	if (!ctx.isConfirmed) {
		return; // User exited without confirming
	}

	// Resolve project name
	const projectName =
		ctx.projectName ||
		(ctx.answers.project_name as string) ||
		"my-app";
	const outputDir = path.resolve(process.cwd(), projectName);

	// Check output directory doesn't already exist
	if (await fs.pathExists(outputDir)) {
		console.error(
			`\x1b[31mError: Directory "${projectName}" already exists. Aborting.\x1b[0m`,
		);
		process.exit(1);
	}

	// Find matching template
	const loader = new TemplateLoader();
	const manifest = await loader.findMatchingTemplate(ctx.answers);

	if (!manifest) {
		console.error(
			"\x1b[31mError: No matching template found for your configuration.\x1b[0m",
		);
		process.exit(1);
	}

	// Generate files with progress
	const spinner = new Spinner();
	spinner.start("Generating project files...");
	const startTime = Date.now();

	const generator = new FileGenerator();
	const generatedFiles = await generator.generate({
		templateId: manifest.id,
		manifest,
		answers: ctx.answers,
		outputDir,
		onProgress: (file, index, total) => {
			spinner.update(`${file} (${index}/${total})`);
		},
	});

	const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
	spinner.succeed(
		`Generated ${generatedFiles.length} file${generatedFiles.length !== 1 ? "s" : ""} in ${elapsed}s`,
	);

	// Show post-generation summary
	renderPostGenerationSummary({
		projectName,
		files: generatedFiles,
		instructions: manifest.postGenerate?.instructions,
		elapsed,
	});
}

export default createCommand;
