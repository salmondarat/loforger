import { describe, it, expect } from 'vitest';
import { QuestionnaireEngine } from '../../src/engine/questionnaire-engine.js';
import { CompatibilityEngine } from '../../src/engine/compatibility-engine.js';

describe('CLI Integration', () => {
  it('should complete full questionnaire flow', () => {
    const engine = new QuestionnaireEngine();
    const compat = new CompatibilityEngine();

    engine.answer('mode', 'mvp');
    engine.answer('project_name', 'my-test-app');
    engine.answer('platform', 'web');
    engine.answer('workspace', 'single');
    engine.answer('language', 'typescript');
    engine.answer('frontend_framework', 'nextjs');
    engine.answer('backend_framework', 'nextjs-api');
    engine.answer('database', 'postgresql');
    engine.answer('auth_provider', 'nextauth');
    engine.answer('_confirm', true);

    expect(engine.getState().isComplete).toBe(true);
    
    const issues = compat.check(engine.getAnswers());
    expect(issues.filter(i => i.severity === 'error')).toHaveLength(0);
  });

  it('should detect incompatible combinations', () => {
    const engine = new QuestionnaireEngine();
    const compat = new CompatibilityEngine();

    engine.setAnswer('mode', 'production');
    engine.setAnswer('database', 'sqlite');

    const issues = compat.check(engine.getAnswers());
    expect(issues.some(i => i.id === 'sqlite-production')).toBe(true);
  });
});
