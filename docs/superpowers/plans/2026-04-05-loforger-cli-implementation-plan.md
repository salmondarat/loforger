# Loforger CLI Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive CLI tool for scaffolding modern web projects with dynamic questionnaire, compatibility checking, and template generation.

**Architecture:** TypeScript/Node.js CLI using Ink (React for terminals) for UI, with modular engines for questionnaire flow, compatibility rules, and file generation.

**Tech Stack:** TypeScript, Ink (React terminal UI), Pastel (Ink framework), Handlebars (templating), Commander.js (CLI args), Vitest (testing)

---

## Project Structure

```
loforger/
├── src/
│   ├── types/
│   │   ├── questionnaire.ts
│   │   ├── stack-profile.ts
│   │   └── compatibility.ts
│   ├── engine/
│   │   ├── questionnaire-engine.ts
│   │   └── compatibility-engine.ts
│   ├── cli/
│   │   ├── components/
│   │   │   ├── App.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── OptionList.tsx
│   │   │   ├── SummaryView.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── commands/
│   │       └── create.tsx
│   ├── templates/
│   │   ├── template-loader.ts
│   │   └── file-generator.ts
│   ├── data/
│   │   ├── questions.ts
│   │   └── compatibility-rules.ts
│   └── index.tsx
├── templates/
│   └── nextjs-supabase-mvp/
├── tests/
│   ├── engine/
│   └── integration/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Phase 1: Core Foundation

### Task 1.1: Project Setup
**Files:** Create package.json, tsconfig.json, .gitignore

```json
// package.json
{
  "name": "loforger",
  "version": "0.1.0",
  "description": "Interactive CLI for scaffolding modern web projects",
  "type": "module",
  "bin": {
    "loforger": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc && chmod +x dist/index.js",
    "dev": "tsc --watch",
    "test": "vitest",
    "lint": "biome check src/"
  },
  "dependencies": {
    "ink": "^4.4.1",
    "pastel": "^2.0.0",
    "react": "^18.2.0",
    "commander": "^11.1.0",
    "handlebars": "^4.7.8",
    "fs-extra": "^11.2.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.43",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0",
    "biome": "^1.4.1"
  }
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Run: `npm install`
Commit: `git add . && git commit -m "chore: initial project setup"`

### Task 1.2: Type Definitions
**Files:** Create src/types/*.ts

Create questionnaire.ts, stack-profile.ts, compatibility.ts with interfaces from the design spec.

Commit: `git add src/types/ && git commit -m "feat: add type definitions"`

---

## Phase 2: Core Engines

### Task 2.1: Questionnaire Engine
**Files:** Create src/data/questions.ts, src/engine/questionnaire-engine.ts

Port the questions from docs/questionnaire-schema.ts (simplified set of 10 core questions).

Commit: `git add src/data/ src/engine/questionnaire-engine.ts && git commit -m "feat: implement questionnaire engine"`

### Task 2.2: Compatibility Engine  
**Files:** Create src/data/compatibility-rules.ts, src/engine/compatibility-engine.ts

Port 5-10 key rules from docs/compatibility-rules.json.

Commit: `git add src/data/compatibility-rules.ts src/engine/compatibility-engine.ts && git commit -m "feat: add compatibility engine"`

---

## Phase 3: CLI Interface

### Task 3.1: UI Components
**Files:** Create src/cli/components/*.tsx

Create:
- OptionList.tsx - Selectable options with keyboard navigation
- QuestionCard.tsx - Question display with hint text
- SummaryView.tsx - Final configuration review
- ProgressBar.tsx - Progress indicator

Commit: `git add src/cli/components/ && git commit -m "feat: add CLI UI components"`

### Task 3.2: Main App
**Files:** Create src/cli/components/App.tsx, src/cli/commands/create.tsx, src/index.tsx

Integrate engines with UI components. Add keyboard handling (Enter to continue, Esc to go back).

Commit: `git add src/cli/ src/index.tsx && git commit -m "feat: add main app and CLI entry point"`

---

## Phase 4: Template System

### Task 4.1: Template Loader & Generator
**Files:** Create src/templates/template-loader.ts, src/templates/file-generator.ts

Load manifest.json files and generate projects using Handlebars templates.

### Task 4.2: Sample Template
**Files:** Create templates/nextjs-supabase-mvp/manifest.json, package.json.hbs, README.md.hbs

Create a working MVP template for Next.js + Supabase.

Commit: `git add src/templates/ templates/ && git commit -m "feat: add template system with sample template"`

---

## Phase 5: Testing & Polish

### Task 5.1: Unit Tests
**Files:** Create tests/engine/*.test.ts

Test questionnaire flow, compatibility rules, and template loading.

### Task 5.2: Integration Test
**Files:** Create tests/integration/cli.test.ts

Test complete CLI flow from start to project generation.

Commit: `git add tests/ && git commit -m "test: add comprehensive test suite"`

### Task 5.3: Documentation
**Files:** Update README.md, create CONTRIBUTING.md, CHANGELOG.md

Write comprehensive documentation for users and contributors.

Commit: `git add README.md CONTRIBUTING.md CHANGELOG.md && git commit -m "docs: add documentation"`

---

## Execution Options

**Plan saved to:** `docs/superpowers/plans/2026-04-05-loforger-cli-implementation-plan.md`

Two execution approaches:

1. **Subagent-Driven (Recommended)** - I dispatch a fresh subagent per phase/task, review between tasks
2. **Inline Execution** - Execute tasks in this session using executing-plans skill

**Which approach would you prefer?**

Also:
- Should I start implementing immediately, or do you want to review/modify the plan first?
- Any specific templates or features you want prioritized?
