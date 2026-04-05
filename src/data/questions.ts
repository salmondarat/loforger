import type { AnswerValue, Answers, Option, Question } from "../types/index.js";

// ─── Helper evaluators ────────────────────────────────────────────────────────

const is = (id: string, val: string) => (a: Answers) => a[id] === val;
const isAny = (id: string, vals: string[]) => (a: Answers) =>
	vals.includes(a[id] as string);
const isExtend = is("mode", "extend");
const isMVP = is("mode", "mvp");
const isAPIOnly = is("platform", "api-only");
const isWeb = isAny("platform", ["web"]);
const isMobile = isAny("platform", ["mobile-rn", "mobile-flutter"]);
const not = (fn: (a: Answers) => boolean) => (a: Answers) => !fn(a);
const or =
	(...fns: Array<(a: Answers) => boolean>) =>
	(a: Answers) =>
		fns.some((f) => f(a));

// ─── Question Definitions ─────────────────────────────────────────────────────

export const QUESTIONS: Question[] = [
	// ══════════════════════════════════════════════════════════════
	// STEP 0 — PROJECT MODE
	// ══════════════════════════════════════════════════════════════
	{
		id: "mode",
		group: "Project mode",
		step: 0,
		type: "single",
		prompt: "What would you like to do?",
		hint: "This determines the complexity of setup and tools used.",
		required: true,
		options: [
			{
				value: "mvp",
				label: "MVP mode",
				description:
					"Start from scratch, fast, minimal config — focus on core features",
				badge: "recommended",
			},
			{
				value: "production",
				label: "Production mode",
				description:
					"Full setup: CI/CD, monitoring, security hardening, Docker",
				badge: "popular",
			},
			{
				value: "extend",
				label: "Extend mode",
				description: "Project already exists, add new features",
				badge: "popular",
			},
		],
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 1 — PROJECT NAME
	// ══════════════════════════════════════════════════════════════
	{
		id: "project_name",
		group: "Project info",
		step: 1,
		type: "text",
		prompt: "What is your project name?",
		hint: "Will be used as folder name, package.json name, and README title.",
		skipIf: isExtend,
		default: "my-app",
		validate: (val) => {
			if (typeof val !== "string" || val.trim().length === 0)
				return "Project name cannot be empty.";
			if (!/^[a-z0-9-]+$/.test(val as string))
				return "Use lowercase letters, numbers, or hyphens only (kebab-case).";
			return null;
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 2 — TARGET PLATFORM
	// ══════════════════════════════════════════════════════════════
	{
		id: "platform",
		group: "Target platform",
		step: 2,
		type: "single",
		prompt: "What is your target platform?",
		skipIf: isExtend,
		required: true,
		options: [
			{
				value: "web",
				label: "Web app",
				description: "Browser-based, responsive, can be SSR or SPA",
				badge: "popular",
			},
			{
				value: "api-only",
				label: "API / Backend only",
				description: "Headless backend, no frontend",
				badge: "popular",
			},
			{
				value: "mobile-rn",
				label: "Mobile — React Native",
				description: "iOS + Android, JavaScript/TypeScript ecosystem",
				badge: "popular",
			},
			{
				value: "mobile-flutter",
				label: "Mobile — Flutter",
				description: "iOS + Android, Dart, single codebase",
				badge: "popular",
			},
		],
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 3 — WORKSPACE STRUCTURE
	// ══════════════════════════════════════════════════════════════
	{
		id: "workspace",
		group: "Workspace structure",
		step: 3,
		type: "single",
		prompt: "Workspace structure:",
		hint: "Monorepo is useful if you have multiple apps in one repo (web + mobile + API).",
		skipIf: or(isExtend, is("platform", "mobile-flutter")),
		default: "single",
		options: [
			{
				value: "single",
				label: "Single app",
				description: "One folder, one app — simplest",
				badge: "recommended",
			},
			{
				value: "turborepo",
				label: "Monorepo — Turborepo",
				description: "Automatic build cache, simple pipeline",
				badge: "recommended",
			},
		],
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 4 — LANGUAGE
	// ══════════════════════════════════════════════════════════════
	{
		id: "language",
		group: "Language & runtime",
		step: 4,
		type: "single",
		prompt: "Programming language:",
		skipIf: or(isExtend, is("platform", "mobile-flutter")),
		default: "typescript",
		options: (answers): Option[] => {
			const platform = answers.platform as string;

			if (platform === "mobile-rn") {
				return [
					{ value: "typescript", label: "TypeScript", badge: "recommended" },
					{ value: "javascript", label: "JavaScript" },
				];
			}

			if (platform === "mobile-flutter") {
				return [{ value: "dart", label: "Dart", badge: "recommended" }];
			}

			// Web or API-only
			return [
				{
					value: "typescript",
					label: "TypeScript",
					description: "Default for JS projects",
					badge: "recommended",
				},
				{
					value: "javascript",
					label: "JavaScript",
					description: "No type system",
				},
				{
					value: "python",
					label: "Python",
					description: "For FastAPI / Django",
				},
				{ value: "go", label: "Go", description: "For Gin / Fiber" },
			];
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 5 — FRONTEND FRAMEWORK
	// ══════════════════════════════════════════════════════════════
	{
		id: "frontend_framework",
		group: "Frontend",
		step: 5,
		type: "single",
		prompt: "Frontend framework:",
		skipIf: or(isExtend, isAPIOnly),
		required: true,
		options: (answers): Option[] => {
			const platform = answers.platform as string;
			const lang = answers.language as string;

			if (platform === "mobile-rn") {
				return [
					{
						value: "react-native-expo",
						label: "React Native + Expo",
						description: "Managed workflow, best DX for RN",
						badge: "recommended",
					},
					{
						value: "react-native-bare",
						label: "React Native (bare)",
						description: "Full control, more native module access",
					},
				];
			}

			if (platform === "mobile-flutter") {
				return [{ value: "flutter", label: "Flutter", badge: "recommended" }];
			}

			// Web platform — filter by language
			if (lang === "typescript" || lang === "javascript") {
				return [
					{
						value: "nextjs",
						label: "Next.js",
						description: "React, SSR + SSG + App Router",
						badge: "popular",
					},
					{
						value: "nuxt",
						label: "Nuxt",
						description: "Vue, SSR + SSG",
						badge: "popular",
					},
					{
						value: "sveltekit",
						label: "SvelteKit",
						description: "Svelte, lightweight, compiled",
						badge: "experimental",
					},
					{
						value: "vite-react",
						label: "Vite + React",
						description: "Pure SPA, no SSR",
						badge: "popular",
					},
					{
						value: "vite-vue",
						label: "Vite + Vue",
						description: "SPA Vue, fast HMR",
					},
				];
			}

			if (lang === "python") {
				return [
					{ value: "none", label: "None (API only / template engine)" },
					{
						value: "htmx",
						label: "HTMX + Jinja2",
						description: "Server-rendered with Django/FastAPI",
					},
				];
			}

			if (lang === "go") {
				return [
					{ value: "none", label: "None (API only)" },
					{
						value: "htmx",
						label: "HTMX + templ",
						description: "Server-rendered Go templates",
					},
				];
			}

			return [{ value: "none", label: "None" }];
		},
		postHook: (val, answers) => {
			// Auto-set backend if Next.js is selected
			if (val === "nextjs" && !answers.backend_framework) {
				return { backend_framework: "nextjs-api" };
			}
			return {};
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 6 — BACKEND FRAMEWORK
	// ══════════════════════════════════════════════════════════════
	{
		id: "backend_framework",
		group: "Backend",
		step: 6,
		type: "single",
		prompt: "Backend framework:",
		skipIf: isExtend,
		required: true,
		options: (answers): Option[] => {
			const lang = answers.language as string;
			const frontendFW = answers.frontend_framework as string;

			if (lang === "typescript" || lang === "javascript") {
				return [
					{
						value: "nextjs-api",
						label: "Next.js API Routes / Server Actions",
						description: "Built-in if using Next.js",
						badge: frontendFW === "nextjs" ? "recommended" : "popular",
					},
					{
						value: "nestjs",
						label: "NestJS",
						description: "TypeScript, modular, enterprise",
						badge: "popular",
					},
					{
						value: "fastify",
						label: "Fastify",
						description: "Node.js, fast, schema validation",
						badge: "popular",
					},
					{
						value: "express",
						label: "Express.js",
						description: "Minimal, classic, lots of tutorials",
						badge: "legacy",
					},
					{
						value: "supabase-baas",
						label: "Supabase (BaaS)",
						description: "Skip custom backend, use Supabase",
						badge: "recommended",
					},
					{ value: "none", label: "No backend" },
				];
			}

			if (lang === "python") {
				return [
					{
						value: "fastapi",
						label: "FastAPI",
						description: "Async, OpenAPI auto-gen, modern",
						badge: "recommended",
					},
					{
						value: "django",
						label: "Django",
						description: "Batteries-included, built-in ORM",
						badge: "popular",
					},
					{
						value: "flask",
						label: "Flask",
						description: "Minimal, microframework",
						badge: "legacy",
					},
				];
			}

			if (lang === "go") {
				return [
					{
						value: "gin",
						label: "Gin",
						description: "Performant, Express-like",
						badge: "popular",
					},
					{
						value: "fiber",
						label: "Fiber",
						description: "Express-like, very fast",
					},
					{
						value: "echo",
						label: "Echo",
						description: "High performance, extensible",
					},
				];
			}

			return [{ value: "none", label: "No backend" }];
		},
		postHook: (val, answers) => {
			// Auto-set database if BaaS is selected
			if (val === "supabase-baas" || val === "firebase-baas") {
				return { database: val.replace("-baas", ""), orm: "none" };
			}
			return {};
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 7 — DATABASE
	// ══════════════════════════════════════════════════════════════
	{
		id: "database",
		group: "Database",
		step: 7,
		type: "single",
		prompt: "Primary database:",
		skipIf: (a) => {
			const backend = a.backend_framework as string;
			return (
				isExtend(a) ||
				backend === "supabase-baas" ||
				backend === "firebase-baas" ||
				backend === "none"
			);
		},
		required: true,
		default: (answers) => {
			if (isMVP(answers)) return "sqlite";
			return "postgresql";
		},
		options: (answers): Option[] => {
			const lang = answers.language as string;
			const mode = answers.mode as string;

			const relational: Option[] = [
				{
					value: "postgresql",
					label: "PostgreSQL",
					description: "Open source, feature-rich, recommended",
					badge: "recommended",
				},
				{
					value: "mysql",
					label: "MySQL",
					description: "Widely hosted, popular",
					badge: "popular",
				},
				{
					value: "sqlite",
					label: "SQLite",
					description: "File-based, ideal for MVP / local dev",
					badge: mode === "mvp" ? "recommended" : undefined,
				},
				{
					value: "supabase",
					label: "Supabase PostgreSQL",
					description: "Managed + realtime + auth",
					badge: "recommended",
				},
			];

			const nosql: Option[] = [
				{
					value: "mongodb",
					label: "MongoDB",
					description: "Document database, flexible schema",
					badge: "popular",
				},
				{
					value: "redis",
					label: "Redis",
					description: "Cache, session, queue",
				},
			];

			if (lang === "go") return relational;

			return [...relational, ...nosql];
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 8 — AUTH PROVIDER
	// ══════════════════════════════════════════════════════════════
	{
		id: "auth_provider",
		group: "Auth",
		step: 8,
		type: "single",
		prompt: "Authentication system:",
		skipIf: isExtend,
		default: (answers): AnswerValue => {
			if (
				is("database", "supabase")(answers) ||
				is("backend_framework", "supabase-baas")(answers)
			)
				return "supabase-auth";
			if (is("frontend_framework", "nextjs")(answers)) return "nextauth";
			return "none";
		},
		options: (answers): Option[] => {
			const fw = answers.frontend_framework as string;
			const backend = answers.backend_framework as string;
			const db = answers.database as string;

			return [
				{
					value: "supabase-auth",
					label: "Supabase Auth",
					description: "Built-in if using Supabase",
					badge:
						db === "supabase" || backend === "supabase-baas"
							? "recommended"
							: undefined,
				},
				{
					value: "clerk",
					label: "Clerk",
					description: "Hosted UI + user management, best DX",
					badge: "recommended",
				},
				{
					value: "nextauth",
					label: "Auth.js / NextAuth",
					description: "Multi-provider, Next.js native",
					badge: fw === "nextjs" ? "recommended" : "popular",
				},
				{
					value: "better-auth",
					label: "Better Auth",
					description: "Modern, TypeScript, self-hosted",
					badge: "experimental",
				},
				{
					value: "firebase-auth",
					label: "Firebase Auth",
					description: "Google ecosystem",
				},
				{
					value: "auth0",
					label: "Auth0",
					description: "Enterprise, managed",
					badge: "popular",
				},
				{
					value: "custom-jwt",
					label: "Custom JWT",
					description: "Build from scratch",
				},
				{ value: "none", label: "No auth (public app)" },
			];
		},
	},

	// ══════════════════════════════════════════════════════════════
	// STEP 9 — CONFIRM
	// ══════════════════════════════════════════════════════════════
	{
		id: "_confirm",
		group: "Confirm",
		step: 9,
		type: "confirm",
		prompt: "Ready to generate your project?",
		hint: "Review your choices above before confirming.",
		default: true,
		required: true,
	},
];

export default QUESTIONS;
