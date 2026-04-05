import { Box, Text } from "ink";
import React from "react";
import { useEffect } from "react";
import type { AnswerValue, QuestionPresentation } from "../../types/index.js";
import OptionList from "./OptionList.js";

interface QuestionCardProps {
	presentation: QuestionPresentation;
	value: AnswerValue;
	onChange: (value: AnswerValue) => void;
	onBack?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
	presentation,
	value,
	onChange,
	onBack,
}) => {
	const { question, resolvedOptions, resolvedDefault } = presentation;

	useEffect(() => {
		if (value === null && resolvedDefault !== null) {
			onChange(resolvedDefault);
		}
	}, [resolvedDefault, value, onChange]);

	if (question.type === "text") {
		return (
			<Box flexDirection="column">
				<Text bold>{question.prompt}</Text>
				{question.hint && <Text dimColor>{question.hint}</Text>}
				<Text>Text input: {value || "(empty)"}</Text>
			</Box>
		);
	}

	if (question.type === "confirm") {
		return (
			<Box flexDirection="column">
				<Text bold>{question.prompt}</Text>
				{question.hint && <Text dimColor>{question.hint}</Text>}
				<Text>Press Enter to confirm...</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text color="cyan" bold>
				{question.group.toUpperCase()}
			</Text>
			<Text bold>{question.prompt}</Text>
			{question.hint && <Text dimColor>{question.hint}</Text>}
			<Box marginY={1}>
				{resolvedOptions && (
					<OptionList
						options={resolvedOptions}
						type={question.type === "multi" ? "multi" : "single"}
						value={value as string | string[] | null}
						onChange={onChange}
						onBack={onBack}
					/>
				)}
			</Box>
		</Box>
	);
};

export default QuestionCard;
