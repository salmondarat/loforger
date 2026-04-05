import type { Answers } from './questionnaire.js';

export type SeverityLevel = 'error' | 'warning' | 'info';

export interface CompatibilityRule {
  id: string;
  severity: SeverityLevel;
  title: string;
  check: (answers: Answers) => boolean;
  reason: string;
  suggestion: string;
  affectedKeys: string[];
}

export interface CompatibilityIssue {
  id: string;
  severity: SeverityLevel;
  title: string;
  reason: string;
  suggestion: string;
  affectedKeys: string[];
}
