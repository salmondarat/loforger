import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime

interface ProgressBarProps {
	current: number;
	total: number;
	label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
	current,
	total,
	label,
}) => {
	const percentage = Math.round((current / total) * 100);
	const filled = Math.round((current / total) * 20);
	const empty = 20 - filled;

	return (
		<Box flexDirection="column">
			{label && <Text dimColor>{label}</Text>}
			<Box>
				<Text color="cyan">{"█".repeat(filled)}</Text>
				<Text dimColor>{"░".repeat(empty)}</Text>
				<Text>
					{" "}
					{percentage}% ({current}/{total})
				</Text>
			</Box>
		</Box>
	);
};

export default ProgressBar;
