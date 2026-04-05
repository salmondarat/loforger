import { Box, Text } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { useEffect } from "react";
import type { AnswerValue, QuestionPresentation } from "../../types/index.js";
import OptionList from "./OptionList.js";

interface QuestionCardProps {
	presentation: QuestionPresentation;
	value: AnswerValue;
	onChange: (value: AnswerValue) => void;
	onBack?: () => void;
	onContinue?: () => void;
	maxWidth?: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
	presentation,
	value,
	onChange,
	onBack,
	onContinue,
	maxWidth = 80,
}) => {
	const { question, resolvedOptions, resolvedDefault } = presentation;

	useEffect(() => {
		if (value === null && resolvedDefault !== null) {
			onChange(resolvedDefault);
		}
	}, [resolvedDefault, value, onChange]);

	if (question.type === "text") {
		return (
			<Box flexDirection="column" width={maxWidth}>
				<Text color="cyan" bold>
					◆ {question.group.toUpperCase()}
				</Text>
				<Box marginY={1}>
					<Text bold wrap="end">{question.prompt}</Text>
				</Box>
				{question.hint && (
					<Box marginBottom={1}>
						<Text dimColor wrap="end">💡 {question.hint}</Text>
					</Box>
				)}
				<Box marginY={1}>
					<Text color="cyan">{"❯ "}</Text>
					<Text color="green" bold>
						{value || ""}
					</Text>
					{!value && (
						<Text color="gray">_</Text>
					)}
				</Box>
			</Box>
		);
	}

	if (question.type === "confirm") {
		return (
			<Box flexDirection="column" width={maxWidth}>
				<Text color="cyan" bold>
					◆ {question.group.toUpperCase()}
				</Text>
				<Box marginY={1}>
					<Text bold wrap="end">{question.prompt}</Text>
				</Box>
				{question.hint && <Text dimColor wrap="end">💡 {question.hint}</Text>}
				<Box marginY={1}>
					<Text color="yellow">⚡ Ready to continue? Press Enter...</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width={maxWidth}>
			<Text color="cyan" bold>
				◆ {question.group.toUpperCase()}
			</Text>
			<Box marginY={1}>
				<Text bold wrap="end">{question.prompt}</Text>
			</Box>
			{question.hint && (
				<Box marginBottom={1}>
					<Text dimColor wrap="end">💡 {question.hint}</Text>
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
