# Changelog

All notable changes to Loforger will be documented in this file.
## [] - 1970-01-01


### Bug Fixes

- Trigger npm publish directly from release workflow


### Documentation

- Update changelog [skip release]

## [v0.2.6] - 2026-04-07


### Bug Fixes

- Correct git-cliff template variable and lint errors

## [v0.2.5] - 2026-04-07


### Bug Fixes

- Replace git-cliff-action Docker with direct binary install


### Miscellaneous

- Add biome.json linter config

## [v0.2.4] - 2026-04-07


### Features

- Fix file generation, add post-generation review, overhaul CI/CD, polish UI


### Miscellaneous

- Add .claude/ to .gitignore

- Stop tracking .claude/settings.local.json

## [v0.2.2] - 2026-04-06


### Bug Fixes

- Update build scripts to work around permission issues

- Add Escape key support for going back in questionnaire

- Use ref to track current value for Enter key in text input

- Add extend mode specific questions and fix progress bar calculation

- Remove npm test from prepublishOnly forNTFS compatibility

- Repair package.json for JSON syntax and version bump to 0.2.0


### Documentation

- Add comprehensive documentation


### Features

- Add core type definitions

- Implement questionnaire engine with dynamic questions

- Add compatibility engine with rule-based validation

- Add Ink-based CLI UI components

- Add main app and CLI entry point

- Add template loading and file generation system

- Add Next.js+Supabase MVP template

- Add spacebar selection and proper text input with live typing

- Improve UI with better styling, add exit confirmation, prevent continuing without selection, show detailed summary

- Make UI fully responsive and scalable to terminal size

- Add multi-platform support and installation scripts

- Cross-platform install with NTFS/FUSE auto-detection


### Miscellaneous

- Initial project setup

- Prepare for npm publishing - add license, files field, metadata

- Properly format docs and tests in .gitignore

- Bump version to 0.2.0

- Bump version 0.2.1

- Clean up temp files


### Styling

- Fix biome lint errors and code formatting


### Testing

- Add comprehensive test suite

