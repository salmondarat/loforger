import { describe, it, expect, beforeEach } from 'vitest';
import { CompatibilityEngine, createCompatibilityEngine } from '../../src/engine/compatibility-engine.js';
import type { Answers } from '../../src/types/index.js';

describe('CompatibilityEngine', () => {
  let engine: CompatibilityEngine;

  beforeEach(() => {
    engine = createCompatibilityEngine();
  });

  it('should return empty for valid combinations', () => {
    const answers: Answers = {
      frontend_framework: 'nextjs',
      backend_framework: 'nextjs-api',
    };
    expect(engine.check(answers)).toHaveLength(0);
  });

  it('should detect NextAuth without Next.js', () => {
    const answers: Answers = {
      frontend_framework: 'vite-react',
      auth_provider: 'nextauth',
    };
    const issues = engine.check(answers);
    expect(issues.some(i => i.id === 'nextauth-non-nextjs')).toBe(true);
    expect(engine.hasBlockingErrors(answers)).toBe(true);
  });

  it('should detect SQLite in production', () => {
    const answers: Answers = {
      mode: 'production',
      database: 'sqlite',
    };
    const issues = engine.check(answers);
    expect(issues.some(i => i.id === 'sqlite-production')).toBe(true);
    expect(engine.hasBlockingErrors(answers)).toBe(false);
  });
});
