import type { Answers, CompatibilityIssue } from '../types/index.js';
import { COMPATIBILITY_RULES } from '../data/compatibility-rules.js';

export class CompatibilityEngine {
  private rules = COMPATIBILITY_RULES;

  check(answers: Answers): CompatibilityIssue[] {
    return this.rules
      .filter(rule => rule.check(answers))
      .map(rule => ({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        reason: rule.reason,
        suggestion: rule.suggestion,
        affectedKeys: rule.affectedKeys,
      }));
  }

  hasBlockingErrors(answers: Answers): boolean {
    return this.check(answers).some(issue => issue.severity === 'error');
  }

  getWarnings(answers: Answers): CompatibilityIssue[] {
    return this.check(answers).filter(issue => issue.severity === 'warning');
  }

  getErrors(answers: Answers): CompatibilityIssue[] {
    return this.check(answers).filter(issue => issue.severity === 'error');
  }
}

export function createCompatibilityEngine(): CompatibilityEngine {
  return new CompatibilityEngine();
}

export default CompatibilityEngine;
