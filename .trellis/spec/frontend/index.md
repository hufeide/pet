# Frontend Development Guidelines

> Best practices for frontend development in the AI Pet project.

---

## Overview

This directory contains guidelines for frontend development. This project is an
**Electron + Vite + Vue 3 + TypeScript** application for an AI-driven pet game.

---

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization and file layout | ✅ Complete |
| [Component Guidelines](./component-guidelines.md) | Component patterns, props, composition | ✅ Complete |
| [Hook Guidelines](./hook-guidelines.md) | Vue 3 composables and hooks | ✅ Complete |
| [State Management](./state-management.md) | Pinia store patterns | ✅ Complete |
| [Quality Guidelines](./quality-guidelines.md) | Code standards, testing, linting | ✅ Complete |
| [Type Safety](./type-safety.md) | TypeScript conventions and types | ✅ Complete |
| [Game System](./game-system.md) | Adventure and social game specifications | ✅ Complete |

---

## Project Type

**Electron Application** - Desktop app with:
- Main process (`src/main.ts`)
- Preload script (`src/preload.ts`)
- Renderer process (`src/renderer.ts`) - Vue 3 app

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3 |
| State Management | Pinia |
| Type System | TypeScript |
| Build Tool | Vite |
| Database | SQLite (better-sqlite3) |
| Styling | CSS with scoped styles |

---

## Quick Start

1. Read [Directory Structure](./directory-structure.md) to understand file organization
2. For component work, read [Component Guidelines](./component-guidelines.md)
3. For state management, read [State Management](./state-management.md)
4. For TypeScript questions, read [Type Safety](./type-safety.md)
5. For code quality, read [Quality Guidelines](./quality-guidelines.md)

---

## Development Commands

```bash
# Start dev server
npm start

# Run lint
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run make

# Run tests
npm run test          # Unit tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

---

## Testing

### Test Frameworks

| Framework | Purpose | Command |
|-----------|---------|---------|
| Vitest | Unit tests for stores, utils | `npm run test` |
| Playwright | E2E UI tests | `npm run test:e2e` |

### Test Coverage

- **Unit Tests**: Store logic, game mechanics, state management (28 tests)
- **E2E Tests**: UI navigation, user interactions, AI responses (25 tests)

### Running Tests

```bash
# Run all tests
npm run test && npm run test:e2e
```

---

## API Configuration

The project supports multiple LLM APIs including:
- **Cloud APIs**: OpenAI, Anthropic, 通义千问, Kimi
- **Local APIs**: vLLM (OpenAI-compatible)

Configure API endpoints in the app's Config UI.

---

## Pet Features

| Feature | Description |
|---------|-------------|
| AI Chat | Conversation via LLM API |
| Multiple Personalities | Friendly, shy, aggressive, etc. |
| Evolution | Pet evolves based on experience |
| Form Changes | Appearance changes via API |
| Stats | Happiness, hunger, health, energy |

---

## Related Commands

| Command | When to Use |
|---------|-------------|
| `/trellis:start` | Begin a development session |
| `/trellis:brainstorm` | Plan new features |
| `/trellis:finish-work` | Before committing changes |

---

**Language**: All documentation should be written in **English**.
