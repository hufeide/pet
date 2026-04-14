# Frontend Component Guidelines

> Component patterns and conventions for the AI Pet renderer process.

---

## Overview

This project uses **Vue 3** components with **SVG** for pet rendering.

---

## Component File Structure

```
src/components/
├── Pet.vue              # Main pet display (SVG)
├── Chat.vue             # Chat interface
├── Config.vue           # API configuration
├── Avatar.vue           # Avatar/形态 selection
├── Layout.vue           # Main layout wrapper
└── shared/              # Shared components
    ├── Button.vue
    ├── Input.vue
    └── Card.vue
```

---

## Component Patterns

### Template Structure

```vue
<!-- src/components/Pet.vue -->
<template>
  <div class="pet-container">
    <svg
      viewBox="0 0 100 100"
      class="pet"
      :class="pet.形态"
    >
      <!-- Pet body -->
      <g class="body">
        <circle cx="50" cy="50" r="30" :fill="colorTheme.body" />
      </g>
      
      <!-- Accessories (outfit) -->
      <g
        v-for="accessory in currentOutfit"
        :key="accessory.id"
        :class="['accessory', accessory.type]"
      >
        <path :d="accessory.path" :fill="accessory.color" />
      </g>
      
      <!-- Expressions (based on stats) -->
      <g v-if="stats.happiness > 70" class="expression-happy">
        <path d="M30 70 Q50 90 70 70" stroke="black" fill="none" />
      </g>
    </svg>
    
    <div class="pet-info">
      <h3>{{ pet.name }}</h3>
      <p>Level: {{ pet.level }}</p>
      <div class="stats-bar">
        <div
          v-for="(value, key) in pet.stats"
          :key="key"
          class="stat"
        >
          <span>{{ key }}</span>
          <div class="bar">
            <div :style="{ width: value + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePetStore } from '../store/pet';

const petStore = usePetStore();

const pet = computed(() => petStore.$state);
const colorTheme = computed(() => ({
  body: getColorForLevel(pet.value.level),
}));

function getColorForLevel(level: number): string {
  const colors = ['#ff9999', '#99ff99', '#9999ff', '#ffff99'];
  return colors[(level - 1) % colors.length];
}
</script>

<style scoped>
.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pet {
  width: 150px;
  height: 150px;
  transition: all 0.3s ease;
}

.pet.basic { animation: bounce 2s infinite; }
.pet.evolved { animation: float 3s infinite; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}
</style>
```

---

## SVG Animation Patterns

###形态 Change Animation

```vue
<template>
  <svg class="pet" :class="currentForm">
    <!-- Dynamic form classes -->
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  形态: string;
}>();

const currentForm = computed(() => {
  switch (props.形态) {
    case 'basic':
      return 'form-basic';
    case 'evolved':
      return 'form-evolved';
    case 'final':
      return 'form-final';
    default:
      return 'form-basic';
  }
});
</script>

<style scoped>
/* Basic form styles */
.pet.form-basic .body { r: 30; }
.pet.form-evolved .body { r: 40; }
.pet.form-final .body { r: 50; }
</style>
```

### State-Based Expressions

```vue
<template>
  <svg>
    <!-- Eyes -->
    <g :class="['eyes', emotionalState]">
      <circle cx="35" cy="40" r="3" />
      <circle cx="65" cy="40" r="3" />
    </g>
    
    <!-- Mouth -->
    <g :class="['mouth', emotionalState]">
      <path d="M40 60 Q50 70 60 60" />
    </g>
  </svg>
</template>

<script setup lang="ts">
const props = defineProps<{
  stats: {
    happiness: number;
    hunger: number;
  };
}>();

const emotionalState = computed(() => {
  if (props.stats.happiness < 30) return 'sad';
  if (props.stats.hunger < 30) return 'hungry';
  if (props.stats.happiness > 80) return 'happy';
  return 'neutral';
});
</script>
```

---

## Chat Component Pattern

```vue
<!-- src/components/Chat.vue -->
<template>
  <div class="chat-container">
    <div class="chat-history">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="['message', message.role]"
      >
        <div class="message-content">{{ message.content }}</div>
      </div>
    </div>
    
    <div class="chat-input">
      <textarea
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="Say something..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePetStore } from '../store/pet';

const input = ref('');
const petStore = usePetStore();

const messages = computed({
  get: () => petStore.chatHistory,
  set: (value) => petStore.chatHistory = value,
});

async function sendMessage() {
  if (!input.value.trim()) return;
  
  const userMessage = {
    role: 'user' as const,
    content: input.value,
  };
  
  petStore.addMessage(userMessage);
  input.value = '';
  
  const response = await petStore.chatWithAI([userMessage]);
  
  petStore.addMessage({
    role: 'assistant',
    content: response,
  });
}
</script>
```

---

## API Configuration Component

```vue
<!-- src/components/Config.vue -->
<template>
  <div class="config-panel">
    <h3>API Configuration</h3>
    
    <div class="config-group">
      <label>LLM Provider</label>
      <select v-model="config.provider">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
        <option value="qwen">通义千问</option>
        <option value="kimi">Kimi</option>
        <option value="vllm">Local vLLM</option>
      </select>
    </div>
    
    <div class="config-group">
      <label>API Endpoint</label>
      <input
        v-model="config.baseUrl"
        placeholder="https://api.example.com/v1"
      />
    </div>
    
    <div class="config-group">
      <label>API Key</label>
      <input
        v-model="config.apiKey"
        type="password"
        placeholder="sk-..."
      />
    </div>
    
    <div class="config-group">
      <label>Model</label>
      <input
        v-model="config.model"
        placeholder="gpt-4"
      />
    </div>
    
    <button @click="saveConfig">Save Configuration</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useConfigStore } from '../store/config';

const configStore = useConfigStore();

const config = ref({
  provider: configStore.provider,
  baseUrl: configStore.baseUrl,
  apiKey: configStore.apiKey,
  model: configStore.model,
});

function saveConfig() {
  configStore.setConfig(config.value);
}
</script>
```

---

## Props Conventions

### Required Props

```typescript
defineProps<{
  pet: Pet;
  showStats: boolean;
}>();
```

### Optional Props with Defaults

```typescript
defineProps<{
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
}>();

const props = withDefaults(defineProps<{
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
}>(), {
  size: 'medium',
  showLabels: true,
});
```

---

## Emits Pattern

```vue
<!-- src/components/Pet.vue -->
<template>
  <button @click="$emit('interact')">Interact</button>
  <button @click="$emit('feed')">Feed</button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'interact'): void;
  (e: 'feed'): void;
  (e: 'evolve', 新形态: string): void;
}>();
</script>
```

### Using Emits

```vue
<!-- Parent component -->
<Pet
  :pet="pet"
  @interact="handleInteract"
  @feed="handleFeed"
  @evolve="handleEvolve"
/>
```

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| Direct DOM manipulation | Vue reactivity handles UI updates |
| Large single components | Split into smaller components |
| Inline styles | Use CSS classes for maintainability |
| Complex logic in templates | Move to computed properties |

---

## UI/UX Guidelines

### Section-Based Layout

Complex components should be organized into clear sections with visual separation:

```vue
<template>
  <div class="component-container">
    <!-- Section 1: Primary Feature -->
    <div class="section primary-section">
      <div class="section-header">
        <h3>Section Title</h3>
        <span class="toggle-icon">▼</span>
      </div>
      <div class="section-content">
        <!-- Section content -->
      </div>
    </div>

    <!-- Section 2: Secondary Feature -->
    <div class="section secondary-section">
      <!-- ... -->
    </div>
  </div>
</template>

<style scoped>
.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}
</style>
```

### Visual Hierarchy

1. **Primary sections** use gradient backgrounds or accent colors
2. **Secondary sections** use neutral backgrounds
3. **Collapsible sections** improve scannability
4. **Quick stats** use icon + value format for at-a-glance info

### Pet Status Panel Design

When displaying pet status in multiple places (PetParadise, Chat, Memory), follow these patterns:

1. **Header**: Pet avatar + name + level + emotion badge + friendship badge
2. **Four Core Needs**: Always display these 4 needs with consistent icons:
   - ⚡ 能量 (Energy) — `petStatus.energy`
   - 🎾 玩耍 (Play) — `petStatus.play`
   - ❤️ 爱意 (Love) — `petStatus.love`
   - 📚 知识 (Knowledge) — `petStatus.knowledge`
3. **Action Buttons**: Rounded pill buttons with icons
4. **Urgent Indicators**: Pulsing animations for low stats (< 40%)

**Unified Stat Display**: All tabs must display the same 4 need stats from `petKingdomStore.petStatus`. Do NOT display raw memory statistics (Total, By Type, Avg Usefulness) in the pet status area.

### Color Scheme

- **Primary gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Success**: `#4CAF50`
- **Warning**: `#FF9800`
- **Error**: `#F44336`
- **Info**: `#2196F3`

### Animations

- **Urgent pulse**: `animation: pulse 1s infinite` for low stats
- **Hover lift**: `transform: translateY(-2px)` with shadow
- **Smooth transitions**: `transition: all 0.2s ease`

---

## Related Guides

- [Directory Structure](./directory-structure.md) - Component file layout
- [State Management](./state-management.md) - Store integration
- [Type Safety](./type-safety.md) - Component type definitions
