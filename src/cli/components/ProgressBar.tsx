import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { THEME } from "../theme.js";

interface ProgressBarProps {
	current: number;
	total: number;
	group?: string;
	width?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
	current,
	total,
	group,
	width = 50,
}) => {
	const percentage = Math.round((current / total) * 100);

	// Calculate bar width based on available width
	const minBarWidth = 20;
	const maxBarWidth = 50;
	const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, width - 15));

	const filled = Math.round((current / total) * barWidth);
	const empty = barWidth - filled;

	// Determine color based on progress
	let color: string;
	if (percentage < 30) color = THEME.error;
	else if (percentage < 60) color = THEME.warning;
	else if (percentage < 90) color = THEME.accent;
	else color = THEME.success;

	return (
		<Box flexDirection="column" marginY={1}>
			{group && (
				<Box marginBottom={0}>
					<Text dimColor>
						Step <Text bold>{current}</Text> of {total}
						{"  "}
						<Text color={color}>({percentage}%)</Text>
						{"  "}
						<Text dimColor>— {group}</Text>
					</Text>
				</Box>
			)}
			{!group && (
				<Text dimColor>
					Step {current} of {total}{" "}
					<Text color={color}>({percentage}%)</Text>
				</Text>
			)}
			<Box>
				<Text color={color}>{"■".repeat(filled)}</Text>
				<Text dimColor>{"□".repeat(empty)}</Text>
			</Box>
		</Box>
	);
};

export default ProgressBar;
