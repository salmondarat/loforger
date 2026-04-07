import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface TemplateManifest {
	id: string;
	name: string;
	description: string;
	mode: string;
	requiredAnswers: Record<string, string>;
	files: Array<{
		path: string;
		template: string;
		condition?: string;
	}>;
	postGenerate?: {
		commands?: string[];
		instructions?: string[];
	};
}

export class TemplateLoader {
	private templatesDir: string;

	constructor(templatesDir?: string) {
		// Saat di-install globally, template ada di ../../templates relative ke file ini (dist/templates/template-loader.js)
		const packageTemplatesDir = path.join(__dirname, "..", "..", "templates");
		this.templatesDir = templatesDir || packageTemplatesDir;
	}

	async loadManifest(templateId: string): Promise<TemplateManifest | null> {
		const manifestPath = path.join(
			this.templatesDir,
			templateId,
			"manifest.json",
		);

		if (!(await fs.pathExists(manifestPath))) {
			return null;
		}

		return fs.readJson(manifestPath);
	}

	async listTemplates(): Promise<
		Array<{ id: string; name: string; description: string }>
	> {
		if (!(await fs.pathExists(this.templatesDir))) {
			return [];
		}

		const dirs = await fs.readdir(this.templatesDir);
		const templates = [];

		for (const dir of dirs) {
			const manifest = await this.loadManifest(dir);
			if (manifest) {
				templates.push({
					id: manifest.id,
					name: manifest.name,
					description: manifest.description,
				});
			}
		}

		return templates;
	}

	async findMatchingTemplate(
		answers: Record<string, unknown>,
	): Promise<TemplateManifest | null> {
		const templates = await this.listTemplates();
		for (const t of templates) {
			const manifest = await this.loadManifest(t.id);
			if (!manifest) continue;

			const matches = Object.entries(manifest.requiredAnswers).every(
				([key, value]) => {
					// Try multiple key formats to find a match:
					// 1. As-is (e.g. "database")
					// 2. Dots→underscores (e.g. "frontend.framework" → "frontend_framework")
					// 3. First segment only (e.g. "database.primary" → "database")
					const underscored = key.replace(/\./g, "_");
					const firstSegment = key.split(".")[0];
					return (
						answers[key] === value ||
						answers[underscored] === value ||
						answers[firstSegment] === value
					);
				},
			);
			if (matches) return manifest;
		}
		return null;
	}

	async loadTemplateFile(
		templateId: string,
		filePath: string,
	): Promise<string | null> {
		const fullPath = path.join(
			this.templatesDir,
			templateId,
			"files",
			filePath,
		);

		if (!(await fs.pathExists(fullPath))) {
			return null;
		}

		return fs.readFile(fullPath, "utf-8");
	}
}

export function createTemplateLoader(templatesDir?: string): TemplateLoader {
	return new TemplateLoader(templatesDir);
}

export default TemplateLoader;
