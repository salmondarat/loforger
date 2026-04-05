export type AnswerValue = string | string[] | boolean | null;

export interface Answers {
  [questionId: string]: AnswerValue;
}

export type OptionBadge = 'recommended' | 'popular' | 'experimental' | 'legacy' | 'new';

export interface Option {
  value: string;
  label: string;
  description?: string;
  badge?: OptionBadge;
  isCustom?: boolean;
}

export type OptionsResolver = Option[] | ((answers: Answers) => Option[]);

export interface Question {
  id: string;
  group: string;
  step: number;
  type: 'single' | 'multi' | 'text' | 'confirm';
  prompt: string;
  hint?: string;
  options?: OptionsResolver;
  default?: AnswerValue | ((answers: Answers) => AnswerValue);
  skipIf?: (answers: Answers) => boolean;
  validate?: (value: AnswerValue, answers: Answers) => string | null;
  postHook?: (value: AnswerValue, answers: Answers) => Partial<Answers>;
  required?: boolean;
}

export interface QuestionnaireState {
  answers: Answers;
  currentStep: number;
  history: Array<{ questionId: string; value: AnswerValue; skipped: boolean }>;
  isComplete: boolean;
}

export interface QuestionPresentation {
  question: Question;
  resolvedOptions: Option[] | null;
  resolvedDefault: AnswerValue | null;
  isSkipped: boolean;
}
