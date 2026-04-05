/**
 * questionnaire-engine.ts
 *
 * Runtime engine yang:
 * 1. Menentukan pertanyaan mana yang aktif berdasarkan answers saat ini
 * 2. Mengevaluasi kondisi skip, filter opsi dinamis, dan default
 * 3. Menerima jawaban dan menjalankan postHook
 * 4. Menjalankan compatibility check setelah setiap jawaban
 * 5. Menghasilkan StackProfile final yang siap dipakai generator
 *
 * Didesain untuk dipakai di dua konteks:
 *  - Claude Code MCP server (interactive mode via tool calls)
 *  - CLI tool (interactive prompt via inquirer / clack)
 */

import QUESTIONS, {
  type Answers,
  type AnswerValue,
  type Question,
  type Option,
} from './questionnaire-schema.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompatibilityIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  reason: string;
  suggestion: string;
  affectedKeys: string[];
}

export interface QuestionnaireState {
  /** Semua jawaban terkumpul sejauh ini */
  answers: Answers;
  /** Index pertanyaan aktif (question.step) */
  currentStep: number;
  /** Pertanyaan yang sudah dijawab (termasuk yang di-skip) */
  history: Array<{ questionId: string; value: AnswerValue; skipped: boolean }>;
  /** Issues dari compatibility engine */
  compatibilityIssues: CompatibilityIssue[];
  /** True jika sudah mencapai pertanyaan _confirm */
  isComplete: boolean;
}

export interface QuestionPresentation {
  question: Question;
  resolvedOptions: Option[] | null;
  resolvedDefault: AnswerValue | null;
  isSkipped: boolean;
}

// ─── Compatibility Rules (ringkas — detail ada di compatibility-rules.json) ──

interface CompatRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  check: (answers: Answers) => boolean;
  reason: string;
  suggestion: string;
  affectedKeys: string[];
}

const COMPAT_RULES: CompatRule[] = [
  {
    id: 'lang-ts-dart',
    severity: 'error',
    title: 'TypeScript + Dart tidak bisa digabung',
    check: (a) => a.language === 'typescript' && a.frontend_framework === 'flutter',
    reason: 'TypeScript dan Dart adalah ekosistem yang terpisah.',
    suggestion: 'Pilih TypeScript untuk web/RN, atau Dart untuk Flutter.',
    affectedKeys: ['language', 'frontend_framework'],
  },
  {
    id: 'nextjs-laravel',
    severity: 'warning',
    title: 'Next.js + Laravel — dua ekosistem berbeda',
    check: (a) => a.frontend_framework === 'nextjs' && a.backend_framework === 'laravel',
    reason: 'Next.js sudah punya API Routes/Server Actions bawaan. Laravel di sini menambahkan dua server, dua deployment, dua bahasa.',
    suggestion: '1. Next.js saja (recommended)\n2. Laravel + Inertia.js sebagai fullstack\n3. Laravel API + Next.js frontend (valid untuk tim besar)',
    affectedKeys: ['frontend_framework', 'backend_framework'],
  },
  {
    id: 'nextjs-django',
    severity: 'warning',
    title: 'Next.js + Django — overhead setup tinggi',
    check: (a) => a.frontend_framework === 'nextjs' && a.backend_framework === 'django',
    reason: 'JS + Python dalam satu project baru meningkatkan overhead CI/CD dan onboarding.',
    suggestion: 'Untuk AI/ML: FastAPI sebagai microservice terpisah. Untuk MVP: Next.js saja.',
    affectedKeys: ['frontend_framework', 'backend_framework'],
  },
  {
    id: 'firebase-prisma',
    severity: 'error',
    title: 'Firebase Firestore tidak kompatibel dengan Prisma',
    check: (a) => a.database === 'firebase' && a.orm === 'prisma',
    reason: 'Prisma adalah SQL ORM — tidak bisa dipakai dengan Firestore (NoSQL).',
    suggestion: 'Gunakan Firebase SDK langsung, atau ganti ke PostgreSQL untuk tetap pakai Prisma.',
    affectedKeys: ['database', 'orm'],
  },
  {
    id: 'sqlite-production',
    severity: 'warning',
    title: 'SQLite kurang cocok untuk production mode',
    check: (a) => a.database === 'sqlite' && a.mode === 'production',
    reason: 'SQLite tidak support concurrent writes dengan baik untuk multi-user production.',
    suggestion: 'Gunakan PostgreSQL (Supabase, Neon, Railway) untuk production.',
    affectedKeys: ['database', 'mode'],
  },
  {
    id: 'elysia-nodejs',
    severity: 'warning',
    title: 'Elysia dioptimasi untuk Bun, bukan Node.js',
    check: (a) => a.backend_framework === 'elysia' && a.runtime === 'nodejs',
    reason: 'Elysia performa paling baik di Bun runtime.',
    suggestion: 'Ganti runtime ke Bun, atau gunakan Fastify / Hono untuk Node.js.',
    affectedKeys: ['backend_framework', 'runtime'],
  },
  {
    id: 'nextauth-non-nextjs',
    severity: 'error',
    title: 'NextAuth hanya untuk Next.js',
    check: (a) => a.auth_provider === 'nextauth' && a.frontend_framework !== 'nextjs' && !String(a.backend_framework || '').includes('nextjs'),
    reason: 'NextAuth / Auth.js dirancang khusus untuk Next.js.',
    suggestion: 'Gunakan Lucia Auth, Better Auth, atau Clerk untuk framework lain.',
    affectedKeys: ['auth_provider', 'frontend_framework'],
  },
  {
    id: 'trpc-non-typescript',
    severity: 'error',
    title: 'tRPC membutuhkan TypeScript',
    check: (a) => (a.api_style as string[] | undefined)?.includes('trpc') === true && a.language === 'javascript',
    reason: 'tRPC membutuhkan TypeScript untuk end-to-end type safety.',
    suggestion: 'Gunakan REST atau GraphQL, atau switch ke TypeScript.',
    affectedKeys: ['api_style', 'language'],
  },
  {
    id: 'kubernetes-mvp',
    severity: 'warning',
    title: 'Kubernetes terlalu kompleks untuk MVP',
    check: (a) => a.docker === 'kubernetes' && a.mode === 'mvp',
    reason: 'Kubernetes membutuhkan ops expertise yang tinggi.',
    suggestion: 'Untuk MVP: Vercel/Railway/Render. Docker Compose untuk local dev.',
    affectedKeys: ['docker', 'mode'],
  },
  {
    id: 'flutter-nodejs',
    severity: 'error',
    title: 'Dart (Flutter) tidak berjalan di Node.js',
    check: (a) => a.language === 'dart' && (a.runtime === 'nodejs' || a.runtime === 'bun'),
    reason: 'Dart menggunakan Dart VM, bukan Node.js.',
    suggestion: 'Hapus runtime selection — Flutter mengelola runtime-nya sendiri.',
    affectedKeys: ['language', 'runtime'],
  },
  {
    id: 'mongodb-prisma-warning',
    severity: 'info',
    title: 'Prisma dengan MongoDB — fitur terbatas',
    check: (a) => a.database === 'mongodb' && a.orm === 'prisma',
    reason: 'Prisma support MongoDB tapi dalam versi terbatas — beberapa fitur relasi dan migration belum fully supported.',
    suggestion: 'Ini valid tapi ada limitasi. Mongoose lebih mature untuk MongoDB.',
    affectedKeys: ['database', 'orm'],
  },
];

// ─── Engine Class ─────────────────────────────────────────────────────────────

export class QuestionnaireEngine {
  private state: QuestionnaireState;

  constructor(initialAnswers: Answers = {}) {
    this.state = {
      answers: { ...initialAnswers },
      currentStep: 0,
      history: [],
      compatibilityIssues: [],
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
   * Ambil question berikutnya yang perlu dijawab (tidak di-skip).
   * Returns null jika sudah selesai.
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
          this.state.history.push({ questionId: q.id, value: null, skipped: true });
        }
        continue;
      }

      return this._presentQuestion(q);
    }

    this.state.isComplete = true;
    return null;
  }

  /**
   * Ambil semua pertanyaan yang akan aktif berdasarkan answers saat ini.
   * Berguna untuk preview full flow di UI.
   */
  getActiveFlow(): QuestionPresentation[] {
    const sortedQuestions = [...QUESTIONS].sort((a, b) => a.step - b.step);
    return sortedQuestions
      .map(q => this._presentQuestion(q))
      .filter(p => !p.isSkipped);
  }

  /**
   * Resolve satu question menjadi QuestionPresentation
   */
  private _presentQuestion(q: Question): QuestionPresentation {
    const isSkipped = q.skipIf ? q.skipIf(this.state.answers) : false;

    const resolvedOptions = q.options
      ? typeof q.options === 'function'
        ? q.options(this.state.answers)
        : q.options
      : null;

    const resolvedDefault = q.default !== undefined
      ? typeof q.default === 'function'
        ? q.default(this.state.answers)
        : q.default
      : null;

    return { question: q, resolvedOptions, resolvedDefault, isSkipped };
  }

  // ── Answer submission ─────────────────────────────────────────

  /**
   * Submit jawaban untuk question dengan id tertentu.
   * Returns: { ok, errors, warnings, nextQuestion }
   */
  answer(questionId: string, value: AnswerValue): {
    ok: boolean;
    validationError: string | null;
    compatibilityIssues: CompatibilityIssue[];
    nextQuestion: QuestionPresentation | null;
  } {
    const q = QUESTIONS.find(q => q.id === questionId);
    if (!q) throw new Error(`Question "${questionId}" tidak ditemukan.`);

    // Validasi
    const validationError = q.validate ? q.validate(value, this.state.answers) : null;
    if (validationError) {
      return { ok: false, validationError, compatibilityIssues: [], nextQuestion: null };
    }

    // Set answer
    this.state.answers[questionId] = value;
    this.state.history.push({ questionId, value, skipped: false });
    this.state.currentStep = q.step + 1;

    // Run postHook — bisa set derived values ke answers lain
    if (q.postHook) {
      const derived = q.postHook(value, this.state.answers);
      Object.assign(this.state.answers, derived);
    }

    // Re-run compatibility check setelah setiap jawaban
    this.state.compatibilityIssues = this._runCompatibilityCheck();

    // Dapatkan pertanyaan berikutnya
    const nextQuestion = this.getNextQuestion();

    return {
      ok: true,
      validationError: null,
      compatibilityIssues: this.state.compatibilityIssues,
      nextQuestion,
    };
  }

  /**
   * Kembali ke pertanyaan sebelumnya (undo last answer)
   */
  goBack(): QuestionPresentation | null {
    const lastEntry = this.state.history.filter(h => !h.skipped).pop();
    if (!lastEntry) return null;

    // Remove dari history
    this.state.history = this.state.history.filter(
      h => h.questionId !== lastEntry.questionId
    );

    // Remove jawaban
    delete this.state.answers[lastEntry.questionId];

    // Kembali ke step pertanyaan itu
    const q = QUESTIONS.find(q => q.id === lastEntry.questionId);
    if (q) this.state.currentStep = q.step;

    // Re-check compatibility
    this.state.compatibilityIssues = this._runCompatibilityCheck();

    return this._presentQuestion(q!);
  }

  /**
   * Set jawaban langsung (bypass flow — untuk pre-fill atau import)
   */
  setAnswer(questionId: string, value: AnswerValue): void {
    this.state.answers[questionId] = value;
    this.state.compatibilityIssues = this._runCompatibilityCheck();
  }

  /**
   * Reset seluruh state
   */
  reset(): void {
    this.state = {
      answers: {},
      currentStep: 0,
      history: [],
      compatibilityIssues: [],
      isComplete: false,
    };
  }

  // ── Compatibility check ──────────────────────────────────────

  private _runCompatibilityCheck(): CompatibilityIssue[] {
    return COMPAT_RULES
      .filter(rule => rule.check(this.state.answers))
      .map(rule => ({
        id: rule.id,
        severity: rule.severity,
        title: rule.title,
        reason: rule.reason,
        suggestion: rule.suggestion,
        affectedKeys: rule.affectedKeys,
      }));
  }

  getCompatibilityIssues(): CompatibilityIssue[] {
    return this.state.compatibilityIssues;
  }

  hasBlockingErrors(): boolean {
    return this.state.compatibilityIssues.some(i => i.severity === 'error');
  }

  // ── Output generation ─────────────────────────────────────────

  /**
   * Hasilkan StackProfile final yang siap dikirim ke template generator.
   * Hanya dipanggil setelah isComplete === true dan tidak ada blocking errors.
   */
  buildStackProfile(): Record<string, unknown> {
    if (!this.state.isComplete) {
      throw new Error('Questionnaire belum selesai.');
    }
    if (this.hasBlockingErrors()) {
      throw new Error('Ada error kompatibilitas yang belum diselesaikan.');
    }

    const a = this.state.answers;

    return {
      meta: {
        generated_at: new Date().toISOString(),
        schema_version: '1.0.0',
      },
      profile: {
        id: `${a.project_name || 'project'}-${a.mode}`,
        name: a.project_name || 'My App',
        description: a.project_description || '',
        mode: a.mode,
        platform: [a.platform],
        complexity: a.mode === 'mvp' ? 'minimal' : a.mode === 'production' ? 'full' : 'standard',
      },
      stack: {
        workspace: { type: a.workspace || 'single' },
        language: [a.language || 'typescript'],
        runtime: a.runtime || 'nodejs',
        package_manager: a.package_manager || 'pnpm',
        frontend: {
          framework: a.frontend_framework || 'none',
          ui_library: a.ui_library || 'none',
          state_management: a.state_management || 'none',
        },
        backend: {
          framework: a.backend_framework || 'none',
          api_style: a.api_style || ['rest'],
        },
        database: {
          primary: a.database || 'none',
          orm: a.orm || 'none',
          migrations: true,
          seeder: a.mode === 'production',
        },
        auth: {
          provider: a.auth_provider || 'none',
          methods: a.auth_methods || [],
          rbac: a.rbac !== 'no',
        },
        infra: {
          hosting: a.hosting || 'none',
          containerization: a.docker === 'none' ? [] : [a.docker],
          ci_cd: a.ci_cd || 'none',
        },
        tooling: {
          linter: a.linter || 'none',
          testing: {
            unit: (a.testing as string[])?.includes('unit') ? 'vitest' : 'none',
            e2e: (a.testing as string[])?.includes('e2e') ? 'playwright' : 'none',
            component: (a.testing as string[])?.includes('component') ? 'testing-library' : 'none',
          },
          monitoring: a.monitoring || [],
        },
        addons: {
          payment: a.payment_provider || 'none',
          email: a.email_provider || 'none',
          file_storage: a.file_storage || 'none',
          queue: a.queue_provider || 'none',
        },
      },
      // Extend mode specific
      ...(a.mode === 'extend' ? {
        extend: {
          feature: a.extend_feature,
          custom_description: a.extend_custom_description || null,
        },
      } : {}),
      // Context7 fetch config — dipakai agent untuk fetch latest docs
      context7_targets: buildContext7Targets(a),
    };
  }

  /**
   * Ringkasan pilihan user untuk ditampilkan sebelum konfirmasi
   */
  getSummary(): Array<{ group: string; label: string; value: string }> {
    const a = this.state.answers;
    const summary: Array<{ group: string; label: string; value: string }> = [];

    const add = (group: string, label: string, key: string) => {
      const val = a[key];
      if (val !== null && val !== undefined && val !== '' && val !== 'none') {
        const display = Array.isArray(val) ? val.join(', ') : String(val);
        summary.push({ group, label, value: display });
      }
    };

    add('Mode', 'Project mode', 'mode');
    add('Mode', 'Extend feature', 'extend_feature');
    add('Info', 'Nama project', 'project_name');
    add('Platform', 'Target platform', 'platform');
    add('Structure', 'Workspace', 'workspace');
    add('Structure', 'Monorepo apps', 'monorepo_apps');
    add('Language', 'Bahasa', 'language');
    add('Language', 'Runtime', 'runtime');
    add('Language', 'Package manager', 'package_manager');
    add('Frontend', 'Framework', 'frontend_framework');
    add('Frontend', 'UI library', 'ui_library');
    add('Frontend', 'State management', 'state_management');
    add('Backend', 'Framework', 'backend_framework');
    add('Backend', 'API style', 'api_style');
    add('Database', 'Database', 'database');
    add('Database', 'ORM', 'orm');
    add('Auth', 'Provider', 'auth_provider');
    add('Auth', 'Metode login', 'auth_methods');
    add('Auth', 'RBAC', 'rbac');
    add('Add-ons', 'Payment', 'payment_provider');
    add('Add-ons', 'Email', 'email_provider');
    add('Add-ons', 'File storage', 'file_storage');
    add('Add-ons', 'Queue', 'queue_provider');
    add('Add-ons', 'Monitoring', 'monitoring');
    add('Infra', 'Hosting', 'hosting');
    add('Infra', 'Docker', 'docker');
    add('Infra', 'CI/CD', 'ci_cd');
    add('Tooling', 'Linter', 'linter');
    add('Tooling', 'Testing', 'testing');

    return summary;
  }
}

// ─── Context7 target builder ──────────────────────────────────────────────────

/**
 * Berdasarkan stack pilihan user, tentukan library mana yang perlu
 * di-fetch dokumennya dari Context7 sebelum generate template.
 */
function buildContext7Targets(a: Answers): Array<{
  name: string;
  context7_id: string;
  topics: string[];
}> {
  const targets: Array<{ name: string; context7_id: string; topics: string[] }> = [];

  const push = (name: string, id: string, topics: string[]) =>
    targets.push({ name, context7_id: id, topics });

  // Frontend
  const frontendMap: Record<string, [string, string[]]> = {
    nextjs: ['/vercel/next.js', ['app-router', 'server-actions', 'middleware', 'route-handlers']],
    nuxt: ['/nuxt/nuxt', ['pages', 'composables', 'server-routes', 'modules']],
    sveltekit: ['/sveltejs/kit', ['routing', 'load-functions', 'form-actions']],
    remix: ['/remix-run/remix', ['loaders', 'actions', 'routing']],
    vite_react: ['/vitejs/vite', ['plugins', 'config']],
    'react-native-expo': ['/expo/expo', ['router', 'modules', 'build']],
    flutter: ['/flutter/flutter', ['widgets', 'state', 'navigation']],
  };
  const fe = String(a.frontend_framework || '').replace('-', '_');
  if (frontendMap[fe]) push(String(a.frontend_framework), ...frontendMap[fe]);

  // UI
  const uiMap: Record<string, [string, string[]]> = {
    shadcn: ['/shadcn-ui/ui', ['installation', 'components', 'theming']],
    mui: ['/mui/material-ui', ['installation', 'components']],
    tailwind_only: ['/tailwindlabs/tailwindcss', ['configuration', 'utilities']],
  };
  const ui = String(a.ui_library || '').replace('-', '_');
  if (uiMap[ui]) push(String(a.ui_library), ...uiMap[ui]);

  // Backend
  const beMap: Record<string, [string, string[]]> = {
    nestjs: ['/nestjs/nest', ['modules', 'providers', 'guards', 'interceptors']],
    fastify: ['/fastify/fastify', ['plugins', 'hooks', 'schema']],
    hono: ['/honojs/hono', ['routing', 'middleware', 'rpc']],
    elysia: ['/elysiajs/elysia', ['routing', 'middleware', 'validation']],
    fastapi: ['/tiangolo/fastapi', ['routing', 'dependencies', 'security']],
    django: ['/django/django', ['models', 'views', 'urls', 'admin']],
    gin: ['/gin-gonic/gin', ['routing', 'middleware', 'context']],
    axum: ['/tokio-rs/axum', ['routing', 'extractors', 'middleware']],
  };
  const be = String(a.backend_framework || '');
  if (beMap[be]) push(be, ...beMap[be]);

  // ORM
  const ormMap: Record<string, [string, string[]]> = {
    prisma: ['/prisma/prisma', ['schema', 'migration', 'client', 'relations']],
    drizzle: ['/drizzle-team/drizzle-orm', ['schema', 'queries', 'migration']],
    typeorm: ['/typeorm/typeorm', ['entities', 'relations', 'migration']],
    sqlalchemy: ['/sqlalchemy/sqlalchemy', ['orm', 'core', 'alembic-integration']],
  };
  const orm = String(a.orm || '');
  if (ormMap[orm]) push(orm, ...ormMap[orm]);

  // Auth
  const authMap: Record<string, [string, string[]]> = {
    'supabase-auth': ['/supabase/supabase', ['auth', 'server-side-auth', 'ssr', 'middleware']],
    clerk: ['/clerk/javascript', ['nextjs', 'react', 'backend']],
    nextauth: ['/nextauthjs/next-auth', ['configuration', 'providers', 'adapters']],
    'better-auth': ['/better-auth/better-auth', ['installation', 'providers', 'plugins']],
  };
  const auth = String(a.auth_provider || '');
  if (authMap[auth]) push(auth, ...authMap[auth]);

  // Database (untuk Supabase, Neon, dsb — koneksi string + setup)
  const dbSetupMap: Record<string, [string, string[]]> = {
    supabase: ['/supabase/supabase', ['database', 'realtime', 'storage', 'edge-functions']],
    neon: ['/neondatabase/serverless', ['connection', 'pooling']],
    turso: ['/tursodatabase/libsql', ['client', 'sync']],
  };
  const db = String(a.database || '');
  if (dbSetupMap[db]) push(db, ...dbSetupMap[db]);

  // Payment
  if (a.payment_provider === 'stripe') push('stripe', '/stripe/stripe-node', ['checkout', 'webhooks', 'subscriptions']);
  if (a.payment_provider === 'midtrans') push('midtrans', '/veritrans/midtrans-node', ['core-api', 'snap']);

  return targets;
}

// ─── Factory helper ───────────────────────────────────────────────────────────

/**
 * Buat engine baru dari scratch
 */
export function createEngine(initialAnswers?: Answers): QuestionnaireEngine {
  return new QuestionnaireEngine(initialAnswers);
}

/**
 * Buat engine dari preset stack yang sudah dikenal
 * (untuk "quick start" mode — user pilih preset lalu bisa customize)
 */
export function createFromPreset(presetId: string): QuestionnaireEngine {
  const PRESETS: Record<string, Answers> = {
    'nextjs-supabase-mvp': {
      mode: 'mvp',
      platform: 'web',
      workspace: 'single',
      language: 'typescript',
      runtime: 'nodejs',
      package_manager: 'pnpm',
      frontend_framework: 'nextjs',
      ui_library: 'shadcn',
      state_management: 'tanstack-query',
      backend_framework: 'nextjs-api',
      api_style: ['rest'],
      database: 'supabase',
      orm: 'prisma',
      auth_provider: 'supabase-auth',
      auth_methods: ['email-password'],
      hosting: 'vercel',
      docker: 'none',
      ci_cd: 'none',
      linter: 'biome',
      testing: ['unit'],
    },
    'nestjs-postgres-production': {
      mode: 'production',
      platform: 'api-only',
      workspace: 'single',
      language: 'typescript',
      runtime: 'nodejs',
      package_manager: 'pnpm',
      frontend_framework: 'none',
      backend_framework: 'nestjs',
      api_style: ['rest'],
      database: 'postgresql',
      orm: 'prisma',
      auth_provider: 'better-auth',
      auth_methods: ['email-password', 'oauth-google'],
      hosting: 'railway',
      docker: 'compose-prod',
      ci_cd: 'github-actions',
      linter: 'biome',
      testing: ['unit', 'e2e'],
      monitoring: ['sentry'],
    },
    'flutter-supabase-mvp': {
      mode: 'mvp',
      platform: 'mobile-flutter',
      language: 'dart',
      frontend_framework: 'flutter',
      backend_framework: 'supabase-baas',
      database: 'supabase',
      orm: 'none',
      auth_provider: 'supabase-auth',
      auth_methods: ['email-password'],
      hosting: 'none',
    },
    'turborepo-fullstack': {
      mode: 'production',
      platform: 'web',
      workspace: 'turborepo',
      monorepo_apps: ['web', 'api', 'shared-types', 'shared-config'],
      language: 'typescript',
      runtime: 'nodejs',
      package_manager: 'pnpm',
      frontend_framework: 'nextjs',
      ui_library: 'shadcn',
      backend_framework: 'nestjs',
      api_style: ['rest'],
      database: 'postgresql',
      orm: 'prisma',
      auth_provider: 'clerk',
      auth_methods: ['email-password', 'oauth-google'],
      hosting: 'vercel',
      docker: 'compose-prod',
      ci_cd: 'github-actions',
      linter: 'biome',
      testing: ['unit', 'e2e'],
      monitoring: ['sentry', 'posthog'],
    },
  };

  const preset = PRESETS[presetId];
  if (!preset) throw new Error(`Preset "${presetId}" tidak ditemukan.`);

  const engine = new QuestionnaireEngine(preset);
  // Mark semua step sebagai complete agar bisa langsung ke konfirmasi
  engine['state'].currentStep = 999;
  return engine;
}

export default QuestionnaireEngine;
