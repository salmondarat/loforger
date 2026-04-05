/**
 * questionnaire-schema.ts
 *
 * Mendefinisikan SEMUA pertanyaan, opsi, kondisi visibility,
 * skip logic, dan default values untuk Loforger questionnaire.
 *
 * Setiap Question punya:
 *  - id         : key yang disimpan ke StackProfile
 *  - type       : single | multi | text | confirm
 *  - condition  : ekspresi yang dievaluasi dari answers yang sudah terkumpul
 *  - options    : daftar pilihan (bisa berupa fungsi yang menerima answers untuk filter dinamis)
 *  - default    : nilai default jika user skip / enter
 *  - skipIf     : shorthand condition untuk melewati question sepenuhnya
 *  - postHook   : callback setelah jawaban diberikan (untuk auto-set derived values)
 */

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
  /** Jika true, tampilkan input text bebas setelah dipilih */
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
  /** Jika evaluasi true → question ini di-skip sepenuhnya */
  skipIf?: (answers: Answers) => boolean;
  /** Validasi jawaban — return string error jika tidak valid */
  validate?: (value: AnswerValue, answers: Answers) => string | null;
  /** Dijalankan setelah jawaban di-set — bisa mutate answers lain */
  postHook?: (value: AnswerValue, answers: Answers) => Partial<Answers>;
  required?: boolean;
}

// ─── Helper evaluators ────────────────────────────────────────────────────────

const is = (id: string, val: string) => (a: Answers) => a[id] === val;
const isAny = (id: string, vals: string[]) => (a: Answers) => vals.includes(a[id] as string);
const has = (id: string, val: string) => (a: Answers) => (a[id] as string[] | undefined)?.includes(val) ?? false;
const not = (fn: (a: Answers) => boolean) => (a: Answers) => !fn(a);
const and = (...fns: Array<(a: Answers) => boolean>) => (a: Answers) => fns.every(f => f(a));
const or = (...fns: Array<(a: Answers) => boolean>) => (a: Answers) => fns.some(f => f(a));

const isWebPlatform = isAny('platform', ['web', 'api-only']);
const isMobilePlatform = isAny('platform', ['mobile-rn', 'mobile-flutter', 'android', 'ios']);
const isDesktopPlatform = isAny('platform', ['desktop-electron', 'desktop-tauri']);
const isNativePlatform = isAny('platform', ['android', 'ios']);
const isFlutter = is('platform', 'mobile-flutter');
const isAndroidNative = is('platform', 'android');
const isIOSNative = is('platform', 'ios');
const isAPIOnly = is('platform', 'api-only');
const isMVP = is('mode', 'mvp');
const isProduction = is('mode', 'production');
const isExtend = is('mode', 'extend');
const isMonorepo = isAny('workspace', ['turborepo', 'nx', 'pnpm-workspaces', 'yarn-workspaces']);
const isJSRuntime = isAny('runtime', ['nodejs', 'bun', 'deno', 'edge-cf', 'edge-vercel']);
const isPythonBackend = isAny('backend_framework', ['django', 'fastapi', 'flask']);
const isGoBackend = isAny('backend_framework', ['gin', 'fiber']);
const isNextJS = is('frontend_framework', 'nextjs');
const isBaaS = isAny('backend_framework', ['supabase-baas', 'firebase-baas', 'appwrite', 'pocketbase']);
const hasFrontend = not(isAPIOnly);
const hasSQLDB = isAny('database', ['postgresql', 'mysql', 'mariadb', 'sqlite', 'cockroachdb', 'planetscale', 'neon', 'turso', 'supabase']);

// ─── Question Definitions ─────────────────────────────────────────────────────

export const QUESTIONS: Question[] = [

  // ══════════════════════════════════════════════════════════════
  // GROUP 0 — PROJECT MODE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'mode',
    group: 'Project mode',
    step: 0,
    type: 'single',
    prompt: 'Kamu ingin melakukan apa?',
    hint: 'Ini menentukan kompleksitas setup dan tools yang digunakan.',
    required: true,
    options: [
      { value: 'mvp', label: 'MVP mode', description: 'Mulai dari nol, cepat, minimal config — fokus ke core features', badge: 'recommended' },
      { value: 'production', label: 'Production mode', description: 'Full setup: CI/CD, monitoring, security hardening, Docker', badge: 'popular' },
      { value: 'extend', label: 'Extend mode', description: 'Project sudah ada, ingin tambah fitur baru', badge: 'popular' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 0b — EXTEND SUBMODE (hanya muncul jika extend)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'extend_feature',
    group: 'Project mode',
    step: 1,
    type: 'single',
    prompt: 'Fitur apa yang ingin kamu tambahkan?',
    skipIf: not(isExtend),
    required: true,
    options: [
      { value: 'add-auth', label: 'Autentikasi (Auth)', description: 'Login, register, session, OAuth', badge: 'popular' },
      { value: 'add-payments', label: 'Payment', description: 'Stripe, Midtrans, Xendit', badge: 'popular' },
      { value: 'add-api-layer', label: 'API layer', description: 'REST atau GraphQL ke project existing' },
      { value: 'add-cms', label: 'CMS', description: 'Contentful, Sanity, Payload CMS' },
      { value: 'add-notifications', label: 'Notifikasi', description: 'Email, push notification, in-app' },
      { value: 'add-i18n', label: 'Internasionalisasi (i18n)', description: 'Multi-bahasa, locale routing' },
      { value: 'add-file-storage', label: 'File storage', description: 'S3, R2, Supabase Storage' },
      { value: 'add-analytics', label: 'Analytics', description: 'Mixpanel, PostHog, Plausible' },
      { value: 'add-search', label: 'Search', description: 'Algolia, Meilisearch, Typesense' },
      { value: 'add-queue', label: 'Background jobs / Queue', description: 'BullMQ, Trigger.dev, Inngest' },
      { value: 'add-ai', label: 'AI / LLM integration', description: 'OpenAI, Anthropic, Vercel AI SDK' },
      { value: 'custom', label: 'Fitur lain (custom)', description: 'Deskripsikan sendiri', isCustom: true },
    ],
    // Setelah pilih extend feature, kita langsung skip ke summary — tidak perlu setup full stack
    postHook: (val, answers) => {
      if (val !== 'custom') {
        // Auto-detect stack dari project existing akan dilakukan di engine
        return { _extend_ready: true };
      }
      return {};
    },
  },

  {
    id: 'extend_custom_description',
    group: 'Project mode',
    step: 2,
    type: 'text',
    prompt: 'Deskripsikan fitur yang ingin ditambahkan:',
    hint: 'Contoh: "Tambah WebSocket untuk realtime chat" atau "Tambah role-based access control"',
    skipIf: (a) => a['extend_feature'] !== 'custom' || !isExtend(a),
    required: true,
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 1 — PROJECT META
  // ══════════════════════════════════════════════════════════════
  {
    id: 'project_name',
    group: 'Project info',
    step: 3,
    type: 'text',
    prompt: 'Nama project kamu apa?',
    hint: 'Akan dipakai sebagai nama folder, package.json name, dan README title.',
    skipIf: isExtend,
    default: 'my-app',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length === 0) return 'Nama project tidak boleh kosong.';
      if (!/^[a-z0-9-_]+$/.test(val as string)) return 'Gunakan huruf kecil, angka, atau tanda hubung saja.';
      return null;
    },
  },

  {
    id: 'project_description',
    group: 'Project info',
    step: 4,
    type: 'text',
    prompt: 'Deskripsi singkat project (opsional):',
    hint: 'Akan masuk ke README dan package.json description.',
    skipIf: or(isExtend, isMVP),
    default: '',
    required: false,
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 2 — TARGET PLATFORM
  // ══════════════════════════════════════════════════════════════
  {
    id: 'platform',
    group: 'Target platform',
    step: 5,
    type: 'single',
    prompt: 'Target platform utama project ini:',
    skipIf: isExtend,
    required: true,
    options: [
      { value: 'web', label: 'Web app', description: 'Browser-based, responsive, bisa SSR atau SPA', badge: 'popular' },
      { value: 'api-only', label: 'API / Backend only', description: 'Headless backend, tidak ada frontend', badge: 'popular' },
      { value: 'mobile-rn', label: 'Mobile — React Native', description: 'iOS + Android, ekosistem JavaScript/TypeScript', badge: 'popular' },
      { value: 'mobile-flutter', label: 'Mobile — Flutter', description: 'iOS + Android, Dart, satu codebase', badge: 'popular' },
      { value: 'android', label: 'Android native', description: 'Kotlin + Jetpack Compose' },
      { value: 'ios', label: 'iOS native', description: 'Swift + SwiftUI' },
      { value: 'desktop-electron', label: 'Desktop — Electron', description: 'Windows, macOS, Linux via web tech' },
      { value: 'desktop-tauri', label: 'Desktop — Tauri', description: 'Lebih ringan dari Electron, Rust backend' },
      { value: 'cli', label: 'CLI tool', description: 'Terminal application' },
      { value: 'browser-ext', label: 'Browser extension', description: 'Chrome / Firefox extension' },
      { value: 'other', label: 'Lainnya', isCustom: true },
    ],
    postHook: (val, answers) => {
      // Auto-set language default berdasarkan platform
      const defaults: Record<string, string> = {
        'mobile-flutter': 'dart',
        'android': 'kotlin',
        'ios': 'swift',
      };
      if (defaults[val as string]) {
        return { language: defaults[val as string] };
      }
      return {};
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 3 — WORKSPACE STRUCTURE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'workspace',
    group: 'Workspace structure',
    step: 6,
    type: 'single',
    prompt: 'Struktur workspace project:',
    hint: 'Monorepo berguna jika kamu punya beberapa app dalam satu repo (web + mobile + API).',
    skipIf: or(isExtend, isFlutter, isAndroidNative, isIOSNative),
    default: 'single',
    options: (answers) => {
      const base: Option[] = [
        { value: 'single', label: 'Single app', description: 'Satu folder, satu app — paling sederhana', badge: 'recommended' },
      ];
      // Monorepo options hanya relevan untuk JS/TS ecosystem
      if (!isFlutter(answers) && !isAndroidNative(answers) && !isIOSNative(answers)) {
        base.push(
          { value: 'turborepo', label: 'Monorepo — Turborepo', description: 'Build cache otomatis, pipeline sederhana', badge: 'recommended' },
          { value: 'nx', label: 'Monorepo — Nx', description: 'Enterprise-grade, code gen, affected graph', badge: 'popular' },
          { value: 'pnpm-workspaces', label: 'Monorepo — pnpm workspaces', description: 'Minimal, manual, fleksibel', badge: 'experimental' },
        );
      }
      if (isAndroidNative(answers)) {
        base.push({ value: 'gradle', label: 'Gradle multi-project', description: 'Untuk Android Kotlin ecosystem', badge: 'legacy' });
      }
      base.push({ value: 'polyrepo', label: 'Polyrepo', description: 'Tiap service di repo terpisah' });
      return base;
    },
  },

  {
    id: 'monorepo_apps',
    group: 'Workspace structure',
    step: 7,
    type: 'multi',
    prompt: 'Apps apa saja yang ada di monorepo ini?',
    hint: 'Pilih semua yang relevan. Setiap app akan dibuat sebagai folder terpisah.',
    skipIf: (a) => !isMonorepo(a) || isExtend(a),
    required: true,
    options: (answers) => {
      const opts: Option[] = [
        { value: 'web', label: 'Web app (Next.js / Nuxt / dll)', badge: 'popular' },
        { value: 'api', label: 'API / Backend service', badge: 'popular' },
        { value: 'mobile-rn', label: 'Mobile — React Native' },
        { value: 'docs', label: 'Documentation site (Docusaurus / Nextra)' },
        { value: 'storybook', label: 'Storybook (component library)' },
        { value: 'shared-ui', label: 'Shared UI package' },
        { value: 'shared-types', label: 'Shared types / utils package' },
        { value: 'shared-config', label: 'Shared config (ESLint, TS, Tailwind)' },
      ];
      return opts;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 4 — LANGUAGE & RUNTIME
  // ══════════════════════════════════════════════════════════════
  {
    id: 'language',
    group: 'Language & runtime',
    step: 8,
    type: 'single',
    prompt: 'Bahasa pemrograman utama:',
    skipIf: or(isExtend, isFlutter, isAndroidNative, isIOSNative),
    default: 'typescript',
    options: (answers) => {
      // Filter berdasarkan platform
      if (isMobilePlatform(answers)) {
        return [
          { value: 'typescript', label: 'TypeScript', badge: 'recommended' },
          { value: 'javascript', label: 'JavaScript' },
        ];
      }
      if (isAPIOnly(answers) || isWebPlatform(answers)) {
        return [
          { value: 'typescript', label: 'TypeScript', description: 'Default untuk JS project', badge: 'recommended' },
          { value: 'javascript', label: 'JavaScript', description: 'Tanpa type system' },
          { value: 'python', label: 'Python', description: 'Untuk FastAPI / Django' },
          { value: 'go', label: 'Go', description: 'Untuk Gin / Fiber' },
          { value: 'rust', label: 'Rust', description: 'Untuk Axum — high performance' },
          { value: 'java', label: 'Java', description: 'Spring Boot, enterprise' },
          { value: 'kotlin', label: 'Kotlin', description: 'Ktor, modern JVM', badge: 'experimental' },
          { value: 'php', label: 'PHP', description: 'Laravel ecosystem' },
          { value: 'ruby', label: 'Ruby', description: 'Rails ecosystem' },
          { value: 'csharp', label: 'C#', description: '.NET ecosystem' },
        ];
      }
      return [{ value: 'typescript', label: 'TypeScript', badge: 'recommended' }];
    },
  },

  {
    id: 'runtime',
    group: 'Language & runtime',
    step: 9,
    type: 'single',
    prompt: 'JavaScript runtime:',
    skipIf: (a) => !isJSRuntime(a) && a['language'] !== 'typescript' && a['language'] !== 'javascript' || isExtend(a),
    default: (answers) => isNextJS(answers) ? 'nodejs' : 'nodejs',
    options: (answers) => {
      const opts: Option[] = [
        { value: 'nodejs', label: 'Node.js', description: 'Standard, ekosistem terbesar', badge: 'popular' },
        { value: 'bun', label: 'Bun', description: 'Cepat, built-in test + bundler', badge: 'experimental' },
        { value: 'deno', label: 'Deno', description: 'Secure by default, TypeScript native', badge: 'experimental' },
      ];
      if (isWebPlatform(answers)) {
        opts.push(
          { value: 'edge-cf', label: 'Edge — Cloudflare Workers', description: 'V8 isolates, global CDN' },
          { value: 'edge-vercel', label: 'Edge — Vercel Edge', description: 'Next.js native edge runtime' },
        );
      }
      return opts;
    },
  },

  {
    id: 'package_manager',
    group: 'Language & runtime',
    step: 10,
    type: 'single',
    prompt: 'Package manager:',
    skipIf: or(isExtend, isFlutter, isAndroidNative, isIOSNative),
    default: (answers) => {
      if (isMonorepo(answers)) return 'pnpm';
      if (answers['runtime'] === 'bun') return 'bun';
      if (isPythonBackend(answers)) return 'poetry';
      if (isGoBackend(answers)) return 'go-modules';
      return 'pnpm';
    },
    options: (answers) => {
      const lang = answers['language'] as string;
      if (lang === 'python') return [
        { value: 'poetry', label: 'Poetry', description: 'Dependency management + virtual env', badge: 'recommended' },
        { value: 'pip', label: 'pip', description: 'Standard, paling kompatibel' },
        { value: 'uv', label: 'uv', description: 'Rust-based, sangat cepat', badge: 'experimental' },
      ];
      if (lang === 'go') return [{ value: 'go-modules', label: 'Go modules', badge: 'recommended' }];
      if (lang === 'rust') return [{ value: 'cargo', label: 'Cargo', badge: 'recommended' }];
      if (lang === 'java') return [
        { value: 'gradle', label: 'Gradle', badge: 'popular' },
        { value: 'maven', label: 'Maven', badge: 'legacy' },
      ];
      if (lang === 'kotlin') return [{ value: 'gradle', label: 'Gradle (Kotlin DSL)', badge: 'recommended' }];
      if (lang === 'php') return [{ value: 'composer', label: 'Composer', badge: 'recommended' }];
      if (lang === 'ruby') return [{ value: 'bundler', label: 'Bundler', badge: 'recommended' }];
      if (lang === 'csharp') return [{ value: 'nuget', label: 'NuGet', badge: 'recommended' }];
      // Default JS/TS
      return [
        { value: 'pnpm', label: 'pnpm', description: 'Efisien, symlink, monorepo friendly', badge: 'recommended' },
        { value: 'npm', label: 'npm', description: 'Default, paling kompatibel', badge: 'popular' },
        { value: 'yarn', label: 'Yarn (classic)', badge: 'legacy' },
        { value: 'bun', label: 'Bun', description: 'All-in-one runtime + pkg manager', badge: 'experimental' },
      ];
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 5 — FRONTEND
  // ══════════════════════════════════════════════════════════════
  {
    id: 'frontend_framework',
    group: 'Frontend',
    step: 11,
    type: 'single',
    prompt: 'Frontend framework:',
    skipIf: or(isExtend, isAPIOnly),
    required: true,
    options: (answers) => {
      const lang = answers['language'] as string;
      const platform = answers['platform'] as string;

      if (platform === 'mobile-rn') return [
        { value: 'react-native-expo', label: 'React Native + Expo', description: 'Managed workflow, DX terbaik untuk RN', badge: 'recommended' },
        { value: 'react-native-bare', label: 'React Native (bare)', description: 'Full control, akses native module lebih bebas' },
      ];
      if (platform === 'mobile-flutter') return [
        { value: 'flutter', label: 'Flutter', badge: 'recommended' },
      ];
      if (platform === 'android') return [
        { value: 'jetpack-compose', label: 'Jetpack Compose', badge: 'recommended' },
        { value: 'xml-views', label: 'XML Views (legacy)', badge: 'legacy' },
      ];
      if (platform === 'ios') return [
        { value: 'swiftui', label: 'SwiftUI', badge: 'recommended' },
        { value: 'uikit', label: 'UIKit (legacy)', badge: 'legacy' },
      ];
      if (platform === 'desktop-electron') return [
        { value: 'electron-vite-react', label: 'Electron + Vite + React', badge: 'recommended' },
        { value: 'electron-vite-vue', label: 'Electron + Vite + Vue' },
        { value: 'electron-nextjs', label: 'Electron + Next.js' },
      ];
      if (platform === 'desktop-tauri') return [
        { value: 'tauri-vite-react', label: 'Tauri + Vite + React', badge: 'recommended' },
        { value: 'tauri-vite-vue', label: 'Tauri + Vite + Vue' },
        { value: 'tauri-sveltekit', label: 'Tauri + SvelteKit' },
      ];
      if (platform === 'cli') return [
        { value: 'none', label: 'Tidak ada frontend (pure CLI)' },
      ];

      // Web platform — filter by language
      if (lang === 'typescript' || lang === 'javascript') return [
        { value: 'nextjs', label: 'Next.js', description: 'React, SSR + SSG + App Router', badge: 'popular' },
        { value: 'nuxt', label: 'Nuxt', description: 'Vue, SSR + SSG', badge: 'popular' },
        { value: 'sveltekit', label: 'SvelteKit', description: 'Svelte, ringan, kompilasi', badge: 'experimental' },
        { value: 'remix', label: 'Remix', description: 'React, web-first, loader pattern', badge: 'experimental' },
        { value: 'astro', label: 'Astro', description: 'Islands, konten statis optimal', badge: 'experimental' },
        { value: 'vite-react', label: 'Vite + React', description: 'SPA murni, tanpa SSR', badge: 'popular' },
        { value: 'vite-vue', label: 'Vite + Vue', description: 'SPA Vue, fast HMR' },
        { value: 'vite-solid', label: 'Vite + SolidJS', description: 'Fine-grained reactivity' },
        { value: 'angular', label: 'Angular', description: 'Full framework, enterprise', badge: 'legacy' },
        { value: 'htmx', label: 'HTMX', description: 'Hypermedia, minimal JavaScript' },
        { value: 'vanilla', label: 'Vanilla (no framework)', description: 'HTML + CSS + JS murni' },
      ];
      if (lang === 'python') return [
        { value: 'none', label: 'Tidak ada (API only / template engine)' },
        { value: 'htmx', label: 'HTMX + Jinja2', description: 'Server-rendered dengan Django/FastAPI' },
      ];
      if (lang === 'go') return [
        { value: 'none', label: 'Tidak ada (API only)' },
        { value: 'htmx', label: 'HTMX + templ', description: 'Server-rendered Go templates' },
      ];
      if (lang === 'php') return [
        { value: 'laravel-blade', label: 'Laravel Blade', description: 'Built-in template engine', badge: 'recommended' },
        { value: 'laravel-inertia-react', label: 'Laravel + Inertia.js + React', badge: 'popular' },
        { value: 'laravel-inertia-vue', label: 'Laravel + Inertia.js + Vue', badge: 'popular' },
        { value: 'laravel-livewire', label: 'Laravel Livewire', description: 'Reactive UI tanpa JS framework' },
      ];
      return [{ value: 'none', label: 'Tidak ada frontend' }];
    },
    postHook: (val, answers) => {
      // Auto-suggest backend jika pilih BaaS-friendly framework
      if (val === 'nextjs' && !answers['backend_framework']) {
        return { backend_framework: 'nextjs-api' };
      }
      return {};
    },
  },

  {
    id: 'ui_library',
    group: 'Frontend',
    step: 12,
    type: 'single',
    prompt: 'UI library / component:',
    skipIf: (a) => isAPIOnly(a) || isExtend(a) || isAny('frontend_framework', ['none', 'flutter', 'jetpack-compose', 'swiftui', 'uikit', 'xml-views'])(a),
    default: (answers) => {
      if (isAny('frontend_framework', ['nextjs', 'vite-react', 'remix'])(answers)) return 'shadcn';
      if (isAny('frontend_framework', ['nuxt', 'vite-vue'])(answers)) return 'none';
      return 'tailwind-only';
    },
    options: (answers) => {
      const fw = answers['frontend_framework'] as string;

      if (['react-native-expo', 'react-native-bare'].includes(fw)) return [
        { value: 'nativewind', label: 'NativeWind', description: 'Tailwind untuk React Native', badge: 'recommended' },
        { value: 'react-native-paper', label: 'React Native Paper', description: 'Material Design' },
        { value: 'tamagui', label: 'Tamagui', description: 'Universal UI, perf focused', badge: 'experimental' },
        { value: 'gluestack', label: 'Gluestack UI', description: 'Universal components', badge: 'experimental' },
        { value: 'none', label: 'Tanpa UI library' },
      ];

      if (['nuxt', 'vite-vue'].includes(fw)) return [
        { value: 'nuxt-ui', label: 'Nuxt UI', description: 'Official Nuxt component library', badge: 'recommended' },
        { value: 'vuetify', label: 'Vuetify', description: 'Material Design, Vue' },
        { value: 'primevue', label: 'PrimeVue', description: 'Enterprise rich components' },
        { value: 'tailwind-only', label: 'Tailwind CSS only' },
        { value: 'none', label: 'Tanpa UI library' },
      ];

      if (fw === 'sveltekit') return [
        { value: 'skeleton', label: 'Skeleton UI', badge: 'recommended' },
        { value: 'shadcn-svelte', label: 'shadcn-svelte', badge: 'experimental' },
        { value: 'tailwind-only', label: 'Tailwind CSS only' },
        { value: 'none', label: 'Tanpa UI library' },
      ];

      // React ecosystem (Next.js, Vite+React, Remix, Astro)
      return [
        { value: 'shadcn', label: 'shadcn/ui', description: 'Radix-based, copy-paste components', badge: 'recommended' },
        { value: 'tailwind-only', label: 'Tailwind CSS only', badge: 'popular' },
        { value: 'mui', label: 'Material UI (MUI)', description: 'Google Material Design', badge: 'popular' },
        { value: 'mantine', label: 'Mantine', description: 'Full-featured, React' },
        { value: 'chakra', label: 'Chakra UI', description: 'Accessible, themeable' },
        { value: 'daisyui', label: 'DaisyUI', description: 'Tailwind component library' },
        { value: 'antd', label: 'Ant Design', description: 'Enterprise UI' },
        { value: 'none', label: 'Tanpa UI library / custom CSS' },
      ];
    },
  },

  {
    id: 'state_management',
    group: 'Frontend',
    step: 13,
    type: 'single',
    prompt: 'State management:',
    hint: 'Pilih "None" jika app sederhana — banyak app tidak butuh global state manager.',
    skipIf: (a) => isAPIOnly(a) || isExtend(a) || isAny('frontend_framework', ['none', 'flutter', 'jetpack-compose', 'swiftui', 'uikit', 'xml-views', 'laravel-blade', 'laravel-livewire'])(a),
    default: 'tanstack-query',
    options: (answers) => {
      const fw = answers['frontend_framework'] as string;

      if (['react-native-expo', 'react-native-bare'].includes(fw)) return [
        { value: 'zustand', label: 'Zustand', description: 'Minimal, paling mudah', badge: 'recommended' },
        { value: 'tanstack-query', label: 'TanStack Query', description: 'Server state + caching', badge: 'popular' },
        { value: 'jotai', label: 'Jotai', description: 'Atomic state' },
        { value: 'redux-toolkit', label: 'Redux Toolkit', description: 'Complex state, familiar', badge: 'legacy' },
        { value: 'none', label: 'Tanpa state manager' },
      ];

      if (['nuxt', 'vite-vue'].includes(fw)) return [
        { value: 'pinia', label: 'Pinia', description: 'Vue 3 official store', badge: 'recommended' },
        { value: 'tanstack-query', label: 'TanStack Query (Vue)', description: 'Server state', badge: 'popular' },
        { value: 'none', label: 'Tanpa state manager' },
      ];

      // React ecosystem
      return [
        { value: 'tanstack-query', label: 'TanStack Query', description: 'Server state + caching, recommended default', badge: 'recommended' },
        { value: 'zustand', label: 'Zustand', description: 'Global client state, minimal', badge: 'popular' },
        { value: 'jotai', label: 'Jotai', description: 'Atomic, granular', badge: 'popular' },
        { value: 'swr', label: 'SWR', description: 'Data fetching, Vercel' },
        { value: 'redux-toolkit', label: 'Redux Toolkit', description: 'Complex state, verbose', badge: 'legacy' },
        { value: 'xstate', label: 'XState', description: 'State machines, FSM' },
        { value: 'none', label: 'Tanpa state manager' },
      ];
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 6 — BACKEND
  // ══════════════════════════════════════════════════════════════
  {
    id: 'backend_framework',
    group: 'Backend',
    step: 14,
    type: 'single',
    prompt: 'Backend framework:',
    skipIf: isExtend,
    required: true,
    options: (answers) => {
      const lang = answers['language'] as string;
      const platform = answers['platform'] as string;
      const frontendFW = answers['frontend_framework'] as string;

      // Mobile / native: backend biasanya BaaS
      if (isMobilePlatform(answers) || isNativePlatform(answers)) return [
        { value: 'supabase-baas', label: 'Supabase', description: 'Auth + DB + Storage + Realtime dalam satu platform', badge: 'recommended' },
        { value: 'firebase-baas', label: 'Firebase', description: 'Google ecosystem, Realtime DB', badge: 'popular' },
        { value: 'appwrite', label: 'Appwrite', description: 'Self-hostable, open source BaaS' },
        { value: 'pocketbase', label: 'PocketBase', description: 'Single binary, embedded', badge: 'experimental' },
        { value: 'custom-api', label: 'Custom API terpisah', description: 'Backend sendiri via REST/GraphQL' },
        { value: 'none', label: 'Tidak ada backend' },
      ];

      if (lang === 'typescript' || lang === 'javascript') return [
        { value: 'nextjs-api', label: 'Next.js API Routes / Server Actions', description: 'Jika pakai Next.js, sudah built-in', badge: frontendFW === 'nextjs' ? 'recommended' : 'popular' },
        { value: 'nestjs', label: 'NestJS', description: 'TypeScript, modular, enterprise', badge: 'popular' },
        { value: 'fastify', label: 'Fastify', description: 'Node.js, cepat, schema validation', badge: 'popular' },
        { value: 'hono', label: 'Hono', description: 'Edge-first, ringan, multi-runtime', badge: 'experimental' },
        { value: 'elysia', label: 'Elysia', description: 'Bun-native, type-safe, sangat cepat', badge: answers['runtime'] === 'bun' ? 'recommended' : 'experimental' },
        { value: 'express', label: 'Express.js', description: 'Minimal, klasik, banyak tutorial', badge: 'legacy' },
        { value: 'trpc-standalone', label: 'tRPC + Fastify', description: 'Type-safe API tanpa schema', badge: 'experimental' },
        { value: 'supabase-baas', label: 'Supabase (BaaS)', description: 'Skip backend custom, pakai Supabase', badge: 'recommended' },
        { value: 'pocketbase', label: 'PocketBase', description: 'Single binary, embedded DB + auth', badge: 'experimental' },
        { value: 'payload-cms', label: 'Payload CMS', description: 'Headless CMS + backend sekaligus' },
        { value: 'none', label: 'Tidak ada backend' },
      ];

      if (lang === 'python') return [
        { value: 'fastapi', label: 'FastAPI', description: 'Async, OpenAPI auto-gen, modern', badge: 'recommended' },
        { value: 'django', label: 'Django', description: 'Batteries-included, ORM bawaan', badge: 'popular' },
        { value: 'flask', label: 'Flask', description: 'Minimal, microframework', badge: 'legacy' },
      ];

      if (lang === 'go') return [
        { value: 'gin', label: 'Gin', description: 'Performant, Express-like', badge: 'popular' },
        { value: 'fiber', label: 'Fiber', description: 'Express-like, sangat cepat' },
        { value: 'chi', label: 'Chi', description: 'Minimal, idiomatic Go' },
        { value: 'echo', label: 'Echo', description: 'High performance, extensible' },
      ];

      if (lang === 'rust') return [
        { value: 'axum', label: 'Axum', description: 'Tokio-based, ergonomic', badge: 'recommended' },
        { value: 'actix-web', label: 'Actix Web', description: 'Sangat cepat, actor model' },
        { value: 'warp', label: 'Warp', description: 'Filter-based, composable' },
      ];

      if (lang === 'java') return [
        { value: 'spring-boot', label: 'Spring Boot', description: 'Enterprise standard', badge: 'popular' },
        { value: 'micronaut', label: 'Micronaut', description: 'Cloud-native, fast startup' },
      ];

      if (lang === 'kotlin') return [
        { value: 'ktor', label: 'Ktor', description: 'Async, JetBrains official', badge: 'recommended' },
        { value: 'spring-boot', label: 'Spring Boot (Kotlin)', badge: 'popular' },
      ];

      if (lang === 'php') return [
        { value: 'laravel', label: 'Laravel', description: 'MVC, Eloquent ORM, full-featured', badge: 'recommended' },
        { value: 'slim', label: 'Slim Framework', description: 'Micro framework' },
      ];

      if (lang === 'ruby') return [
        { value: 'rails', label: 'Ruby on Rails', description: 'Convention over config', badge: 'recommended' },
        { value: 'sinatra', label: 'Sinatra', description: 'Minimal, DSL-based' },
      ];

      if (lang === 'csharp') return [
        { value: 'aspnet', label: 'ASP.NET Core', badge: 'recommended' },
        { value: 'minimal-api', label: 'ASP.NET Minimal API', badge: 'popular' },
      ];

      return [{ value: 'none', label: 'Tidak ada backend' }];
    },
    postHook: (val, answers) => {
      if (isBaaS({ ...answers, backend_framework: val as string })) {
        return { database: (val as string).replace('-baas', ''), orm: 'none' };
      }
      return {};
    },
  },

  {
    id: 'api_style',
    group: 'Backend',
    step: 15,
    type: 'multi',
    prompt: 'API style yang digunakan:',
    skipIf: (a) => isExtend(a) || isBaaS(a) || is('backend_framework', 'none')(a) || is('backend_framework', 'payload-cms')(a),
    default: ['rest'],
    options: (answers) => {
      const lang = answers['language'] as string;
      const backend = answers['backend_framework'] as string;
      const opts: Option[] = [
        { value: 'rest', label: 'REST', description: 'Standard HTTP, widely supported', badge: 'popular' },
      ];
      if (lang === 'typescript' || lang === 'javascript') {
        opts.push(
          { value: 'graphql', label: 'GraphQL', description: 'Flexible queries, Apollo / Pothos' },
          { value: 'websocket', label: 'WebSocket', description: 'Realtime, bidirectional' },
          { value: 'sse', label: 'SSE', description: 'Server-sent events, streaming' },
        );
        if (backend !== 'express' && backend !== 'nestjs') {
          opts.push({ value: 'trpc', label: 'tRPC', description: 'Type-safe, no schema file', badge: 'experimental' });
        }
      }
      if (['nestjs', 'spring-boot', 'aspnet'].includes(backend)) {
        opts.push({ value: 'grpc', label: 'gRPC', description: 'Binary protocol, microservices' });
      }
      return opts;
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 7 — DATABASE & ORM
  // ══════════════════════════════════════════════════════════════
  {
    id: 'database',
    group: 'Database',
    step: 16,
    type: 'single',
    prompt: 'Database utama:',
    skipIf: (a) => isExtend(a) || isBaaS(a) || is('backend_framework', 'none')(a),
    required: true,
    default: (answers) => {
      if (isMVP(answers)) return 'sqlite';
      if (answers['language'] === 'python') return 'postgresql';
      return 'postgresql';
    },
    options: (answers) => {
      const lang = answers['language'] as string;
      const mode = answers['mode'] as string;
      const backend = answers['backend_framework'] as string;

      const relational: Option[] = [
        { value: 'postgresql', label: 'PostgreSQL', description: 'Open source, feature-rich, recommended', badge: 'recommended' },
        { value: 'mysql', label: 'MySQL', description: 'Widely hosted, popular', badge: 'popular' },
        { value: 'sqlite', label: 'SQLite', description: 'File-based, ideal untuk MVP / dev lokal', badge: mode === 'mvp' ? 'recommended' : undefined },
        { value: 'neon', label: 'Neon', description: 'Serverless PostgreSQL, branching', badge: 'experimental' },
        { value: 'turso', label: 'Turso (LibSQL)', description: 'Edge SQLite, replicated', badge: 'experimental' },
        { value: 'planetscale', label: 'PlanetScale', description: 'Serverless MySQL, branching', badge: 'experimental' },
        { value: 'supabase', label: 'Supabase PostgreSQL', description: 'Managed + realtime + auth', badge: 'recommended' },
        { value: 'cockroachdb', label: 'CockroachDB', description: 'Distributed SQL' },
      ];

      const nosql: Option[] = [
        { value: 'mongodb', label: 'MongoDB', description: 'Document database, flexible schema', badge: 'popular' },
        { value: 'redis', label: 'Redis', description: 'Cache, session, queue' },
        { value: 'upstash-redis', label: 'Upstash Redis', description: 'Serverless Redis, edge-friendly', badge: 'experimental' },
        { value: 'dynamodb', label: 'DynamoDB', description: 'AWS, key-value + document' },
        { value: 'convex', label: 'Convex', description: 'Realtime reactive DB', badge: 'experimental' },
      ];

      if (lang === 'go' || lang === 'rust') return relational;
      if (backend === 'django') return [
        ...relational.filter(d => ['postgresql', 'mysql', 'sqlite'].includes(d.value)),
        ...nosql.filter(d => d.value === 'redis'),
      ];

      return [...relational, ...nosql];
    },
  },

  {
    id: 'orm',
    group: 'Database',
    step: 17,
    type: 'single',
    prompt: 'ORM / Query builder:',
    skipIf: (a) => isExtend(a) || isBaaS(a) || is('backend_framework', 'none')(a) || is('database', 'redis')(a) || is('database', 'upstash-redis')(a),
    default: (answers) => {
      if (answers['language'] === 'python') {
        return answers['backend_framework'] === 'django' ? 'django-orm' : 'sqlalchemy';
      }
      if (answers['language'] === 'go') return 'none';
      if (answers['language'] === 'php') return 'eloquent';
      if (answers['language'] === 'ruby') return 'active-record';
      if (answers['language'] === 'java') return 'hibernate';
      if (answers['language'] === 'kotlin') return 'exposed';
      return 'prisma';
    },
    options: (answers) => {
      const lang = answers['language'] as string;
      const db = answers['database'] as string;
      const backend = answers['backend_framework'] as string;

      if (lang === 'python') {
        if (backend === 'django') return [{ value: 'django-orm', label: 'Django ORM', description: 'Built-in Django', badge: 'recommended' }];
        return [
          { value: 'sqlalchemy', label: 'SQLAlchemy', description: 'Mature, powerful Python ORM', badge: 'recommended' },
          { value: 'tortoise-orm', label: 'Tortoise ORM', description: 'Async, FastAPI-friendly' },
          { value: 'peewee', label: 'Peewee', description: 'Simple, lightweight' },
          { value: 'none', label: 'Raw SQL / psycopg2' },
        ];
      }
      if (lang === 'go') return [
        { value: 'gorm', label: 'GORM', description: 'Feature-rich Go ORM', badge: 'popular' },
        { value: 'sqlx', label: 'sqlx', description: 'SQL extensions, idiomatic Go' },
        { value: 'ent', label: 'Ent', description: 'Facebook, graph-based ORM', badge: 'experimental' },
        { value: 'none', label: 'database/sql (raw)' },
      ];
      if (lang === 'rust') return [
        { value: 'diesel', label: 'Diesel', description: 'Compile-time checked queries', badge: 'popular' },
        { value: 'sqlx', label: 'sqlx (Rust)', description: 'Async, compile-time SQL', badge: 'recommended' },
        { value: 'sea-orm', label: 'SeaORM', description: 'Async, dynamic', badge: 'experimental' },
      ];
      if (lang === 'java') return [
        { value: 'hibernate', label: 'Hibernate / JPA', badge: 'popular' },
        { value: 'jooq', label: 'jOOQ', description: 'Type-safe SQL' },
      ];
      if (lang === 'kotlin') return [
        { value: 'exposed', label: 'Exposed', description: 'JetBrains, Kotlin DSL', badge: 'recommended' },
        { value: 'ktorm', label: 'Ktorm', description: 'Fluent API, Kotlin' },
        { value: 'hibernate', label: 'Hibernate / JPA', badge: 'legacy' },
      ];
      if (lang === 'php') return [
        { value: 'eloquent', label: 'Eloquent', description: 'Built-in Laravel', badge: 'recommended' },
        { value: 'doctrine', label: 'Doctrine', description: 'Data Mapper pattern' },
      ];
      if (lang === 'ruby') return [
        { value: 'active-record', label: 'Active Record', description: 'Built-in Rails', badge: 'recommended' },
        { value: 'sequel', label: 'Sequel', description: 'Flexible toolkit' },
      ];
      if (lang === 'csharp') return [
        { value: 'ef-core', label: 'Entity Framework Core', badge: 'recommended' },
        { value: 'dapper', label: 'Dapper', description: 'Lightweight micro-ORM' },
      ];

      // TypeScript/JavaScript
      if (db === 'mongodb') return [
        { value: 'mongoose', label: 'Mongoose', description: 'Document model, mature', badge: 'recommended' },
        { value: 'prisma', label: 'Prisma (MongoDB)', description: 'TypeScript-first, tapi terbatas untuk Mongo', badge: 'experimental' },
        { value: 'none', label: 'MongoDB driver langsung' },
      ];
      return [
        { value: 'prisma', label: 'Prisma', description: 'TypeScript-first, auto migration, DX terbaik', badge: 'recommended' },
        { value: 'drizzle', label: 'Drizzle ORM', description: 'Lightweight, SQL-like, type-safe', badge: 'experimental' },
        { value: 'typeorm', label: 'TypeORM', description: 'Decorator-based, mature', badge: 'legacy' },
        { value: 'sequelize', label: 'Sequelize', description: 'Mature, legacy popular', badge: 'legacy' },
        { value: 'kysely', label: 'Kysely', description: 'Type-safe query builder, no ORM' },
        { value: 'none', label: 'Raw SQL / database driver langsung' },
      ];
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 8 — AUTH
  // ══════════════════════════════════════════════════════════════
  {
    id: 'auth_provider',
    group: 'Auth',
    step: 18,
    type: 'single',
    prompt: 'Sistem autentikasi:',
    skipIf: isExtend,
    default: (answers) => {
      if (is('database', 'supabase')(answers) || is('backend_framework', 'supabase-baas')(answers)) return 'supabase-auth';
      if (is('backend_framework', 'firebase-baas')(answers)) return 'firebase-auth';
      if (isNextJS(answers)) return 'nextauth';
      return 'none';
    },
    options: (answers) => {
      const fw = answers['frontend_framework'] as string;
      const backend = answers['backend_framework'] as string;
      const db = answers['database'] as string;

      return [
        {
          value: 'supabase-auth',
          label: 'Supabase Auth',
          description: 'Built-in jika pakai Supabase',
          badge: (db === 'supabase' || backend === 'supabase-baas') ? 'recommended' : undefined,
        },
        { value: 'clerk', label: 'Clerk', description: 'Hosted UI + user management, DX terbaik', badge: 'recommended' },
        { value: 'nextauth', label: 'Auth.js / NextAuth', description: 'Multi-provider, Next.js native', badge: fw === 'nextjs' ? 'recommended' : 'popular' },
        { value: 'better-auth', label: 'Better Auth', description: 'Modern, TypeScript, self-hosted', badge: 'experimental' },
        { value: 'lucia', label: 'Lucia Auth', description: 'Self-hosted, TypeScript, lightweight' },
        { value: 'firebase-auth', label: 'Firebase Auth', description: 'Google ecosystem', badge: backend === 'firebase-baas' ? 'recommended' : undefined },
        { value: 'auth0', label: 'Auth0', description: 'Enterprise, managed', badge: 'popular' },
        { value: 'keycloak', label: 'Keycloak', description: 'Self-hosted SSO, enterprise' },
        { value: 'kinde', label: 'Kinde', description: 'Auth + user management, free tier' },
        { value: 'workos', label: 'WorkOS', description: 'Enterprise SSO, SAML, SCIM' },
        { value: 'custom-jwt', label: 'Custom JWT', description: 'Build sendiri dari scratch' },
        { value: 'none', label: 'Tidak ada auth (public app)' },
      ];
    },
  },

  {
    id: 'auth_methods',
    group: 'Auth',
    step: 19,
    type: 'multi',
    prompt: 'Metode login yang didukung:',
    skipIf: (a) => isExtend(a) || is('auth_provider', 'none')(a),
    default: (answers) => {
      if (isMVP(answers)) return ['email-password'];
      return ['email-password', 'oauth-google'];
    },
    options: [
      { value: 'email-password', label: 'Email + password', badge: 'popular' },
      { value: 'magic-link', label: 'Magic link (passwordless email)' },
      { value: 'oauth-google', label: 'OAuth — Google', badge: 'popular' },
      { value: 'oauth-github', label: 'OAuth — GitHub' },
      { value: 'oauth-discord', label: 'OAuth — Discord' },
      { value: 'oauth-apple', label: 'OAuth — Apple' },
      { value: 'passkey', label: 'Passkey / WebAuthn', badge: 'experimental' },
      { value: 'phone-otp', label: 'Phone OTP (SMS)' },
      { value: 'sso-saml', label: 'SSO / SAML (enterprise)' },
      { value: 'anonymous', label: 'Anonymous (guest)' },
    ],
  },

  {
    id: 'rbac',
    group: 'Auth',
    step: 20,
    type: 'single',
    prompt: 'Role-based access control (RBAC)?',
    hint: 'RBAC membagi user menjadi role (admin, editor, viewer, dll) dengan permission berbeda.',
    skipIf: (a) => isExtend(a) || is('auth_provider', 'none')(a) || isMVP(a),
    default: 'no',
    options: [
      { value: 'no', label: 'Tidak perlu (semua user sama)', badge: 'recommended' },
      { value: 'simple', label: 'Role sederhana (admin / user)', badge: 'popular' },
      { value: 'full', label: 'Full RBAC dengan permission granular' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 9 — ADD-ONS
  // ══════════════════════════════════════════════════════════════
  {
    id: 'payment_provider',
    group: 'Add-ons',
    step: 21,
    type: 'single',
    prompt: 'Payment integration:',
    skipIf: isExtend,
    default: 'none',
    options: [
      { value: 'stripe', label: 'Stripe', description: 'Global, developer-friendly, terdokumentasi', badge: 'recommended' },
      { value: 'midtrans', label: 'Midtrans', description: 'Indonesia, payment gateway populer', badge: 'popular' },
      { value: 'xendit', label: 'Xendit', description: 'Southeast Asia, e-wallet support' },
      { value: 'paddle', label: 'Paddle', description: 'SaaS billing, merchant of record, tax handling' },
      { value: 'lemonsqueezy', label: 'LemonSqueezy', description: 'Digital products, merchant of record' },
      { value: 'none', label: 'Tidak ada payment' },
    ],
  },

  {
    id: 'email_provider',
    group: 'Add-ons',
    step: 22,
    type: 'single',
    prompt: 'Email transactional:',
    hint: 'Untuk kirim email verifikasi, reset password, notifikasi, dll.',
    skipIf: (a) => isExtend(a) || is('auth_provider', 'none')(a),
    default: (answers) => {
      if (is('backend_framework', 'supabase-baas')(answers) || is('database', 'supabase')(answers)) return 'supabase-smtp';
      return 'resend';
    },
    options: [
      { value: 'resend', label: 'Resend', description: 'Developer-first, React Email, DX terbaik', badge: 'recommended' },
      { value: 'sendgrid', label: 'SendGrid', description: 'Established, high volume' },
      { value: 'postmark', label: 'Postmark', description: 'Transactional focus, deliverability tinggi' },
      { value: 'mailgun', label: 'Mailgun', description: 'API-first' },
      { value: 'supabase-smtp', label: 'Supabase built-in SMTP', description: 'Jika pakai Supabase Auth' },
      { value: 'nodemailer', label: 'Nodemailer (self-hosted SMTP)', description: 'Pakai SMTP server sendiri' },
      { value: 'none', label: 'Tidak ada email' },
    ],
  },

  {
    id: 'file_storage',
    group: 'Add-ons',
    step: 23,
    type: 'single',
    prompt: 'File / media storage:',
    skipIf: isExtend,
    default: 'none',
    options: (answers) => [
      { value: 'r2', label: 'Cloudflare R2', description: 'S3-compatible, free egress', badge: 'recommended' },
      { value: 's3', label: 'AWS S3', description: 'Standard, mature, banyak integrasi' },
      {
        value: 'supabase-storage',
        label: 'Supabase Storage',
        description: 'Jika pakai Supabase',
        badge: (answers['database'] === 'supabase' || answers['backend_framework'] === 'supabase-baas') ? 'recommended' : undefined,
      },
      { value: 'uploadthing', label: 'Uploadthing', description: 'DX-first, Next.js + tRPC friendly' },
      { value: 'cloudinary', label: 'Cloudinary', description: 'Image/video transform + CDN' },
      { value: 'none', label: 'Tidak ada file storage' },
    ],
  },

  {
    id: 'queue_provider',
    group: 'Add-ons',
    step: 24,
    type: 'single',
    prompt: 'Background jobs / Queue:',
    hint: 'Untuk task async: kirim email massal, resize gambar, scheduled jobs, dll.',
    skipIf: (a) => isExtend(a) || isMVP(a),
    default: 'none',
    options: [
      { value: 'bullmq', label: 'BullMQ', description: 'Redis-based, Node.js, mature', badge: 'popular' },
      { value: 'trigger-dev', label: 'Trigger.dev', description: 'Background jobs + events + cron, DX bagus', badge: 'experimental' },
      { value: 'inngest', label: 'Inngest', description: 'Event-driven, serverless-friendly', badge: 'experimental' },
      { value: 'celery', label: 'Celery', description: 'Python, Redis/RabbitMQ backend', badge: 'popular' },
      { value: 'none', label: 'Tidak ada background jobs' },
    ],
  },

  {
    id: 'monitoring',
    group: 'Add-ons',
    step: 25,
    type: 'multi',
    prompt: 'Monitoring & observability:',
    skipIf: (a) => isExtend(a) || isMVP(a),
    default: ['sentry'],
    options: [
      { value: 'sentry', label: 'Sentry', description: 'Error tracking + performance', badge: 'popular' },
      { value: 'posthog', label: 'PostHog', description: 'Product analytics + session replay, open source', badge: 'recommended' },
      { value: 'axiom', label: 'Axiom', description: 'Log management, serverless-friendly' },
      { value: 'opentelemetry', label: 'OpenTelemetry', description: 'Vendor-agnostic observability standard' },
      { value: 'datadog', label: 'Datadog', description: 'APM + logs + metrics, enterprise' },
      { value: 'none', label: 'Tidak ada monitoring' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 10 — INFRA & CI/CD
  // ══════════════════════════════════════════════════════════════
  {
    id: 'hosting',
    group: 'Infrastructure',
    step: 26,
    type: 'single',
    prompt: 'Platform hosting / deployment:',
    skipIf: isExtend,
    default: (answers) => {
      if (isNextJS(answers)) return 'vercel';
      if (answers['language'] === 'python') return 'railway';
      if (isMobilePlatform(answers)) return 'none';
      return 'railway';
    },
    options: (answers) => {
      if (isMobilePlatform(answers) || isNativePlatform(answers)) return [
        { value: 'none', label: 'Tidak ada (mobile app, distribusi via App Store)' },
        { value: 'expo-eas', label: 'Expo EAS (React Native)', description: 'Build + submit ke stores', badge: is('frontend_framework', 'react-native-expo')(answers) ? 'recommended' : undefined },
      ];

      return [
        { value: 'vercel', label: 'Vercel', description: 'Next.js native, edge, serverless', badge: isNextJS(answers) ? 'recommended' : 'popular' },
        { value: 'railway', label: 'Railway', description: 'Docker, databases, simplest DevEx', badge: 'recommended' },
        { value: 'render', label: 'Render', description: 'Auto-deploy, managed services' },
        { value: 'flyio', label: 'Fly.io', description: 'Container, global edge, low latency' },
        { value: 'netlify', label: 'Netlify', description: 'Jamstack, serverless functions' },
        { value: 'cf-pages', label: 'Cloudflare Pages', description: 'Static + Workers, edge' },
        { value: 'digitalocean', label: 'DigitalOcean App Platform', description: 'Affordable, managed' },
        { value: 'hetzner', label: 'Hetzner VPS', description: 'Murah, EU, self-manage', badge: 'experimental' },
        { value: 'aws', label: 'AWS', description: 'Full suite, EC2 / ECS / Lambda', badge: 'legacy' },
        { value: 'gcp', label: 'Google Cloud', description: 'Cloud Run, GKE, Firebase' },
        { value: 'self-hosted', label: 'Self-hosted VPS', description: 'Docker + Nginx manual' },
        { value: 'none', label: 'Belum ditentukan' },
      ];
    },
  },

  {
    id: 'docker',
    group: 'Infrastructure',
    step: 27,
    type: 'single',
    prompt: 'Docker setup:',
    skipIf: (a) => isExtend(a) || isMobilePlatform(a) || isNativePlatform(a),
    default: (answers) => isMVP(answers) ? 'none' : 'compose',
    options: [
      { value: 'none', label: 'Tidak pakai Docker', badge: 'recommended' },
      { value: 'compose', label: 'Docker Compose (local + staging)', description: 'Multi-container setup, development friendly', badge: 'popular' },
      { value: 'compose-prod', label: 'Docker Compose + production Dockerfile', description: 'Full production setup' },
      { value: 'kubernetes', label: 'Kubernetes', description: 'Orchestration, hanya untuk tim besar' },
    ],
  },

  {
    id: 'ci_cd',
    group: 'Infrastructure',
    step: 28,
    type: 'single',
    prompt: 'CI/CD pipeline:',
    skipIf: (a) => isExtend(a) || isMVP(a),
    default: 'github-actions',
    options: [
      { value: 'github-actions', label: 'GitHub Actions', description: 'Native GitHub, marketplace luas', badge: 'recommended' },
      { value: 'gitlab-ci', label: 'GitLab CI', description: 'Built-in GitLab' },
      { value: 'circleci', label: 'CircleCI', description: 'Mature, cloud CI' },
      { value: 'none', label: 'Tidak ada CI/CD (platform auto-deploy)' },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 11 — TOOLING
  // ══════════════════════════════════════════════════════════════
  {
    id: 'linter',
    group: 'Tooling',
    step: 29,
    type: 'single',
    prompt: 'Linter & formatter:',
    skipIf: or(isExtend, isFlutter, isAndroidNative, isIOSNative),
    default: (answers) => {
      if (answers['language'] === 'python') return 'ruff';
      if (answers['language'] === 'go') return 'golangci-lint';
      if (answers['language'] === 'rust') return 'clippy';
      return 'biome';
    },
    options: (answers) => {
      const lang = answers['language'] as string;
      if (lang === 'python') return [
        { value: 'ruff', label: 'Ruff', description: 'Python linter + formatter, Rust-based, sangat cepat', badge: 'recommended' },
        { value: 'flake8-black', label: 'Flake8 + Black', description: 'Classic Python combo', badge: 'popular' },
      ];
      if (lang === 'go') return [{ value: 'golangci-lint', label: 'golangci-lint', badge: 'recommended' }];
      if (lang === 'rust') return [{ value: 'clippy', label: 'Clippy + rustfmt', badge: 'recommended' }];
      if (lang === 'java' || lang === 'kotlin') return [{ value: 'ktlint', label: 'ktlint / checkstyle', badge: 'recommended' }];
      return [
        { value: 'biome', label: 'Biome', description: 'ESLint + Prettier replacement, Rust, sangat cepat', badge: 'recommended' },
        { value: 'eslint-prettier', label: 'ESLint + Prettier', description: 'Standar JS/TS, banyak plugin', badge: 'popular' },
        { value: 'oxlint', label: 'Oxlint', description: 'Linter Rust, sangat cepat, belum full coverage', badge: 'experimental' },
        { value: 'none', label: 'Tanpa linter' },
      ];
    },
  },

  {
    id: 'testing',
    group: 'Tooling',
    step: 30,
    type: 'multi',
    prompt: 'Testing setup:',
    skipIf: isExtend,
    default: (answers) => isMVP(answers) ? ['unit'] : ['unit', 'e2e'],
    options: (answers) => {
      const lang = answers['language'] as string;
      if (lang === 'python') return [
        { value: 'pytest', label: 'Pytest (unit + integration)', badge: 'recommended' },
        { value: 'none', label: 'Skip testing setup' },
      ];
      if (lang === 'go') return [
        { value: 'go-test', label: 'Go testing (built-in)', badge: 'recommended' },
        { value: 'none', label: 'Skip' },
      ];
      if (['react-native-expo', 'react-native-bare'].includes(answers['frontend_framework'] as string)) return [
        { value: 'jest', label: 'Jest (unit)', badge: 'popular' },
        { value: 'detox', label: 'Detox (E2E mobile)', badge: 'experimental' },
        { value: 'none', label: 'Skip testing' },
      ];
      return [
        { value: 'unit', label: 'Vitest (unit + integration)', badge: 'recommended' },
        { value: 'e2e', label: 'Playwright (E2E browser)', badge: 'recommended' },
        { value: 'component', label: 'Testing Library (component)', badge: 'popular' },
        { value: 'storybook', label: 'Storybook (component dev + docs)' },
        { value: 'none', label: 'Skip testing setup' },
      ];
    },
  },

  // ══════════════════════════════════════════════════════════════
  // GROUP 12 — FINAL CONFIRM
  // ══════════════════════════════════════════════════════════════
  {
    id: '_confirm',
    group: 'Confirm',
    step: 31,
    type: 'confirm',
    prompt: 'Stack sudah sesuai? Generate project sekarang?',
    hint: 'Kamu bisa review semua pilihan di atas sebelum konfirmasi.',
    required: true,
  },
];

export default QUESTIONS;
