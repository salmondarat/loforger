import { Box, Text } from "ink";
import React from "react";
import type { CompatibilityIssue } from "../../types/index.js";

interface SummaryViewProps {
	summary: Array<{ group: string; label: string; value: string }>;
	issues: CompatibilityIssue[];
	onConfirm: () => void;
	onEdit: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
	summary,
	issues,
}) => {
	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");

	return (
		<Box flexDirection="column">
			<Text bold underline>
				Project Configuration Summary
			</Text>

			{errors.length > 0 && (
				<Box flexDirection="column" marginY={1}>
					<Text color="red" bold>
						Errors (must fix before proceeding):
					</Text>
					{errors.map((issue) => (
						<Box key={issue.id} flexDirection="column" marginY={1}>
							<Text color="red">• {issue.title}</Text>
							<Text dimColor> {issue.reason}</Text>
							<Text color="yellow"> → {issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			{warnings.length > 0 && (
				<Box flexDirection="column" marginY={1}>
					<Text color="yellow" bold>
						Warnings:
					</Text>
					{warnings.map((issue) => (
						<Box key={issue.id} flexDirection="column" marginY={1}>
							<Text color="yellow">• {issue.title}</Text>
							<Text dimColor> {issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			<Box flexDirection="column" marginY={1}>
				{summary.map((item) => (
					<Box key={item.label}>
						<Text dimColor>{item.label}:</Text>
						<Text> {item.value}</Text>
					</Box>
				))}
			</Box>

			<Box marginY={1}>
				<Text>Press </Text>
				<Text bold color="green">
					Enter
				</Text>
				<Text> to generate or </Text>
				<Text bold>e</Text>
				<Text> to edit</Text>
			</Box>
		</Box>
	);
};

export default SummaryView;
