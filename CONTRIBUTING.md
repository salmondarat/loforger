# Contributing to Loforger

Thank you for your interest in contributing to Loforger!

## Development Setup

1. Fork and clone the repository
2. Run `npm install` to install dependencies
3. Run `npm test` to ensure tests pass
4. Run `npm run build` to compile TypeScript

## Project Structure

```
loforger/
├── src/
│   ├── types/          # TypeScript type definitions
│   ├── engine/         # Questionnaire and compatibility engines
│   ├── cli/            # CLI components and commands
│   ├── templates/      # Template loading and generation
│   └── data/           # Questions and compatibility rules
├── templates/          # Project templates
├── tests/              # Test suite
└── docs/               # Documentation
```

## Adding Templates

To add a new template:

1. Create a directory in `templates/<template-id>/`
2. Add `manifest.json` with template metadata
3. Add template files in `files/` directory using Handlebars syntax
4. Test with `node dist/index.js create`

### Template Manifest Format

```json
{
  "id": "my-template",
  "name": "My Template",
  "description": "Description of what this template creates",
  "mode": "mvp",
  "files": [
    {
      "path": "package.json",
      "template": "package.json.hbs"
    }
  ]
}
```

## Adding Compatibility Rules

To add a new compatibility rule:

1. Edit `src/data/compatibility-rules.ts`
2. Add a new rule object with:
   - `id`: Unique identifier
   - `severity`: 'error', 'warning', or 'info'
   - `title`: Human-readable title
   - `check`: Function that returns true if issue detected
   - `reason`: Explanation of why this is an issue
   - `suggestion`: How to fix it
   - `affectedKeys`: Array of question IDs affected

Example:

```typescript
{
  id: 'my-rule',
  severity: 'warning',
  title: 'Incompatible combination',
  check: (a) => a.framework === 'x' && a.database === 'y',
  reason: 'X framework does not work well with Y database',
  suggestion: 'Use Z database instead',
  affectedKeys: ['framework', 'database'],
}
```

## Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Write tests for new features
- Use Biome for linting and formatting

## Submitting Changes

1. Create a new branch for your feature
2. Make your changes with clear commit messages
3. Add tests for new functionality
4. Ensure all tests pass with `npm test`
5. Submit a pull request with a clear description

## Questions?

Feel free to open an issue for questions or discussion.
