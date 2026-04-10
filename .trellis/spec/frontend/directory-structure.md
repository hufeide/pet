# Frontend Directory Structure

> Project structure for the AI Pet Electron renderer process (frontend).

---

## Overview

This is an **Electron + Vite + Vue 3 + TypeScript** application:

```
src/
├── main.ts            # Electron main process entry
├── preload.ts         # Electron preload script (bridge)
├── renderer.ts        # Vue 3 app entry point
└── index.css          # Global styles
```

---

## File Organization

### main.ts
- **Purpose**: Electron main process logic
- **Contents**: BrowserWindow creation, app lifecycle, API handling
- **Imports**: Electron APIs, native Node.js modules

### preload.ts
- **Purpose**: Security bridge between main and renderer
- **Contents**: Context bridge configuration, IPC handlers
- **Best Practice**: Expose only what renderer needs via `window.api`

### renderer.ts
- **Purpose**: Vue 3 application entry
- **Contents**: App mounting, store setup, global configuration
- **Imports**: CSS, Vue app, Pinia stores

### index.css
- **Purpose**: Global styles
- **Contents**: Base styles, CSS variables, resets

---

## Frontend Code Structure (Vue 3)

```
src/
├── api/               # API clients
│   ├── llm.ts        # LLM API client (OpenAI-compatible)
│   └── image.ts      # Image generation API
├── db/               # SQLite database
│   ├── schema.ts     # Database schema
│   ├── pet.ts        # Pet data access
│   └── chat.ts       # Chat history access
├── store/            # Pinia stores
│   ├── pet.ts        # Pet state
│   ├── chat.ts       # Chat history
│   ├── config.ts     # API configuration
│   └── index.ts      # Store exports
├── components/       # Vue components
│   ├── Pet.vue       # SVG pet display
│   ├── Chat.vue      # Chat interface
│   ├── Config.vue    # API config UI
│   ├── Avatar.vue    # Avatar selection
│   └── Layout.vue    # Main layout
└── types/            # TypeScript types
    ├── api.d.ts      # API type definitions
    ├── pet.d.ts      # Pet data types
    └── index.ts      # Type exports
```

---

## Code Patterns

### Typical renderer.ts Pattern

```typescript
// src/renderer.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './index.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');
```

**Pattern**: Create Pinia store, mount Vue app to `#app` element.

### API Client Pattern

```typescript
// src/api/llm.ts
import axios from 'axios';

export class LLMClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: LLMAPIConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/chat/completions`, {
      messages,
      model: this.model,
    });
    return response.data.choices[0].message.content;
  }
}
```

**Pattern**: OpenAI-compatible API client with configurable endpoint.

### SQLite Pattern

```typescript
// src/db/pet.ts
import Database from 'better-sqlite3';

const db = new Database('data/pet.db');

export function getPet(id: string) {
  return db.prepare('SELECT * FROM pets WHERE id = ?').get(id);
}

export function updatePet(pet: Pet) {
  return db.prepare('UPDATE pets SET ...').run(pet);
}
```

**Pattern**: Synchronous SQLite operations for simplicity.

---

## SVG Component Pattern

```vue
<!-- src/components/Pet.vue -->
<template>
  <svg viewBox="0 0 100 100" class="pet">
    <g :class="['body', pet形态]">
      <!-- Pet body parts -->
    </g>
    <g :class="['accessory', currentOutfit]">
      <!-- Outfit parts -->
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
 形态: string;
  outfit: string;
}>();

const currentOutfit = computed(() => `outfit-${props.outfit}`);
</script>
```

**Pattern**: Dynamic SVG classes for pet形态变化.

---

## Pinia Store Pattern

```typescript
// src/store/pet.ts
import { defineStore } from 'pinia';

interface PetState {
  id: string;
  name: string;
  level: number;
  personality: string[];
 形态: string;
  stats: {
    happiness: number;
    hunger: number;
    health: number;
  };
}

export const usePetStore = defineStore('pet', {
  state: (): PetState => ({
    id: 'default',
    name: 'Pet',
    level: 1,
    personality: ['friendly'],
   形态: 'basic',
    stats: {
      happiness: 100,
      hunger: 100,
      health: 100,
    },
  }),
  getters: {
    isHappy: (state) => state.stats.happiness > 70,
  },
  actions: {
    increaseStat(stat: keyof PetState['stats'], amount: number) {
      this[stat] = Math.min(100, this[stat] + amount);
    },
  },
});
```

**Pattern**: Pinia stores for pet state management.

---

## Type Organization

```typescript
// src/types/api.d.ts
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMAPIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

// src/types/pet.d.ts
export interface Pet {
  id: string;
  name: string;
  level: number;
  experience: number;
 形态: string;
  personality: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## Import Conventions

- Use absolute imports from project root
- CSS imports go in `renderer.ts` and component styles
- Use `path` module for file paths in main process
- API clients in `src/api/`, database in `src/db/`

---

## Vite Configuration

Vite builds are configured via `forge.config.ts`:

```typescript
plugins: [
  new VitePlugin({
    build: [
      {
        entry: 'src/main.ts',
        config: 'vite.main.config.ts',
        target: 'main',
      },
      {
        entry: 'src/preload.ts',
        config: 'vite.preload.config.ts',
        target: 'preload',
      },
    ],
    renderer: [
      {
        name: 'main_window',
        config: 'vite.renderer.config.ts',
      },
    ],
  }),
],
```

**Key Points**:
- Main and preload use separate Vite configs
- Renderer is configured as a named entry (`main_window`)
- All configs are in the project root

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| Direct `require` in renderer | Use ES imports for tree-shaking |
| Inline styles | Use CSS modules or classes for maintainability |
| Large renderer.ts | Keep renderer.ts minimal, extract to stores |
| Direct DOM manipulation | Use Vue's reactivity system |

---

## Related Guides

- [Component Guidelines](./component-guidelines.md) - Vue component patterns
- [Type Safety](./type-safety.md) - TypeScript conventions
- [State Management](./state-management.md) - Pinia store patterns
