import type { AnswerValue } from "../types/index.js";

export interface GenerationContext {
	answers: Record<string, AnswerValue>;
	projectName: string;
	isConfirmed: boolean;
}
