# Loforger CLI - Design Specification

**Version**: 1.0.0  
**Date**: 2026-04-05  
**Author**: Craftly Product Team  
**Status**: Draft - Pending Review

---

## 1. Executive Summary

Loforger is an interactive CLI tool for scaffolding modern web projects. Unlike traditional scaffolding tools that use static templates, Loforger employs a dynamic questionnaire system that guides users through stack selection while providing real-time compatibility checking and intelligent defaults.

**Key Differentiators:**
- Conversational terminal UI (not just command flags)
- Real-time compatibility engine prevents bad stack combinations
- Context7 integration ensures templates use latest library APIs
- Three modes: MVP (fast), Production (complete), Extend (add features)
- Template database with community contribution support

---

## 2. Goals & Success Criteria

### Primary Goals
1. Reduce project setup time from hours to minutes
2. Prevent common configuration mistakes through validation
3. Support beginners and experienced developers equally
4. Keep templates current with latest library versions

### Success Metrics
- User completes questionnaire in under 5 minutes
- Generated project runs without errors on first `npm install && npm run dev`
- Zero known security vulnerabilities in production mode templates
- Template updates propagated within 48 hours of library releases

---

## 3. Architecture

### 3.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Loforger CLI                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────────┐ │
│  │  CLI Layer  │◄────►│ Questionnaire│◄────►│  File Generator │ │
│  │  (Ink UI)   │      │   Engine     │      │  (Handlebars)   │ │
│  └─────────────┘      └──────────────┘      └─────────────────┘ │
│         │                    │                     │            │
│         ▼                    ▼                     ▼            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Core Services                          │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Compatibility│  │   Context7   │  │  Template DB   │  │  │
│  │  │   Engine     │  │   Fetcher    │  │  (JSON/YAML)   │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Details

#### 3.2.1 CLI Layer (Ink-based)
- **Technology**: Ink (React for terminals) + Pastel (framework)
- **Responsibilities**:
  - Render interactive questionnaire UI
  - Handle keyboard navigation (arrow keys, Enter, Escape)
  - Display real-time compatibility warnings
  - Show progress indicators and flow preview
  - Render final summary before generation

#### 3.2.2 Questionnaire Engine
- **Technology**: TypeScript with functional state management
- **Responsibilities**:
  - Evaluate skip conditions based on current answers
  - Resolve dynamic options (e.g., language options depend on platform)
  - Calculate default values contextually
  - Execute post-hooks (e.g., auto-set database when BaaS selected)
  - Manage answer history for back navigation

#### 3.2.3 Compatibility Engine
- **Technology**: Rule-based evaluator with JSON rule definitions
- **Responsibilities**:
  - Evaluate 15+ compatibility rules (see Appendix A)
  - Categorize issues: ERROR (blocking), WARNING (proceed with caution), INFO (FYI)
  - Provide specific suggestions for fixing issues
  - Update rules without code changes (hot-swappable rules file)

#### 3.2.4 Context7 Fetcher
- **Technology**: HTTP client with caching layer
- **Responsibilities**:
  - Query Context7 API for library documentation
  - Extract relevant sections based on template needs
  - Cache documentation locally (TTL: 24 hours)
  - Fallback to static docs when Context7 unavailable

#### 3.2.5 Template Database
- **Technology**: JSON/YAML files with Handlebars templating
- **Responsibilities**:
  - Store parameterized file templates
  - Define folder structures per stack
  - Support conditional file generation
  - Enable community contributions via PR

#### 3.2.6 File Generator
- **Technology**: Node.js fs + Handlebars templating
- **Responsibilities**:
  - Create folder structure
  - Render templates with user answers
  - Write files to disk
  - Run post-generation commands (npm install, etc.)
  - Display next steps to user

---

## 4. User Experience Flow

### 4.1 Entry Points

```bash
# Interactive mode (default)
npx loforger create
loforger create

# Quick start with preset
loforger create --preset nextjs-supabase-mvp

# List available presets
loforger list-presets

# Non-interactive with flags
loforger create --mode mvp --platform web --frontend nextjs --database supabase

# Extend existing project
loforger extend --feature auth
```

### 4.2 Questionnaire Flow

```
[Preset Selection] → [Mode Selection] → [Project Info] → [Platform] → 
[Workspace Structure] → [Language & Runtime] → [Frontend] → [Backend] → 
[Database] → [Auth] → [Add-ons] → [Infrastructure] → [Tooling] → 
[Summary & Confirm] → [Generate]
```

**Dynamic Behavior:**
- Skip frontend questions for API-only projects
- Skip Docker questions for MVP mode
- Auto-suggest Next.js API Routes when Next.js frontend selected
- Show/hide mobile-specific options based on platform choice

### 4.3 UI States

**Question Card:**
- Group label (e.g., "PROJECT MODE")
- Prompt text
- Optional hint text
- Options grid (single-select or multi-select)
- Navigation buttons (Back, Skip, Next)
- Compatibility warning box (if applicable)
- Flow preview (upcoming questions)

**Summary Screen:**
- Grouped answer display
- Compatibility issues list
- Edit button to return to questionnaire
- Generate button (disabled if blocking errors)

---

## 5. Data Models

### 5.1 Question Schema

```typescript
interface Question {
  id: string;
  group: string;
  step: number;
  type: 'single' | 'multi' | 'text' | 'confirm';
  prompt: string;
  hint?: string;
  options?: Option[] | ((answers: Answers) => Option[]);
  default?: AnswerValue | ((answers: Answers) => AnswerValue);
  skipIf?: (answers: Answers) => boolean;
  validate?: (value: AnswerValue, answers: Answers) => string | null;
  postHook?: (value: AnswerValue, answers: Answers) => Partial<Answers>;
  required?: boolean;
}

interface Option {
  value: string;
  label: string;
  description?: string;
  badge?: 'recommended' | 'popular' | 'experimental' | 'legacy' | 'new';
  isCustom?: boolean;
}
```

### 5.2 Stack Profile Output

```typescript
interface StackProfile {
  meta: {
    generated_at: string;
    schema_version: string;
  };
  profile: {
    id: string;
    name: string;
    description: string;
    mode: 'mvp' | 'production' | 'extend';
    platform: string[];
    complexity: 'minimal' | 'standard' | 'full';
  };
  stack: {
    workspace: { type: string; config?: object };
    language: string[];
    runtime: string;
    package_manager: string;
    frontend: {
      framework: string;
      ui_library: string;
      state_management: string;
      styling: string[];
    };
    backend: {
      framework: string;
      api_style: string[];
    };
    database: {
      primary: string;
      orm: string;
      migrations: boolean;
      seeder: boolean;
    };
    auth: {
      provider: string;
      methods: string[];
      rbac: boolean;
    };
    infra: {
      hosting: string;
      containerization: string[];
      ci_cd: string;
    };
    tooling: {
      linter: string;
      testing: {
        unit: string;
        e2e: string;
        component: string;
      };
      monitoring: string[];
    };
    addons: {
      payment: string;
      email: string;
      file_storage: string;
      queue: string;
    };
  };
  context7_targets: Array<{
    name: string;
    context7_id: string;
    topics: string[];
  }>;
}
```

### 5.3 Compatibility Rule Schema

```typescript
interface CompatibilityRule {
  id: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  check: (answers: Answers) => boolean;
  reason: string;
  suggestion: string;
  affectedKeys: string[];
}
```

---

## 6. Template System

### 6.1 Template Structure

```
templates/
├── nextjs-supabase-mvp/
│   ├── template.json          # Template metadata
│   ├── files/
│   │   ├── package.json.hbs   # Handlebars template
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx.hbs
│   │   │   │   ├── page.tsx
│   │   │   │   └── globals.css
│   │   │   └── lib/
│   │   │       └── utils.ts
│   │   └── prisma/
│   │       └── schema.prisma.hbs
│   └── scripts/
│       └── post-generate.sh   # Optional post-generation script
```

### 6.2 Template Manifest (template.json)

```json
{
  "id": "nextjs-supabase-mvp",
  "name": "Next.js + Supabase MVP",
  "description": "Fast SaaS starter with Next.js and Supabase",
  "tags": ["saas", "fullstack", "typescript"],
  "mode": "mvp",
  "requiredAnswers": {
    "frontend.framework": "nextjs",
    "database.primary": "supabase",
    "auth.provider": "supabase-auth"
  },
  "files": [
    {
      "path": "package.json",
      "template": "package.json.hbs",
      "condition": null
    },
    {
      "path": "docker-compose.yml",
      "template": "docker-compose.yml",
      "condition": "stack.infra.containerization.includes('docker')"
    }
  ],
  "postGenerate": {
    "commands": [
      "npm install",
      "npx prisma generate"
    ],
    "instructions": [
      "Copy .env.example to .env.local and fill in your Supabase credentials",
      "Run 'npm run db:push' to sync database schema"
    ]
  }
}
```

### 6.3 Handlebars Helpers

- `{{kebabCase projectName}}` - Convert to kebab-case
- `{{eq a b}}` - Equality check for conditionals
- `{{includes arr value}}` - Array includes check
- `{{json obj}}` - JSON stringify
- `{{#if (eq mode 'production')}}...{{/if}}` - Conditional blocks

---

## 7. Compatibility Rules

### 7.1 Error-Level Rules (Blocking)

| ID | Condition | Reason | Suggestion |
|----|-----------|--------|------------|
| lang-ts-dart | TypeScript + Flutter | Different ecosystems | Choose one ecosystem |
| firebase-prisma | Firestore + Prisma | Prisma is SQL-only | Use Firebase SDK or PostgreSQL |
| nextauth-non-nextjs | NextAuth without Next.js | Framework-specific | Use Lucia or Clerk |
| trpc-non-ts | tRPC + JavaScript | Requires TypeScript | Switch to TypeScript or use REST |

### 7.2 Warning-Level Rules

| ID | Condition | Reason | Suggestion |
|----|-----------|--------|------------|
| nextjs-laravel | Next.js + Laravel | Two servers, two languages | Use Next.js API Routes or Laravel + Inertia |
| sqlite-production | SQLite + Production mode | Poor concurrent write support | Use PostgreSQL |
| kubernetes-mvp | K8s + MVP mode | Overkill for early stage | Use Vercel/Railway |
| nx-small-project | Nx + Minimal complexity | High learning curve | Use Turborepo or single app |

---

## 8. Context7 Integration

### 8.1 Library Mapping

When user selects certain stacks, fetch docs for:

| Stack Component | Context7 ID | Topics to Fetch |
|----------------|-------------|-----------------|
| Next.js | /vercel/next.js | app-router, server-actions, middleware |
| Prisma | /prisma/prisma | schema, migration, client-setup |
| Supabase | /supabase/supabase | auth, server-side-auth, ssr |
| tRPC | /trpc/trpc | routers, procedures, middleware |
| FastAPI | /tiangolo/fastapi | routing, dependencies, security |

### 8.2 Caching Strategy

- Cache documentation locally in `~/.loforger/cache/context7/`
- TTL: 24 hours
- Key: `{library_id}_{topic_hash}.json`
- Fallback to static embedded docs if Context7 unavailable

---

## 9. CLI Commands

### 9.1 Command Reference

| Command | Description | Options |
|---------|-------------|---------|
| `create` | Start interactive questionnaire | `--preset`, `--mode`, `--non-interactive` |
| `list-presets` | Show available presets | `--filter`, `--tags` |
| `validate` | Check existing project | `--fix` |
| `extend` | Add feature to existing project | `--feature`, `--dry-run` |
| `config` | Manage configuration | `--set`, `--get`, `--reset` |
| `update` | Update templates and rules | `--check`, `--force` |

### 9.2 Configuration File

Location: `~/.loforger/config.json`

```json
{
  "defaults": {
    "language": "typescript",
    "package_manager": "pnpm",
    "author_name": "Your Name"
  },
  "templates_source": "https://github.com/craftly/loforger-templates",
  "context7_enabled": true,
  "telemetry_enabled": false
}
```

---

## 10. Development Phases

### Phase 1: Core CLI (Weeks 1-2)
- [ ] Project scaffolding with TypeScript
- [ ] Ink-based UI components
- [ ] Questionnaire engine with skip logic
- [ ] Basic compatibility rules (5-10 rules)
- [ ] 3 starter templates (Next.js+Supabase, NestJS+Prisma, FastAPI)

### Phase 2: Template System (Weeks 3-4)
- [ ] Handlebars template engine
- [ ] Template database structure
- [ ] File generator with conditional logic
- [ ] Post-generation scripts
- [ ] 10+ production-ready templates

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Full compatibility rule set (15+ rules)
- [ ] Context7 integration
- [ ] Preset system
- [ ] Extend mode for existing projects
- [ ] Configuration management

### Phase 4: MCP Server (Week 7+)
- [ ] Extract core engine as reusable package
- [ ] MCP server implementation
- [ ] Claude Code integration
- [ ] Shared template database

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Questionnaire engine logic
- Compatibility rule evaluation
- Template rendering

### 11.2 Integration Tests
- End-to-end CLI flow
- File generation for each template
- Context7 API integration

### 11.3 E2E Tests
- Full project generation
- Generated project runs successfully
- No security vulnerabilities (npm audit)

---

## 12. Security Considerations

1. **Template Safety**: All templates scanned for malicious code before inclusion
2. **Dependency Management**: Auto-run `npm audit` post-generation
3. **Environment Variables**: Never commit secrets, always use .env.example pattern
4. **Network**: HTTPS only for Context7 and template downloads

---

## 13. Non-Goals

To maintain focus, the following are explicitly out of scope for v1.0:

- GUI/web interface (CLI only)
- Cloud deployment automation (provide configs only)
- Database migration generation (document only)
- IDE plugins (future consideration)
- Real-time collaboration

---

## 14. Appendix A: Full Compatibility Rules List

See `docs/compatibility-rules.json` for complete rule definitions.

---

## 15. Appendix B: Template Inventory

### MVP Templates
1. `nextjs-supabase-mvp` - Next.js + Supabase SaaS starter
2. `nestjs-postgres-mvp` - NestJS API with PostgreSQL
3. `fastapi-sqlite-mvp` - FastAPI with SQLite
4. `flutter-supabase-mvp` - Flutter mobile + Supabase
5. `vite-react-tailwind-mvp` - Simple SPA starter

### Production Templates
1. `nextjs-supabase-production` - Full SaaS with monitoring
2. `turborepo-fullstack-production` - Monorepo with shared packages
3. `nestjs-microservices-production` - Microservices architecture

---

## 16. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-05 | Initial specification |

---

**Review Status**: Pending  
**Next Step**: Implementation planning via `writing-plans` skill
