export interface StackProfile {
	meta: {
		generated_at: string;
		schema_version: string;
	};
	profile: {
		id: string;
		name: string;
		description: string;
		mode: "mvp" | "production" | "extend";
		platform: string[];
		complexity: "minimal" | "standard" | "full";
	};
	stack: {
		workspace: { type: string; config?: Record<string, unknown> };
		language: string[];
		runtime: string;
		package_manager: string;
		frontend: {
			framework: string;
			ui_library: string;
			state_management: string;
			styling: string[];
		};
		backend: {
			framework: string;
			api_style: string[];
		};
		database: {
			primary: string;
			orm: string;
			migrations: boolean;
			seeder: boolean;
		};
		auth: {
			provider: string;
			methods: string[];
			rbac: boolean;
		};
		infra: {
			hosting: string;
			containerization: string[];
			ci_cd: string;
		};
		tooling: {
			linter: string;
			testing: {
				unit: string;
				e2e: string;
				component: string;
			};
			monitoring: string[];
		};
		addons: {
			payment: string;
			email: string;
			file_storage: string;
			queue: string;
		};
	};
	context7_targets?: Array<{
		name: string;
		context7_id: string;
		topics: string[];
	}>;
}
