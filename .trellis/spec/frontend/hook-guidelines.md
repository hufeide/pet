# Frontend Hook Guidelines

> Custom hook patterns for the AI Pet renderer process.

---

## Overview

This project uses **Vue 3 Composition API** instead of React-style hooks.
All composables follow Vue conventions.

---

## Vue Composition API Patterns

### Using Composition API

```vue
<script setup lang="ts">
// Composition API is built into <script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);

onMounted(() => {
  console.log('Component mounted');
});

onUnmounted(() => {
  console.log('Component unmounted');
});
</script>
```

---

## Custom Composable Patterns

### File Structure

```
src/
└── composables/
    ├── usePet.ts           # Pet state composable
    ├── useChat.ts          # Chat functionality
    ├── useApi.ts           # API client setup
    └── useStorage.ts       # Local storage wrapper
```

### Composable Template

```typescript
// src/composables/usePet.ts
import { ref, computed } from 'vue';
import { usePetStore } from '../store/pet';

export function usePet() {
  const store = usePetStore();
  const loading = ref(false);

  const pet = computed(() => store.$state);
  const isHappy = computed(() => store.isHappy);

  async function interact() {
    loading.value = true;
    try {
      store.interact();
    } finally {
      loading.value = false;
    }
  }

  async function feed() {
    loading.value = true;
    try {
      store.feed();
    } finally {
      loading.value = false;
    }
  }

  async function evolve(newForm: string) {
    loading.value = true;
    try {
      store.evolve(newForm);
    } finally {
      loading.value = false;
    }
  }

  return {
    pet,
    isHappy,
    loading,
    interact,
    feed,
    evolve,
  };
}
```

### Using the Composable

```vue
<script setup lang="ts">
import { usePet } from '../composables/usePet';

const { pet, isHappy, interact, feed, evolve } = usePet();
</script>

<template>
  <div class="pet-display">
    <h2>{{ pet.name }}</h2>
    <p v-if="isHappy">😊 Pet is happy!</p>
    <button @click="interact">Interact</button>
    <button @click="feed">Feed</button>
  </div>
</template>
```

---

## Common Composables

### useChat - Chat Functionality

```typescript
// src/composables/useChat.ts
import { ref, shallowRef } from 'vue';
import { usePetStore } from '../store/pet';

export function useChat() {
  const store = usePetStore();
  const messages = shallowRef(store.chatHistory);
  const input = ref('');
  const isLoading = ref(false);

  async function sendMessage() {
    if (!input.value.trim()) return;
    
    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input.value,
      timestamp: new Date().toISOString(),
    };
    
    store.addMessage(userMessage);
    const currentInput = input.value;
    input.value = '';
    isLoading.value = true;
    
    try {
      await store.chatWithAI([userMessage]);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    messages,
    input,
    isLoading,
    sendMessage,
  };
}
```

### useApi - API Client Setup

```typescript
// src/composables/useApi.ts
import { ref, readonly } from 'vue';
import { useConfigStore } from '../store/config';
import { LLMClient, ImageClient } from '../api';

export function useApi() {
  const configStore = useConfigStore();
  const llmClient = ref<LLMClient | null>(null);
  const imageClient = ref<ImageClient | null>(null);
  const isReady = ref(false);

  function setupClients() {
    const config = configStore.config;
    
    llmClient.value = new LLMClient(config);
    imageClient.value = new ImageClient(config);
    
    isReady.value = true;
  }

  return {
    llmClient: readonly(llmClient),
    imageClient: readonly(imageClient),
    isReady,
    setupClients,
  };
}
```

### useStorage - Local Storage Wrapper

```typescript
// src/composables/useStorage.ts
import { ref, readonly } from 'vue';

type StorageType = 'local' | 'session';

export function useStorage(type: StorageType = 'local') {
  const storage = ref<Storage>(type === 'local' ? localStorage : sessionStorage);

  function setItem(key: string, value: unknown): void {
    storage.value.setItem(key, JSON.stringify(value));
  }

  function getItem<T>(key: string, defaultValue: T): T {
    const item = storage.value.getItem(key);
    return item ? JSON.parse(item) as T : defaultValue;
  }

  function removeItem(key: string): void {
    storage.value.removeItem(key);
  }

  return {
    setItem,
    getItem,
    removeItem,
  };
}
```

---

## Lifecycle Hook Patterns

### onMounted with Cleanup

```typescript
// src/composables/useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useWebSocket(url: string) {
  const socket = ref<WebSocket | null>(null);
  const isConnected = ref(false);

  onMounted(() => {
    socket.value = new WebSocket(url);
    
    socket.value.onopen = () => {
      isConnected.value = true;
    };
    
    socket.value.onclose = () => {
      isConnected.value = false;
    };
    
    socket.value.onmessage = (event) => {
      // Handle message
    };
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.close();
    }
  });

  return {
    isConnected,
    send: (data: unknown) => {
      if (socket.value && socket.value.readyState === WebSocket.OPEN) {
        socket.value.send(JSON.stringify(data));
      }
    },
  };
}
```

### watch Effect Pattern

```typescript
// src/composables/usePetSync.ts
import { watch } from 'vue';
import { usePetStore } from '../store/pet';

export function usePetSync() {
  const store = usePetStore();

  // Auto-save when pet changes
  watch(
    () => store.$state,
    (newState) => {
      store.saveToDB();
    },
    { deep: true, immediate: true }
  );
}
```

---

## Error Handling in Composables

```typescript
// src/composables/usePet.ts
import { ref } from 'vue';

export function usePet() {
  const store = usePetStore();
  const error = ref<string | null>(null);
  const loading = ref(false);

  async function chatWithAI(messages: ChatMessage[]) {
    error.value = null;
    loading.value = true;
    
    try {
      const response = await store.chatWithAI(messages);
      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    chatWithAI,
    error,
    loading,
  };
}
```

---

## Reusable Logic Patterns

### use throttled Input

```typescript
// src/composables/useDebouncedInput.ts
import { ref, watch } from 'vue';

export function useDebouncedInput<T>(value: T, delay: number = 300) {
  const debouncedValue = ref<T>(value);

  watch(
    value,
    (newValue) => {
      const handler = setTimeout(() => {
        debouncedValue.value = newValue;
      }, delay);
      
      return () => clearTimeout(handler);
    },
    { immediate: true }
  );

  return debouncedValue;
}
```

### useInterval

```typescript
// src/composables/useInterval.ts
import { onMounted, onUnmounted } from 'vue';

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  onMounted(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
```

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| Direct DOM manipulation | Vue reactivity handles UI updates |
| Complex logic in templates | Use computed properties |
| Global state in composables | Use Pinia stores |
| No error handling | Composables should handle errors |

---

## Related Guides

- [Component Guidelines](./component-guidelines.md) - Component patterns
- [State Management](./state-management.md) - Store patterns
