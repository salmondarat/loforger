import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { useEffect } from "react";
import type { AnswerValue, QuestionPresentation } from "../../types/index.js";
import { THEME } from "../theme.js";
import OptionList from "./OptionList.js";

interface QuestionCardProps {
	presentation: QuestionPresentation;
	value: AnswerValue;
	onChange: (value: AnswerValue) => void;
	onBack?: () => void;
	onContinue?: () => void;
	maxWidth?: number;
	stepInfo?: { current: number; total: number };
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
	presentation,
	value,
	onChange,
	onBack,
	onContinue,
	maxWidth = 80,
	stepInfo,
}) => {
	const { question, resolvedOptions, resolvedDefault } = presentation;

	useEffect(() => {
		if (value === null && resolvedDefault !== null) {
			onChange(resolvedDefault);
		}
	}, [resolvedDefault, value, onChange]);

	const groupLabel = question.group.toUpperCase();
	const stepLabel = stepInfo
		? `[${stepInfo.current}/${stepInfo.total}]`
		: "";

	if (question.type === "text") {
		return (
			<Box flexDirection="column" width={maxWidth}>
				<Box>
					<Text color={THEME.primary} bold>
						{"◆ "}
					</Text>
					<Text color={THEME.primary} bold>
						{groupLabel}
					</Text>
					{stepLabel && (
						<Text dimColor>
							{" "}
							{stepLabel}
						</Text>
					)}
				</Box>
				<Box marginY={1}>
					<Text bold wrap="end">{question.prompt}</Text>
				</Box>
				{question.hint && (
					<Box marginBottom={1} borderStyle="single" borderColor={THEME.border} paddingX={1}>
						<Text dimColor wrap="end">{"💡 "}{question.hint}</Text>
					</Box>
				)}
				<Box marginY={1}>
					<Text color={THEME.primary}>{"❯ "}</Text>
					<Text color={THEME.success} bold>
						{value || ""}
					</Text>
					{!value && (
						<Text color={THEME.muted}>{"│"}</Text>
					)}
				</Box>
			</Box>
		);
	}

	if (question.type === "confirm") {
		return (
			<Box flexDirection="column" width={maxWidth}>
				<Box>
					<Text color={THEME.primary} bold>
						{"◆ "}
					</Text>
					<Text color={THEME.primary} bold>
						{groupLabel}
					</Text>
					{stepLabel && (
						<Text dimColor>
							{" "}
							{stepLabel}
						</Text>
					)}
				</Box>
				<Box marginY={1}>
					<Text bold wrap="end">{question.prompt}</Text>
				</Box>
				{question.hint && (
					<Text dimColor wrap="end">{"💡 "}{question.hint}</Text>
				)}
				<Box marginY={1}>
					<Text color={THEME.warning}>{"⚡ Ready to continue? Press Enter..."}</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width={maxWidth}>
			<Box>
				<Text color={THEME.primary} bold>
					{"◆ "}
				</Text>
				<Text color={THEME.primary} bold>
					{groupLabel}
				</Text>
				{stepLabel && (
					<Text dimColor>
						{" "}
						{stepLabel}
					</Text>
				)}
			</Box>
			<Box marginY={1}>
				<Text bold wrap="end">{question.prompt}</Text>
			</Box>
			{question.hint && (
				<Box marginBottom={1} borderStyle="single" borderColor={THEME.border} paddingX={1}>
					<Text dimColor wrap="end">{"💡 "}{question.hint}</Text>
				</Box>
			)}
			<Box marginY={1}>
				{resolvedOptions && (
					<OptionList
						options={resolvedOptions}
						type={question.type === "multi" ? "multi" : "single"}
						value={value as string | string[] | null}
						onChange={onChange}
						onBack={onBack}
						onContinue={onContinue}
						maxWidth={maxWidth}
					/>
				)}
			</Box>
		</Box>
	);
};

export default QuestionCard;
