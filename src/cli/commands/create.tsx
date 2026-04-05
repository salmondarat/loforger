import { render } from "ink";
import React from "react";
import type { AnswerValue } from "../../types/index.js";
import App from "../components/App.js";

interface CreateCommandOptions {
	preset?: string;
	mode?: string;
	platform?: string;
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

	const { waitUntilExit } = render(<App initialAnswers={initialAnswers} />);
	await waitUntilExit();
}

export default createCommand;
