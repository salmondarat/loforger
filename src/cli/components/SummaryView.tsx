import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import type { CompatibilityIssue } from "../../types/index.js";
import { THEME } from "../theme.js";

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

	const groupNames = Object.keys(groupedSummary);

	return (
		<Box flexDirection="column">
			{/* Header */}
			<Box marginBottom={1}>
				<Text color={THEME.primary} bold>
					{"◈ Loforger"}
				</Text>
				<Text dimColor>{" — Configuration Review"}</Text>
			</Box>

			{/* Title */}
			<Box borderStyle="round" borderColor={THEME.accent} paddingX={2} paddingY={0} marginY={1}>
				<Text bold color={THEME.accent}>
					{"Project Configuration Summary"}
				</Text>
			</Box>

			{/* Errors */}
			{errors.length > 0 && (
				<Box
					borderStyle="round"
					borderColor={THEME.error}
					padding={1}
					marginY={1}
					flexDirection="column"
				>
					<Text color={THEME.error} bold>
						{"✗ Errors (must fix before proceeding):"}
					</Text>
					{errors.map((issue) => (
						<Box key={issue.id} marginY={0} flexDirection="column">
							<Text color={THEME.error} wrap="end">{"• "}{issue.title}</Text>
							<Text dimColor wrap="end">{"  "}{issue.reason}</Text>
							<Text color={THEME.warning} wrap="end">{"  → "}{issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Warnings */}
			{warnings.length > 0 && (
				<Box
					borderStyle="round"
					borderColor={THEME.warning}
					padding={1}
					marginY={1}
					flexDirection="column"
				>
					<Text color={THEME.warning} bold>
						{"⚠ Warnings:"}
					</Text>
					{warnings.map((issue) => (
						<Box key={issue.id} marginY={0}>
							<Text color={THEME.warning} wrap="end">{"• "}{issue.title}</Text>
							<Text dimColor wrap="end">{"  "}{issue.suggestion}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Configuration Summary by Group */}
			<Box borderStyle="single" padding={1} marginY={1} flexDirection="column">
				{groupNames.map((group, gi) => (
					<Box key={group} flexDirection="column">
						{gi > 0 && (
							<Box marginY={0}>
								<Text dimColor>{"─".repeat(40)}</Text>
							</Box>
						)}
						<Text color={THEME.primary} bold>
							{group.toUpperCase()}
						</Text>
						<Box marginLeft={2} flexDirection="column">
							{groupedSummary[group].map((item) => (
								<Box key={item.label}>
									<Text dimColor>{item.label}{": "}</Text>
									<Text color={THEME.success} wrap="end">{item.value}</Text>
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
						{"Press "}
						<Text bold color={THEME.success}>{"Enter"}</Text>
						{" to generate project or "}
						<Text bold color={THEME.warning}>{"e"}</Text>
						{" to edit configuration"}
					</Text>
				) : (
					<Text color={THEME.error} wrap="end">
						{"Please fix errors above. Press "}
						<Text bold>{"e"}</Text>
						{" to go back and edit."}
					</Text>
				)}
			</Box>
		</Box>
	);
};

export default SummaryView;
