import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionnaireEngine, createEngine } from '../../src/engine/questionnaire-engine.js';

describe('QuestionnaireEngine', () => {
  let engine: QuestionnaireEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  describe('getNextQuestion', () => {
    it('should return first question initially', () => {
      const question = engine.getNextQuestion();
      expect(question).not.toBeNull();
      expect(question?.question.id).toBe('mode');
    });

    it('should return null when all questions answered', () => {
      // Answer all questions
      engine.answer('mode', 'mvp');
      engine.answer('project_name', 'my-app');
      engine.answer('platform', 'web');
      engine.answer('workspace', 'single');
      engine.answer('language', 'typescript');
      engine.answer('frontend_framework', 'nextjs');
      engine.answer('backend_framework', 'nextjs-api');
      engine.answer('database', 'postgresql');
      engine.answer('auth_provider', 'nextauth');
      engine.answer('_confirm', true);
      
      const question = engine.getNextQuestion();
      expect(question).toBeNull();
      expect(engine.getState().isComplete).toBe(true);
    });
  });

  describe('answer', () => {
    it('should store answer and advance', () => {
      const result = engine.answer('mode', 'mvp');
      expect(result.ok).toBe(true);
      expect(engine.getAnswers().mode).toBe('mvp');
    });

    it('should validate project name format', () => {
      engine.answer('mode', 'mvp');
      const result = engine.answer('project_name', 'My App');
      expect(result.ok).toBe(false);
      expect(result.validationError).toContain('lowercase');
    });

    it('should skip project_name in extend mode', () => {
      engine.answer('mode', 'extend');
      const nextQuestion = engine.getNextQuestion();
      expect(nextQuestion?.question.id).not.toBe('project_name');
    });

    it('should auto-set backend for Next.js via postHook', () => {
      engine.setAnswer('mode', 'mvp');
      engine.setAnswer('platform', 'web');
      engine.setAnswer('language', 'typescript');
      engine.answer('frontend_framework', 'nextjs');
      expect(engine.getAnswers().backend_framework).toBe('nextjs-api');
    });
  });

  describe('goBack', () => {
    it('should return to previous question', () => {
      engine.answer('mode', 'mvp');
      engine.answer('project_name', 'my-app');
      
      const previous = engine.goBack();
      expect(previous?.question.id).toBe('project_name');
      expect(engine.getAnswers().project_name).toBeUndefined();
    });
  });

  describe('getSummary', () => {
    it('should generate summary', () => {
      engine.answer('mode', 'mvp');
      engine.answer('project_name', 'my-app');
      
      const summary = engine.getSummary();
      expect(summary.some(s => s.label === 'Project mode' && s.value === 'mvp')).toBe(true);
    });
  });
});
