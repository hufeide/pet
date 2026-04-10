# Frontend State Management

> State management patterns for the AI Pet renderer process.

---

## Overview

This project uses **Pinia** as the state management library for Vue 3.

---

## Current State

The `renderer.ts` file initializes Pinia:

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

---

## Pinia Store Pattern

### Store File Organization

```typescript
// src/store/pet.ts - Pet state
// src/store/chat.ts - Chat history
// src/store/config.ts - API configuration
// src/store/index.ts - Store exports
```

### Store Template

```typescript
// src/store/pet.ts
import { defineStore } from 'pinia';

interface PetState {
  id: string;
  name: string;
  level: number;
  experience: number;
  形态: string;
  personality: string[];
  stats: {
    happiness: number;
    hunger: number;
    health: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const usePetStore = defineStore('pet', {
  state: (): PetState => ({
    id: 'default',
    name: 'Pet',
    level: 1,
    experience: 0,
    形态: 'basic',
    personality: ['friendly'],
    stats: {
      happiness: 100,
      hunger: 100,
      health: 100,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  
  getters: {
    isHappy: (state) => state.stats.happiness > 70,
    levelName: (state) => `Level ${state.level}`,
    canEvolve: (state) => state.experience >= state.level * 100,
  },
  
  actions: {
    updateStats(updates: Partial<PetState['stats']>) {
      this.stats = { ...this.stats, ...updates };
      this.updatedAt = new Date().toISOString();
    },
    
    gainExperience(amount: number) {
      this.experience += amount;
      if (this.experience >= this.level * 100) {
        this.level++;
        this.experience = 0;
      }
    },
    
    changeForm(新形态: string) {
      this.形态 = 新形态;
      this.updatedAt = new Date().toISOString();
    },
    
    addPersonality(trait: string) {
      if (!this.personality.includes(新trait)) {
        this.personality.push(新trait);
      }
    },
  },
});
```

---

## Multiple Stores Pattern

### Pet Store (src/store/pet.ts)
- Pet profile and stats
- 形态 and personality
- Level and experience

### Chat Store (src/store/chat.ts)
- Chat history
- Current conversation
- Message queue

### Config Store (src/store/config.ts)
- API configurations
- Selected LLM provider
- API keys and endpoints

---

## Store Actions Pattern

```typescript
// src/store/pet.ts
export const usePetStore = defineStore('pet', {
  // ... state, getters
  
  actions: {
    // Interaction actions
    interact() {
      this.stats.happiness = Math.min(100, this.stats.happiness + 5);
    },
    
    feed() {
      this.stats.hunger = Math.min(100, this.stats.hunger + 10);
      this.gainExperience(5);
    },
    
    playMiniGame(score: number) {
      this.stats.happiness = Math.min(100, this.stats.happiness + score);
      this.gainExperience(score * 2);
    },
    
    // Evolution actions
    evolve(新形态: string) {
      this.形态 = 新形态;
      this.level++;
      this.experience = 0;
    },
    
    // API integration
    async chatWithAI(messages: ChatMessage[]) {
      const llmClient = new LLMClient(this.config);
      const response = await llmClient.chat(messages);
      
      this.chatHistory.push({
        role: 'assistant',
        content: response,
      });
      
      this.gainExperience(10);
      return response;
    },
  },
});
```

---

## Sync with Database

```typescript
// src/store/pet.ts
import { usePetDB } from '../db/pet';

export const usePetStore = defineStore('pet', {
  // ... state, getters, actions
  
  actions: {
    async loadFromDB() {
      const petData = await getPet(this.id);
      if (petData) {
        this.$patch(petData);
      }
    },
    
    async saveToDB() {
      await updatePet({
        id: this.id,
        ...this.$state,
      });
    },
  },
});
```

---

## Reactivity Best Practices

### Use Store Actions for State Changes
```typescript
// Good
store.increaseStat('happiness', 10);

// Bad
store.stats.happiness += 10;
```

### Use Getters for Derived State
```typescript
// Good
computed(() => store.isHappy);

// Bad
computed(() => store.stats.happiness > 70);
```

### Use $patch for Multiple Updates
```typescript
// Good
store.$patch({
  stats: { ...store.stats, happiness: 100 },
  level: store.level + 1,
});

// Bad
store.stats.happiness = 100;
store.level = store.level + 1;
```

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| Direct DOM manipulation | Vue reactivity handles UI updates |
| Storing DOM elements in state | Breaks reactivity, memory leaks |
| Complex logic in components | Move to store actions |
| No error handling in actions | Store should handle errors |

---

## Related Guides

- [Directory Structure](./directory-structure.md) - Store file organization
- [Type Safety](./type-safety.md) - TypeScript types for stores
