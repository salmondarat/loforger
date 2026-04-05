import { Box, Text, useApp, useInput } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { useCallback, useRef, useState } from "react";
import { CompatibilityEngine } from "../../engine/compatibility-engine.js";
import { QuestionnaireEngine } from "../../engine/questionnaire-engine.js";
import type {
	AnswerValue,
	CompatibilityIssue,
	QuestionPresentation,
} from "../../types/index.js";
import ProgressBar from "./ProgressBar.js";
import QuestionCard from "./QuestionCard.js";
import SummaryView from "./SummaryView.js";

interface AppProps {
	initialAnswers?: Record<string, AnswerValue>;
}

export const App: React.FC<AppProps> = ({ initialAnswers = {} }) => {
	const { exit } = useApp();
	const [engine] = useState(() => new QuestionnaireEngine(initialAnswers));
	const [compatEngine] = useState(() => new CompatibilityEngine());
	const [currentQuestion, setCurrentQuestion] =
		useState<QuestionPresentation | null>(() => engine.getNextQuestion());
	const [currentValue, setCurrentValue] = useState<AnswerValue>(null);
	const currentValueRef = useRef<AnswerValue>(null);
	const [issues, setIssues] = useState<CompatibilityIssue[]>([]);
	const [showSummary, setShowSummary] = useState(false);
	const [isComplete, setIsComplete] = useState(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);
	const [selectionError, setSelectionError] = useState<string | null>(null);

	const activeFlow = engine.getActiveFlow();
	const currentIndex = activeFlow.findIndex(
		(q) => q.question.id === currentQuestion?.question.id,
	);
	const isFirstQuestion = currentIndex === 0;

	const handleAnswer = useCallback(() => {
		if (!currentQuestion) return;

		const result = engine.answer(currentQuestion.question.id, currentValue);

		if (!result.ok) {
			return;
		}

		const newIssues = compatEngine.check(engine.getAnswers());
		setIssues(newIssues);

		if (result.nextQuestion) {
			setCurrentQuestion(result.nextQuestion);
			const newValue = result.nextQuestion.resolvedDefault;
			currentValueRef.current = newValue;
			setCurrentValue(newValue);
			setSelectionError(null);
		} else {
			setShowSummary(true);
		}
	}, [currentQuestion, currentValue, engine, compatEngine]);

	const handleBack = useCallback(() => {
		const previous = engine.goBack();
		if (previous) {
			setCurrentQuestion(previous);
			const newValue = engine.getAnswers()[previous.question.id] ?? previous.resolvedDefault;
			currentValueRef.current = newValue;
			setCurrentValue(newValue);
			setIssues(compatEngine.check(engine.getAnswers()));
			setSelectionError(null);
		}
	}, [engine, compatEngine]);

	const handleConfirm = useCallback(() => {
		if (compatEngine.hasBlockingErrors(engine.getAnswers())) {
			return;
		}
		setIsComplete(true);
		exit();
	}, [engine, compatEngine, exit]);

	const handleEdit = useCallback(() => {
		setShowSummary(false);
		engine.reset();
		setCurrentQuestion(engine.getNextQuestion());
		setCurrentValue(null);
		setIssues([]);
		setSelectionError(null);
	}, [engine]);

	const handleExitConfirm = useCallback((confirm: boolean) => {
		if (confirm) {
			exit();
		} else {
			setShowExitConfirm(false);
		}
	}, [exit]);

	useInput((input, key) => {
		if (showExitConfirm) {
			if (input === "y" || input === "Y") {
				handleExitConfirm(true);
			} else if (input === "n" || input === "N" || key.escape) {
				handleExitConfirm(false);
			}
			return;
		}

		if (showSummary) {
			if (key.return) {
				handleConfirm();
			} else if (input === "e") {
				handleEdit();
			}
			return;
		}

		// Handle text input
		if (currentQuestion?.question.type === "text") {
			if (key.return && currentValueRef.current) {
				const value = currentValueRef.current;
				const result = engine.answer(currentQuestion.question.id, value);
				if (result.ok) {
					const newIssues = compatEngine.check(engine.getAnswers());
					setIssues(newIssues);
					if (result.nextQuestion) {
						setCurrentQuestion(result.nextQuestion);
						const newValue = result.nextQuestion.resolvedDefault;
						currentValueRef.current = newValue;
						setCurrentValue(newValue);
					} else {
						setShowSummary(true);
					}
				}
			} else if (key.escape) {
				if (isFirstQuestion) {
					setShowExitConfirm(true);
				} else {
					handleBack();
				}
			} else if (key.backspace || key.delete) {
				const newValue = String(currentValueRef.current ?? "").slice(0, -1);
				currentValueRef.current = newValue || null;
				setCurrentValue(newValue || null);
			} else if (input && !key.ctrl && !key.meta && input.length === 1) {
				const newValue = String(currentValueRef.current ?? "") + input;
				currentValueRef.current = newValue;
				setCurrentValue(newValue);
			}
			return;
		}

		// Handle choice input
		if (key.return) {
			// Check if an option is actually selected (not just the default)
			if (currentValue === null || currentValue === currentQuestion?.resolvedDefault) {
				setSelectionError("⚠ Please select an option using Spacebar before continuing");
				return;
			}
			handleAnswer();
		} else if (key.escape) {
			if (isFirstQuestion) {
				setShowExitConfirm(true);
			} else {
				handleBack();
			}
		} else if (input === " ") {
			// Spacebar was pressed, clear any error
			setSelectionError(null);
		}
	});

	if (isComplete) {
		return (
			<Box flexDirection="column" padding={2}>
				<Box borderStyle="round" borderColor="green" padding={1}>
					<Text color="green" bold>
						✓ Project configuration complete!
					</Text>
					<Text dimColor>Your project template is ready to generate.</Text>
				</Box>
			</Box>
		);
	}

	if (showExitConfirm) {
		return (
			<Box flexDirection="column" padding={2} alignItems="center">
				<Box borderStyle="round" borderColor="yellow" padding={2}>
					<Text color="yellow" bold>
						⚠ Exit Confirmation
					</Text>
					<Text>Are you sure you want to exit?</Text>
					<Text dimColor>All progress will be lost.</Text>
					<Box marginTop={1}>
						<Text>
							Press <Text bold color="red">Y</Text> to exit or{" "}
							<Text bold color="green">N</Text> to continue
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	if (showSummary) {
		return (
			<SummaryView
				summary={engine.getSummary()}
				issues={issues}
				onConfirm={handleConfirm}
				onEdit={handleEdit}
			/>
		);
	}

	if (!currentQuestion) {
		return <Text>No questions available.</Text>;
	}

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text color="cyan" bold>
					◈ Loforger
				</Text>
				<Text dimColor> - Project Scaffolding Tool</Text>
			</Box>

			{/* Progress */}
			<ProgressBar
				current={currentIndex + 1}
				total={activeFlow.length}
				label={`Step ${currentIndex + 1} of ${activeFlow.length}`}
			/>

			{/* Selection Error */}
			{selectionError && (
				<Box marginY={1} paddingX={1} paddingY={0}>
					<Text color="red" bold>
						{selectionError}
					</Text>
				</Box>
			)}

			{/* Compatibility Issues */}
			{issues.length > 0 && (
				<Box marginY={1} flexDirection="column">
					{issues.map((issue) => (
						<Box key={issue.id} marginY={0}>
							<Text
								color={issue.severity === "error" ? "red" : "yellow"}
							>
								{issue.severity === "error" ? "✗" : "⚠"} {issue.title}
							</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Question Card */}
			<Box marginY={1} borderStyle="single" padding={1}>
				<QuestionCard
					presentation={currentQuestion}
					value={currentValue ?? currentQuestion.resolvedDefault}
					onChange={(value) => {
						currentValueRef.current = value;
						setCurrentValue(value);
						setSelectionError(null);
					}}
					onBack={handleBack}
					onContinue={handleAnswer}
				/>
			</Box>

			{/* Help Text */}
			<Box marginTop={1}>
				<Text dimColor>
					{currentQuestion.question.type === "text" ? (
						<>
							Type your answer, then press <Text bold color="green">Enter</Text>{" "}
							to continue, <Text bold color="yellow">Esc</Text> to exit
						</>
					) : (
						<>
							Press <Text bold color="blue">Space</Text> to select,{" "}
							<Text bold color="green">Enter</Text> to continue,{" "}
							<Text bold color="yellow">Esc</Text> to go back
						</>
					)}
				</Text>
			</Box>
		</Box>
	);
};

export default App;
