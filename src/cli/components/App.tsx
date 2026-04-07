import { Box, Text, useApp, useInput, useStdout } from "ink";
import React from "react"; // biome-ignore lint/style/useImportType: required for JSX runtime
import { useCallback, useRef, useState, useEffect } from "react";
import { CompatibilityEngine } from "../../engine/compatibility-engine.js";
import { QuestionnaireEngine } from "../../engine/questionnaire-engine.js";
import type {
	AnswerValue,
	CompatibilityIssue,
	QuestionPresentation,
} from "../../types/index.js";
import type { GenerationContext } from "../types.js";
import { THEME } from "../theme.js";
import ProgressBar from "./ProgressBar.js";
import QuestionCard from "./QuestionCard.js";
import SummaryView from "./SummaryView.js";

interface AppProps {
	initialAnswers?: Record<string, AnswerValue>;
	generationCtx: GenerationContext;
}

// Hook to get terminal dimensions
function useTerminalSize() {
	const { stdout } = useStdout();
	const [size, setSize] = useState({
		columns: stdout?.columns || 80,
		rows: stdout?.rows || 24,
	});

	useEffect(() => {
		const handleResize = () => {
			setSize({
				columns: stdout?.columns || 80,
				rows: stdout?.rows || 24,
			});
		};

		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	return size;
}

export const App: React.FC<AppProps> = ({ initialAnswers = {}, generationCtx }) => {
	const { exit } = useApp();
	const { columns } = useTerminalSize();
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

	const [activeFlow, setActiveFlow] = useState(() => engine.getActiveFlow());
	
	const updateActiveFlow = useCallback(() => {
		setActiveFlow(engine.getActiveFlow());
	}, [engine]);
	
	const currentIndex = activeFlow.findIndex(
		(q) => q.question.id === currentQuestion?.question.id,
	);
	const isFirstQuestion = currentIndex === 0;

	// Calculate responsive widths
	const maxWidth = Math.min(columns - 4, 100);
	const contentWidth = Math.min(columns - 2, 100);

	const handleAnswer = useCallback(() => {
		if (!currentQuestion) return;

		const result = engine.answer(currentQuestion.question.id, currentValue);

		if (!result.ok) {
			return;
		}

		const newIssues = compatEngine.check(engine.getAnswers());
		setIssues(newIssues);
		updateActiveFlow();

		if (result.nextQuestion) {
			setCurrentQuestion(result.nextQuestion);
			const newValue = result.nextQuestion.resolvedDefault;
			currentValueRef.current = newValue;
			setCurrentValue(newValue);
			setSelectionError(null);
		} else {
			setShowSummary(true);
		}
	}, [currentQuestion, currentValue, engine, compatEngine, updateActiveFlow]);

	const handleBack = useCallback(() => {
		const previous = engine.goBack();
		if (previous) {
			setCurrentQuestion(previous);
			const newValue = engine.getAnswers()[previous.question.id] ?? previous.resolvedDefault;
			currentValueRef.current = newValue;
			setCurrentValue(newValue);
			setIssues(compatEngine.check(engine.getAnswers()));
			setSelectionError(null);
			updateActiveFlow();
		}
	}, [engine, compatEngine, updateActiveFlow]);

	const handleConfirm = useCallback(() => {
		if (compatEngine.hasBlockingErrors(engine.getAnswers())) {
			return;
		}
		// Populate the generation context so createCommand can use it after exit
		generationCtx.answers = { ...engine.getAnswers() };
		generationCtx.projectName = (engine.getAnswers().project_name as string) || "my-app";
		generationCtx.isConfirmed = true;
		setIsComplete(true);
		exit();
	}, [engine, compatEngine, exit, generationCtx]);

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
			if (currentValue === null || currentValue === currentQuestion?.resolvedDefault) {
				setSelectionError("Please select an option using Spacebar before continuing");
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
			setSelectionError(null);
		}
	});

	if (isComplete) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" paddingY={2}>
				<Box
					borderStyle="round"
					borderColor="green"
					padding={1}
					width={Math.min(60, maxWidth)}
					flexDirection="column"
					alignItems="center"
				>
					<Text color="green" bold>
						{"✔ Configuration Complete!"}
					</Text>
					<Box marginTop={1}>
						<Text dimColor>{"Generating project files..."}</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	if (showExitConfirm) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" height={12}>
				<Box
					borderStyle="round"
					borderColor={THEME.warning}
					padding={1}
					width={Math.min(50, maxWidth)}
					flexDirection="column"
					alignItems="center"
				>
					<Text color={THEME.warning} bold>
						{"⚠ Exit Confirmation"}
					</Text>
					<Box marginY={1} flexDirection="column" alignItems="center">
						<Text>{"Are you sure you want to exit?"}</Text>
						<Text dimColor>{"All progress will be lost."}</Text>
					</Box>
					<Box marginTop={1}>
						<Text>
							<Text bold color={THEME.success}>{"Y"}</Text>{" - Yes, exit  "}
							<Text bold color={THEME.error}>{"N"}</Text>{" - No, continue"}
						</Text>
					</Box>
				</Box>
			</Box>
		);
	}

	if (showSummary) {
		return (
			<Box width={contentWidth}>
				<SummaryView
					summary={engine.getSummary()}
					issues={issues}
					onConfirm={handleConfirm}
					onEdit={handleEdit}
				/>
			</Box>
		);
	}

	if (!currentQuestion) {
		return (
			<Box flexDirection="column" alignItems="center" justifyContent="center" height={10}>
				<Text>No questions available.</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width={contentWidth}>
			{/* Header */}
			<Box marginBottom={1} flexDirection="column">
				<Text color={THEME.primary} bold>
					{"◈ Loforger"}
				</Text>
				<Text dimColor>{"Project Scaffolding Tool"}</Text>
			</Box>

			{/* Progress */}
			<ProgressBar
				current={currentIndex + 1}
				total={activeFlow.length}
				group={currentQuestion.question.group}
				width={maxWidth}
			/>

			{/* Selection Error */}
			{selectionError && (
				<Box marginY={1}>
					<Text color={THEME.error} bold>
						{"✗ "}{selectionError}
					</Text>
				</Box>
			)}

			{/* Compatibility Issues */}
			{issues.length > 0 && (
				<Box marginY={1} flexDirection="column">
					{issues.map((issue) => (
						<Box key={issue.id}>
							<Text
								color={issue.severity === "error" ? THEME.error : THEME.warning}
							>
								{issue.severity === "error" ? "✗" : "⚠"}{" "}{issue.title}
							</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Question Card */}
			<Box marginY={1} borderStyle="single" padding={1} width={maxWidth}>
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
					maxWidth={maxWidth - 4}
					stepInfo={{ current: currentIndex + 1, total: activeFlow.length }}
				/>
			</Box>

			{/* Help Text */}
			<Box marginTop={1}>
				<Text dimColor wrap="end">
					{currentQuestion.question.type === "text" ? (
						<>
							{"Type answer, "}<Text bold color={THEME.success}>{"Enter"}</Text>{" to continue, "}
							<Text bold color={THEME.warning}>{"Esc"}</Text>{" to exit"}
						</>
					) : (
						<>
							<Text bold color={THEME.accent}>{"Space"}</Text>{" select, "}
							<Text bold color={THEME.success}>{"Enter"}</Text>{" continue, "}
							<Text bold color={THEME.warning}>{"Esc"}</Text>{" back"}
						</>
					)}
				</Text>
			</Box>
		</Box>
	);
};

export default App;
