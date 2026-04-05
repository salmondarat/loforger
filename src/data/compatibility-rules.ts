import type { CompatibilityRule } from '../types/index.js';

export const COMPATIBILITY_RULES: CompatibilityRule[] = [
  {
    id: 'nextjs-laravel',
    severity: 'warning',
    title: 'Next.js + Laravel - two different ecosystems',
    check: (a) => a.frontend_framework === 'nextjs' && a.backend_framework === 'laravel',
    reason: 'Next.js has built-in API Routes. Adding Laravel means managing two servers and two languages.',
    suggestion: 'Use Next.js API Routes for fullstack, or Laravel + Inertia.js for traditional fullstack.',
    affectedKeys: ['frontend_framework', 'backend_framework'],
  },
  {
    id: 'firebase-prisma',
    severity: 'error',
    title: 'Firestore incompatible with Prisma',
    check: (a) => a.database === 'firebase' && a.orm === 'prisma',
    reason: 'Prisma is a SQL ORM - it cannot work with Firestore (NoSQL document database).',
    suggestion: 'Use Firebase SDK directly, or switch to PostgreSQL to use Prisma.',
    affectedKeys: ['database', 'orm'],
  },
  {
    id: 'sqlite-production',
    severity: 'warning',
    title: 'SQLite not ideal for Production mode',
    check: (a) => a.database === 'sqlite' && a.mode === 'production',
    reason: 'SQLite does not handle concurrent writes well for multi-user production apps.',
    suggestion: 'Use PostgreSQL (Supabase, Neon, Railway) for production deployments.',
    affectedKeys: ['database', 'mode'],
  },
  {
    id: 'nextauth-non-nextjs',
    severity: 'error',
    title: 'NextAuth requires Next.js',
    check: (a) => a.auth_provider === 'nextauth' && a.frontend_framework !== 'nextjs',
    reason: 'NextAuth is designed specifically for Next.js ecosystem.',
    suggestion: 'Use Lucia Auth, Better Auth, or Clerk for non-Next.js frameworks.',
    affectedKeys: ['auth_provider', 'frontend_framework'],
  },
  {
    id: 'trpc-non-typescript',
    severity: 'error',
    title: 'tRPC requires TypeScript',
    check: (a) => {
      const apiStyle = a.api_style;
      const hasTrpc = Array.isArray(apiStyle) ? apiStyle.includes('trpc') : apiStyle === 'trpc';
      return hasTrpc && a.language === 'javascript';
    },
    reason: 'tRPC needs TypeScript for end-to-end type safety.',
    suggestion: 'Switch to TypeScript or use REST API instead.',
    affectedKeys: ['api_style', 'language'],
  },
  {
    id: 'firebase-selfhost',
    severity: 'warning',
    title: 'Firebase cannot be self-hosted',
    check: (a) => a.database === 'firebase' && a.hosting === 'self-hosted',
    reason: 'Firebase is a managed Google Cloud service - it cannot be self-hosted.',
    suggestion: 'Use Supabase self-hosted, PocketBase, or Appwrite for full self-hosting.',
    affectedKeys: ['database', 'hosting'],
  },
  {
    id: 'kubernetes-mvp',
    severity: 'warning',
    title: 'Kubernetes too complex for MVP',
    check: (a) => a.containerization === 'kubernetes' && a.mode === 'mvp',
    reason: 'Kubernetes is complex to set up and maintain for a solo dev or small team.',
    suggestion: 'Use Vercel/Railway/Render for hosted deployment, or Docker Compose for local dev.',
    affectedKeys: ['containerization', 'mode'],
  },
  {
    id: 'graphql-trpc-both',
    severity: 'warning',
    title: 'GraphQL and tRPC add unnecessary complexity together',
    check: (a) => {
      const apiStyle = a.api_style;
      if (!Array.isArray(apiStyle)) return false;
      return apiStyle.includes('graphql') && apiStyle.includes('trpc');
    },
    reason: 'Two different API layers for the same purpose adds complexity without clear benefit.',
    suggestion: 'Choose one: tRPC for simple fullstack TypeScript, or GraphQL for multiple API consumers.',
    affectedKeys: ['api_style'],
  },
];

export default COMPATIBILITY_RULES;
