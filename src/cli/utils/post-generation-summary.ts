import { buildFileTree } from "./file-tree.js";

interface SummaryOptions {
	projectName: string;
	files: string[];
	instructions?: string[];
	elapsed: string;
}

export function renderPostGenerationSummary(options: SummaryOptions): void {
	const { projectName, files, instructions, elapsed } = options;

	const reset = "\x1b[0m";
	const green = "\x1b[32m";
	const cyan = "\x1b[36m";
	const yellow = "\x1b[33m";
	const dim = "\x1b[2m";
	const bold = "\x1b[1m";

	const divider = `${dim}${"─".repeat(50)}${reset}`;

	console.log();
	console.log(divider);
	console.log();
	console.log(
		`  ${green}${bold}✔ Project "${projectName}" generated successfully!${reset}`,
	);
	console.log(`  ${dim}Completed in ${elapsed}s${reset}`);
	console.log();

	// File tree
	console.log(`  ${cyan}${bold}Files created:${reset}`);
	console.log();
	const tree = buildFileTree(files, projectName);
	for (const line of tree.split("\n")) {
		console.log(`    ${line}`);
	}
	console.log();

	// Next steps
	if (instructions && instructions.length > 0) {
		console.log(`  ${yellow}${bold}Next steps:${reset}`);
		console.log();
		console.log(`    ${dim}cd ${projectName}${reset}`);
		for (const instruction of instructions) {
			console.log(`    ${dim}${instruction}${reset}`);
		}
		console.log();
	}

	console.log(divider);
	console.log();
}
