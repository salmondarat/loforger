import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
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

	// Group summary items by their group
	const groupedSummary = summary.reduce(
		(acc, item) => {
			if (!acc[item.group]) {
				acc[item.group] = [];
			}
			acc[item.group].push(item);
			return acc;
		},
		{} as Record<string, Array<{ group: string; label: string; value: string }>>,
	);

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					◈ Loforger
				</Text>
				<Text dimColor> - Configuration Review</Text>
			</Box>

			{/* Title */}
			<Box borderStyle="round" borderColor="blue" padding={1} marginY={1}>
				<Text bold color="blue">
					📋 Project Configuration Summary
				</Text>
			</Box>

			{/* Errors */}
			{errors.length > 0 && (
				<Box
					borderStyle="round"
					borderColor="red"
					padding={1}
					marginY={1}
					flexDirection="column"
				>
					<Text color="red" bold>
						✗ Errors (must fix before proceeding):
					</Text>
					{errors.map((issue) => (
						<Box key={issue.id} marginY={0} flexDirection="column">
							<Text color="red" wrap="end">• {issue.title}</Text>
							<Text dimColor wrap="end">  {issue.reason}</Text>
							<Text color="yellow" wrap="end">  → {issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Warnings */}
			{warnings.length > 0 && (
				<Box
					borderStyle="round"
					borderColor="yellow"
					padding={1}
					marginY={1}
					flexDirection="column"
				>
					<Text color="yellow" bold>
						⚠ Warnings:
					</Text>
					{warnings.map((issue) => (
						<Box key={issue.id} marginY={0}>
							<Text color="yellow" wrap="end">• {issue.title}</Text>
							<Text dimColor wrap="end">  {issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Configuration Summary by Group */}
			<Box borderStyle="single" padding={1} marginY={1} flexDirection="column">
				{Object.entries(groupedSummary).map(([group, items]) => (
					<Box key={group} flexDirection="column" marginY={0}>
						<Text color="cyan" bold underline>
							{group.toUpperCase()}
						</Text>
						<Box marginLeft={2} flexDirection="column">
							{items.map((item) => (
								<Box key={item.label}>
									<Text dimColor>{item.label}:</Text>
									<Text color="green" wrap="end"> {item.value}</Text>
								</Box>
								))}
							</Box>
						</Box>
					))}
			</Box>

			{/* Actions */}
			<Box marginTop={1}>
				{errors.length === 0 ? (
					<Text wrap="end">
						Press <Text bold color="green">Enter</Text> to generate project or{" "}
						<Text bold color="yellow">e</Text> to edit configuration
					</Text>
				) : (
					<Text color="red" wrap="end">
						Please fix errors above. Press <Text bold>e</Text> to go back and edit.
					</Text>
				)}
			</Box>
		</Box>
	);
};

export default SummaryView;
