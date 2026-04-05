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

	// Determine color based on progress
	let color: string;
	if (percentage < 30) color = "red";
	else if (percentage < 60) color = "yellow";
	else if (percentage < 90) color = "blue";
	else color = "green";

	return (
		<Box flexDirection="column" marginY={1}>
			{label && (
				<Text dimColor>
					{label} {" "}
					<Text color={color}>{percentage}%</Text>
				</Text>
			)}
			<Box>
				<Text color={color}>{"█".repeat(filled)}</Text>
				<Text dimColor>{"░".repeat(empty)}</Text>
				<Text dimColor>
					{" "}({current}/{total})
				</Text>
			</Box>
		</Box>
	);
};

export default ProgressBar;
