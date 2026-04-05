# Loforger

Interactive CLI for scaffolding modern web projects with best practices built-in.

## Features

- 🎯 **Interactive Questionnaire** - Guided setup with intelligent defaults
- 🔍 **Compatibility Checking** - Prevents bad stack combinations
- 📦 **Production-Ready Templates** - MVP and Production modes
- 🎨 **Beautiful Terminal UI** - Built with React and Ink
- ⚡ **Context7 Integration** - Always up-to-date with latest library APIs

## Installation

```bash
npm install -g loforger
```

Or use npx (no install required):

```bash
npx loforger create
```

## Quick Start

### Interactive Mode

```bash
loforger create
```

This launches an interactive questionnaire that guides you through:
- Project mode (MVP, Production, or Extend)
- Target platform (Web, Mobile, API)
- Frontend framework (Next.js, Nuxt, React Native, etc.)
- Backend framework (Next.js API, NestJS, Supabase, etc.)
- Database (PostgreSQL, SQLite, MongoDB, etc.)
- Authentication (Supabase Auth, Clerk, NextAuth, etc.)
- And more...

### Quick Start with Preset

```bash
loforger create --preset nextjs-supabase-mvp
```

Available presets:
- `nextjs-supabase-mvp` - Next.js + Supabase for rapid SaaS development
- `nestjs-postgres-mvp` - NestJS API with PostgreSQL

### List Presets

```bash
loforger list-presets
```

## Project Modes

### MVP Mode
Minimal setup optimized for rapid prototyping:
- Skip CI/CD, Docker, monitoring
- Use SQLite or simple databases
- Basic auth only
- Fastest path to a working prototype

### Production Mode
Full setup with enterprise best practices:
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Monitoring and observability
- Security hardening
- Comprehensive testing setup

### Extend Mode
Add features to existing projects:
- Authentication
- Payment integration
- File storage
- Background jobs
- Analytics

## Keyboard Controls

- **↑ / ↓** - Navigate options
- **Enter** - Select / Continue
- **Esc** - Go back to previous question
- **e** - Edit choices (on summary screen)

## Compatibility Warnings

Loforger checks your stack combinations and warns about:

**Errors (blocking):**
- NextAuth without Next.js
- Prisma with Firestore
- tRPC without TypeScript

**Warnings:**
- SQLite in production mode
- Next.js + Laravel (two ecosystems)
- Kubernetes for MVP

## Development

```bash
# Clone the repository
git clone <repo-url>
cd loforger

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run locally
node dist/index.js create
```

## Architecture

Loforger consists of several key components:

- **Questionnaire Engine** - Manages question flow, skip logic, and validation
- **Compatibility Engine** - Checks for bad stack combinations
- **Template System** - Loads and renders project templates
- **CLI Interface** - Ink-based React components for the terminal UI

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.

## License

MIT
