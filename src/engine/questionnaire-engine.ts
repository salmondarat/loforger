import QUESTIONS from "../data/questions.js";
import type {
	AnswerValue,
	Answers,
	Option,
	Question,
	QuestionPresentation,
	QuestionnaireState,
} from "../types/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompatibilityIssue {
	id: string;
	severity: "error" | "warning" | "info";
	title: string;
	reason: string;
	suggestion: string;
	affectedKeys: string[];
}

// ─── Engine Class ─────────────────────────────────────────────────────────────

export class QuestionnaireEngine {
	private state: QuestionnaireState;

	constructor(initialAnswers: Answers = {}) {
		this.state = {
			answers: { ...initialAnswers },
			currentStep: 0,
			history: [],
			isComplete: false,
		};
	}

	// ── State access ─────────────────────────────────────────────

	getState(): Readonly<QuestionnaireState> {
		return this.state;
	}

	getAnswers(): Readonly<Answers> {
		return this.state.answers;
	}

	// ── Question resolution ──────────────────────────────────────

	/**
	 * Get the next question that needs to be answered (not skipped).
	 * Returns null if finished.
	 */
	getNextQuestion(): QuestionPresentation | null {
		const sortedQuestions = [...QUESTIONS].sort((a, b) => a.step - b.step);

		for (const q of sortedQuestions) {
			if (q.step < this.state.currentStep) continue;

			const isSkipped = q.skipIf ? q.skipIf(this.state.answers) : false;

			if (isSkipped) {
				// Auto-advance past skipped questions
				if (q.step >= this.state.currentStep) {
					this.state.currentStep = q.step + 1;
					this.state.history.push({
						questionId: q.id,
						value: null,
						skipped: true,
					});
				}
				continue;
			}

			return this._presentQuestion(q);
		}

		this.state.isComplete = true;
		return null;
	}

	/**
	 * Get all questions that will be active based on current answers.
	 * Useful for previewing full flow in UI.
	 */
	getActiveFlow(): QuestionPresentation[] {
		const sortedQuestions = [...QUESTIONS].sort((a, b) => a.step - b.step);
		return sortedQuestions
			.map((q) => this._presentQuestion(q))
			.filter((p) => !p.isSkipped);
	}

	/**
	 * Resolve a single question into QuestionPresentation
	 */
	private _presentQuestion(q: Question): QuestionPresentation {
		const isSkipped = q.skipIf ? q.skipIf(this.state.answers) : false;

		const resolvedOptions = q.options
			? typeof q.options === "function"
				? q.options(this.state.answers)
				: q.options
			: null;

		const resolvedDefault =
			q.default !== undefined
				? typeof q.default === "function"
					? q.default(this.state.answers)
					: q.default
				: null;

		return { question: q, resolvedOptions, resolvedDefault, isSkipped };
	}

	// ── Answer submission ─────────────────────────────────────────

	/**
	 * Submit answer for question with given id.
	 * Returns: { ok, validationError, nextQuestion }
	 */
	answer(
		questionId: string,
		value: AnswerValue,
	): {
		ok: boolean;
		validationError: string | null;
		nextQuestion: QuestionPresentation | null;
	} {
		const q = QUESTIONS.find((q) => q.id === questionId);
		if (!q) throw new Error(`Question "${questionId}" not found.`);

		// Validation
		const validationError = q.validate
			? q.validate(value, this.state.answers)
			: null;
		if (validationError) {
			return { ok: false, validationError, nextQuestion: null };
		}

		// Set answer
		this.state.answers[questionId] = value;
		this.state.history.push({ questionId, value, skipped: false });
		this.state.currentStep = q.step + 1;

		// Run postHook — can set derived values to other answers
		if (q.postHook) {
			const derived = q.postHook(value, this.state.answers);
			Object.assign(this.state.answers, derived);
		}

		// Check if this is the confirmation question
		if (questionId === "_confirm") {
			this.state.isComplete = true;
			return { ok: true, validationError: null, nextQuestion: null };
		}

		// Get next question
		const nextQuestion = this.getNextQuestion();

		return {
			ok: true,
			validationError: null,
			nextQuestion,
		};
	}

	/**
	 * Go back to previous question (undo last answer)
	 */
	goBack(): QuestionPresentation | null {
		const lastEntry = this.state.history.filter((h) => !h.skipped).pop();
		if (!lastEntry) return null;

		// Remove from history
		this.state.history = this.state.history.filter(
			(h) => h.questionId !== lastEntry.questionId,
		);

		// Remove answer
		delete this.state.answers[lastEntry.questionId];

		// Go back to that question's step
		const q = QUESTIONS.find((q) => q.id === lastEntry.questionId);
		if (!q) return null;

		this.state.currentStep = q.step;

		// Reset completion status
		this.state.isComplete = false;

		return this._presentQuestion(q);
	}

	/**
	 * Set answer directly (bypass flow — for pre-fill or import)
	 */
	setAnswer(questionId: string, value: AnswerValue): void {
		this.state.answers[questionId] = value;
	}

	/**
	 * Reset entire state
	 */
	reset(): void {
		this.state = {
			answers: {},
			currentStep: 0,
			history: [],
			isComplete: false,
		};
	}

	// ── Output generation ─────────────────────────────────────────

	/**
	 * Generate final StackProfile ready for template generator.
	 * Only call after isComplete === true.
	 */
	buildStackProfile(): Record<string, unknown> {
		if (!this.state.isComplete) {
			throw new Error("Questionnaire is not complete yet.");
		}

		const a = this.state.answers;

		return {
			meta: {
				generated_at: new Date().toISOString(),
				schema_version: "1.0.0",
			},
			profile: {
				id: `${a.project_name || "project"}-${a.mode}`,
				name: a.project_name || "My App",
				mode: a.mode,
				platform: a.platform,
				complexity:
					a.mode === "mvp"
						? "minimal"
						: a.mode === "production"
							? "full"
							: "standard",
			},
			stack: {
				workspace: { type: a.workspace || "single" },
				language: a.language || "typescript",
				frontend: {
					framework: a.frontend_framework || "none",
				},
				backend: {
					framework: a.backend_framework || "none",
				},
				database: {
					primary: a.database || "none",
				},
				auth: {
					provider: a.auth_provider || "none",
				},
			},
		};
	}

	/**
	 * Summary of user choices for display before confirmation
	 */
	getSummary(): Array<{ group: string; label: string; value: string }> {
		const a = this.state.answers;
		const summary: Array<{ group: string; label: string; value: string }> = [];

		const add = (group: string, label: string, key: string) => {
			const val = a[key];
			if (val !== null && val !== undefined && val !== "" && val !== "none") {
				const display = Array.isArray(val) ? val.join(", ") : String(val);
				summary.push({ group, label, value: display });
			}
		};

		add("Mode", "Project mode", "mode");
		add("Info", "Project name", "project_name");
		add("Platform", "Target platform", "platform");
		add("Structure", "Workspace", "workspace");
		add("Language", "Language", "language");
		add("Frontend", "Framework", "frontend_framework");
		add("Backend", "Framework", "backend_framework");
		add("Database", "Database", "database");
		add("Auth", "Provider", "auth_provider");

		return summary;
	}
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Create new engine from scratch
 */
export function createEngine(initialAnswers?: Answers): QuestionnaireEngine {
	return new QuestionnaireEngine(initialAnswers);
}

export default QuestionnaireEngine;
