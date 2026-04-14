# Frontend Quality Guidelines

> Code standards, testing, and quality checks for the AI Pet project.

---

## Overview

This project uses:
- **ESLint** for linting
- **TypeScript** for type checking
- **Vue 3** with **Pinia** for state management
- **Vite** for building

---

## Quality Checklist

Before committing code:

- [ ] Lint checks pass (`npm run lint`)
- [ ] Type checks pass (`npx tsc --noEmit`)
- [ ] Manual testing passes
- [ ] No console errors in DevTools
- [ ] Pet status display is consistent across all tabs (4 needs: ⚡ 能量, 🎾 玩耍, ❤️ 爱意, 📚 知识)

---

## Linting

### Configuration

```json
{
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/electron",
    "plugin:import/typescript",
    "plugin:vue/vue3-recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "parser": "@typescript-eslint/parser"
  }
}
```

### Run Lint

```bash
npm run lint
```

### Key Rules

- ES6+ features allowed
- Node.js APIs allowed in main/preload
- Browser APIs allowed in renderer
- Import rules enforce proper module usage
- Vue component rules enforced

---

## Type Checking

### Run Type Check

```bash
npx tsc --noEmit
```

### Strict Mode

The project has `"noImplicitAny": true` - avoid using `any` type.

---

## Testing

### Test Frameworks

| Framework | Purpose | Command |
|-----------|---------|---------|
| Vitest | Unit tests for stores, utils | `npm run test` |
| Playwright | E2E UI tests | `npm run test:e2e` |

### Running Tests

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test && npm run test:e2e
```

### Test Coverage

- **Unit Tests**: Store logic, game mechanics, state management (28 tests)
- **E2E Tests**: UI navigation, user interactions, AI responses (25 tests)

### Test File Structure

```
src/
├── __tests__/
│   ├── stores/
│   │   ├── chat.test.ts
│   │   └── pet-kingdom.test.ts
│   └── utils/
│       └── store-mocks.ts
tests/
└── e2e/
    ├── chat.test.ts
    ├── game.test.ts
    ├── paradise.test.ts
    └── ultimate.test.ts
```

### Test File Structure

```
src/
├── store/
│   ├── pet.test.ts
│   └── config.test.ts
└── components/
    └── Pet.test.ts
```

### Test Examples

```typescript
// src/store/pet.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { usePetStore } from './pet';

describe('Pet Store', () => {
  let store: ReturnType<typeof usePetStore>;

  beforeEach(() => {
    store = usePetStore();
    store.$reset();
  });

  it('should initialize with default values', () => {
    expect(store.level).toBe(1);
    expect(store.experience).toBe(0);
    expect(store.形态).toBe('basic');
  });

  it('should gain experience', () => {
    store.gainExperience(50);
    expect(store.experience).toBe(50);
    expect(store.level).toBe(1);

    store.gainExperience(50);
    expect(store.level).toBe(2);
  });

  it('should update stats', () => {
    store.updateStats({ happiness: 50 });
    expect(store.stats.happiness).toBe(50);
  });
});
```

```typescript
// src/components/Pet.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import Pet from '../components/Pet.vue';

describe('Pet Component', () => {
  it('displays pet name and level', () => {
    const wrapper = mount(Pet, {
      props: {
        pet: {
          id: '1',
          name: 'TestPet',
          level: 5,
          形态: 'basic',
          personality: ['friendly'],
          stats: { happiness: 100, hunger: 100, health: 100, energy: 100 },
          inventory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    expect(wrapper.text()).toContain('TestPet');
    expect(wrapper.text()).toContain('Level 5');
  });
});
```

---

## Code Style

### Formatting

- Use 2-space indentation (Vite default)
- Use single quotes for strings
- Use semicolons (consistent with project ESLint)
- Follow Vue 3 composition API

### Import Order

1. Node.js built-in modules
2. Electron modules
3. Vue imports
4. Pinia stores
5. Project modules
6. CSS/assets

### File Size

- Keep files under 300 lines when possible
- Extract reusable code to separate files

---

## Vue Component Standards

### Single File Component Structure

```vue
<template>
  <!-- Template content -->
</template>

<script setup lang="ts">
// Script content
</script>

<style scoped>
/* Scoped styles */
</style>
```

### Component Naming

- Use PascalCase: `PetDisplay.vue`, `ChatInterface.vue`
- Use descriptive names: `PetFormSelector.vue`, `StatBar.vue`

### Prop Types

```typescript
// Good
defineProps<{
  pet: Pet;
  showStats?: boolean;
}>();

// Bad
defineProps<{
  pet: any;
  showStats?: any;
}>();
```

---

## API Client Standards

### Error Handling

```typescript
// src/api/llm.ts
export class LLMClient {
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('LLM API call failed:', error);
      throw new Error(`Failed to get response: ${error}`);
    }
  }
}
```

### Config Validation

```typescript
// src/store/config.ts
export const useConfigStore = defineStore('config', {
  actions: {
    setConfig(config: LLMAPIConfig) {
      // Validate required fields
      if (!config.baseUrl) {
        throw new Error('API base URL is required';
      }
      if (!config.apiKey) {
        throw new Error('API key is required');
      }
      if (!config.model) {
        throw new Error('Model name is required');
      }
      
      // Validate URL format
      try {
        new URL(config.baseUrl);
      } catch {
        throw new Error('Invalid API base URL format');
      }
      
      this.config = config;
    },
  },
});
```

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| Console logs in production | Use proper logging |
| `debugger` statements | Leaves breakpoints in prod |
| Large single files | Hard to maintain |
| Inline configuration | Use config files |
| No error handling | App crashes on errors |
| Direct DOM manipulation | Vue reactivity handles UI |

---

## Performance Guidelines

### Vue Optimization

```vue
<!-- Good: Use computed properties -->
<template>
  <div>{{ formattedPetLevel }}</div>
</template>

<script setup lang="ts">
const formattedPetLevel = computed(() => `Level ${store.level}`);
</script>

<!-- Bad: Computation in template -->
<template>
  <div>{{ `Level ${store.level}` }}</div>
</template>
```

### List Rendering

```vue
<!-- Good: Use key prop -->
<template>
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</template>

<!-- Bad: No key prop -->
<template>
  <div v-for="item in items">
    {{ item.name }}
  </div>
</template>
```

---

## Related Guides

- [Directory Structure](./directory-structure.md) - File organization
- [Component Guidelines](./component-guidelines.md) - Component patterns
- [State Management](./state-management.md) - Store patterns
