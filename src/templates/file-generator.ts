import path from "node:path";
import fs from "fs-extra";
import Handlebars from "handlebars";
import type { TemplateManifest } from "./template-loader.js";

export interface GenerateOptions {
	templateId: string;
	manifest: TemplateManifest;
	answers: Record<string, unknown>;
	outputDir: string;
	onProgress?: (file: string, index: number, total: number) => void;
}

export class FileGenerator {
	private templatesDir: string;

	constructor(templatesDir?: string) {
		this.templatesDir = templatesDir || path.join(process.cwd(), "templates");
	}

	async generate(options: GenerateOptions): Promise<string[]> {
		const { templateId, manifest, answers, outputDir, onProgress } = options;
		const generatedFiles: string[] = [];

		// Ensure output directory exists
		await fs.ensureDir(outputDir);

		// Register Handlebars helpers
		Handlebars.registerHelper("kebabCase", (str: string) => {
			return str
				.replace(/([a-z])([A-Z])/g, "$1-$2")
				.toLowerCase()
				.replace(/\s+/g, "-");
		});

		Handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

		// Generate each file
		const totalFiles = manifest.files.length;
		for (let i = 0; i < manifest.files.length; i++) {
			const fileDef = manifest.files[i];

			// Check condition if present
			if (
				fileDef.condition &&
				!this.evaluateCondition(fileDef.condition, answers)
			) {
				continue;
			}

			const templateContent = await this.loadTemplateFile(
				templateId,
				fileDef.template,
			);
			if (!templateContent) {
				continue;
			}

			// Render template
			const template = Handlebars.compile(templateContent);
			const rendered = template(answers);

			// Write file
			const outputPath = path.join(outputDir, fileDef.path);
			await fs.ensureDir(path.dirname(outputPath));
			await fs.writeFile(outputPath, rendered);
			generatedFiles.push(fileDef.path);

			onProgress?.(fileDef.path, i + 1, totalFiles);
		}

		return generatedFiles;
	}

	private async loadTemplateFile(
		templateId: string,
		templatePath: string,
	): Promise<string | null> {
		const fullPath = path.join(
			this.templatesDir,
			templateId,
			"files",
			templatePath,
		);

		try {
			return await fs.readFile(fullPath, "utf-8");
		} catch {
			return null;
		}
	}

	private evaluateCondition(
		condition: string,
		answers: Record<string, unknown>,
	): boolean {
		// Simple condition evaluator - in production use a proper expression parser
		try {
			return new Function("answers", `return ${condition}`)(answers);
		} catch {
			return true;
		}
	}
}

export function createFileGenerator(templatesDir?: string): FileGenerator {
	return new FileGenerator(templatesDir);
}

export default FileGenerator;
