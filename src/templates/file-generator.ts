import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import type { TemplateManifest } from './template-loader.js';

export interface GenerateOptions {
  templateId: string;
  manifest: TemplateManifest;
  answers: Record<string, unknown>;
  outputDir: string;
}

export class FileGenerator {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(process.cwd(), 'templates');
  }

  async generate(options: GenerateOptions): Promise<void> {
    const { templateId, manifest, answers, outputDir } = options;

    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Register Handlebars helpers
    Handlebars.registerHelper('kebabCase', (str: string) => {
      return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase().replace(/\s+/g, '-');
    });

    Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    
    // Generate each file
    for (const fileDef of manifest.files) {
      // Check condition if present
      if (fileDef.condition && !this.evaluateCondition(fileDef.condition, answers)) {
        continue;
      }

      const templateContent = await this.loadTemplateFile(templateId, fileDef.template);
      if (!templateContent) {
        console.warn(`Template file not found: ${fileDef.template}`);
        continue;
      }

      // Render template
      const template = Handlebars.compile(templateContent);
      const rendered = template(answers);

      // Write file
      const outputPath = path.join(outputDir, fileDef.path);
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, rendered);
      console.log(`  Created: ${fileDef.path}`);
    }

    console.log(`✓ Generated project in ${outputDir}`);
  }

  private async loadTemplateFile(templateId: string, templatePath: string): Promise<string | null> {
    const fullPath = path.join(this.templatesDir, templateId, 'files', templatePath);
    
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  private evaluateCondition(condition: string, answers: Record<string, unknown>): boolean {
    // Simple condition evaluator - in production use a proper expression parser
    try {
      return new Function('answers', `return ${condition}`)(answers);
    } catch {
      return true;
    }
  }
}

export function createFileGenerator(templatesDir?: string): FileGenerator {
  return new FileGenerator(templatesDir);
}

export default FileGenerator;
