interface TreeNode {
	[name: string]: TreeNode | null;
}

export function buildFileTree(files: string[], rootName: string): string {
	const root: TreeNode = {};

	for (const file of files) {
		const parts = file.split("/");
		let current = root;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (i === parts.length - 1) {
				// File (leaf)
				current[part] = null;
			} else {
				// Directory
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part] as TreeNode;
			}
		}
	}

	return renderTree(rootName, root, "");
}

function renderTree(name: string, node: TreeNode | null, prefix: string): string {
	const lines: string[] = [];

	if (node === null) {
		// Leaf file
		lines.push(`${prefix}${name}`);
		return lines.join("\n");
	}

	// Directory
	const entries = Object.entries(node);
	if (prefix === "") {
		// Root directory
		lines.push(`${name}/`);
	} else {
		lines.push(`${prefix}${name}/`);
	}

	// Sort: directories first, then files
	const sorted = entries.sort(([, a], [, b]) => {
		const aIsDir = a !== null;
		const bIsDir = b !== null;
		if (aIsDir && !bIsDir) return -1;
		if (!aIsDir && bIsDir) return 1;
		return 0;
	});

	for (let i = 0; i < sorted.length; i++) {
		const [childName, childNode] = sorted[i];
		const isLast = i === sorted.length - 1;
		const connector = isLast ? "└── " : "├── ";
		const childPrefix = prefix + (prefix === "" ? "" : (prefix.endsWith("└── ") || prefix.endsWith("├── ") ? "" : ""));

		if (childNode === null) {
			// File
			lines.push(`${prefix}${connector}${childName}`);
		} else {
			// Directory - recurse with proper indentation
			const subLines = renderTree(
				childName,
				childNode,
				prefix + (isLast ? "    " : "│   "),
			);
			// The first line of subLines already has the name, we need to replace it with connector
			lines.push(`${prefix}${connector}${childName}/`);
			// Skip first line of subLines (it's the directory name repeated)
			const restLines = subLines.split("\n").slice(1);
			if (restLines.length > 0) {
				lines.push(...restLines);
			}
		}
	}

	return lines.join("\n");
}
