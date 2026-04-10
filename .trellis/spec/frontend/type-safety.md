# Frontend Type Safety

> TypeScript conventions and patterns for the AI Pet project.

---

## Overview

This project uses **TypeScript** with Vue 3 and Pinia.

---

## Configuration

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noImplicitAny": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "strict": true,
    "jsx": "preserve"
  }
}
```

---

## Type File Organization

```
src/
└── types/
    ├── api.d.ts         # API type definitions
    ├── pet.d.ts         # Pet data types
    ├── db.d.ts          # Database types
    └── index.ts         # Type exports
```

---

## Type Definitions

### API Types (src/types/api.d.ts)

```typescript
// OpenAI-compatible API types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface Choice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter';
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// LLM API configuration
export interface LLMAPIConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'kimi' | 'vllm';
  baseUrl: string;
  apiKey: string;
  model: string;
}

// Image generation API types
export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: string;
}

export interface ImageGenerationResponse {
  data: ImageData[];
}

export interface ImageData {
  url: string;
  b64_json?: string;
  revised_prompt?: string;
}
```

### Pet Types (src/types/pet.d.ts)

```typescript
// Pet personality traits
export type PersonalityTrait = 
  | 'friendly'
  | 'shy'
  | 'aggressive'
  | 'playful'
  | 'lazy'
  | 'curious'
  | 'greedy'
  | 'generous';

// Pet forms (morphology)
export type PetForm = 
  | 'basic'
  | 'evolved'
  | 'final'
  | 'special'
  | 'legendary';

// Pet stats
export interface PetStats {
  happiness: number;  // 0-100
  hunger: number;     // 0-100
  health: number;     // 0-100
  energy: number;     // 0-100
}

// Main pet interface
export interface Pet {
  id: string;
  name: string;
  level: number;
  experience: number;
  形态: PetForm;
  personality: PersonalityTrait[];
  stats: PetStats;
  inventory: Item[];
  createdAt: string;
  updatedAt: string;
}

// Item in pet inventory
export interface Item {
  id: string;
  name: string;
  type: 'outfit' | 'accessory' | 'toy' | 'food';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  metadata: Record<string, string>;
}

// Chat message in store
export interface ChatMessageStore {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
```

### Database Types (src/types/db.d.ts)

```typescript
import { Pet, ChatMessageStore } from './pet';

// Database schema types
export interface DBSchema {
  pets: PetTable;
  chat_history: ChatTable;
  api_configs: ConfigTable;
  items: ItemTable;
}

export interface PetTable {
  id: string;
  name: string;
  level: number;
  experience: number;
  形态: string;
  personality: string;  // JSON array as string
  stats: string;        // JSON object as string
  inventory: string;    // JSON array as string
  created_at: string;
  updated_at: string;
}

export interface ChatTable {
  id: string;
  pet_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConfigTable {
  key: string;
  value: string;  // JSON object as string
}

export interface ItemTable {
  id: string;
  pet_id: string;
  name: string;
  type: string;
  rarity: string;
  metadata: string;
}
```

---

## Store Type Definitions

```typescript
// src/store/pet.ts
import { defineStore } from 'pinia';
import { Pet, PetStats, PetForm, PersonalityTrait } from '../types/pet';

export interface PetState {
  id: string;
  name: string;
  level: number;
  experience: number;
  形态: PetForm;
  personality: PersonalityTrait[];
  stats: PetStats;
  inventory: Item[];
  chatHistory: ChatMessageStore[];
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
      energy: 100,
    },
    inventory: [],
    chatHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  
  getters: {
    isHappy: (state) => state.stats.happiness > 70,
    levelName: (state) => `Level ${state.level}`,
    canEvolve: (state) => state.experience >= state.level * 100,
  },
  
  actions: {
    updateStats(updates: Partial<PetStats>) {
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
  },
});
```

---

## API Client Type Definitions

```typescript
// src/api/llm.ts
import { 
  ChatMessage, 
  ChatCompletionRequest, 
  ChatCompletionResponse,
  LLMAPIConfig 
} from '../types/api';

export class LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: LLMAPIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');  // Remove trailing slash
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    const request: ChatCompletionRequest = {
      model: this.model,
      messages,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0].message.content;
  }

  async getImage(prompt: string): Promise<string> {
    // Implementation for image generation
    return '';
  }
}
```

---

## Component Props Type

```typescript
// src/components/Pet.vue
import { defineComponent } from 'vue';
import { Pet, PetStats } from '../types/pet';

export default defineComponent({
  name: 'PetDisplay',
  props: {
    pet: {
      type: Object as () => Pet,
      required: true,
    },
    showStats: {
      type: Boolean,
      default: true,
    },
    onClickInteract: {
      type: Function as () => () => void,
      required: true,
    },
  },
  setup(props) {
    // Type-safe access to props
    console.log(props.pet.level);  // number
    console.log(props.pet.stats.happiness);  // number
  },
});
```

---

## Database Access Type

```typescript
// src/db/pet.ts
import Database from 'better-sqlite3';
import { Pet, PetTable } from '../types/pet';

const db = new Database('data/pet.db');

// Prepared statements with types
const getPetStmt = db.prepare('SELECT * FROM pets WHERE id = ?');
const updatePetStmt = db.prepare(`
  UPDATE pets SET
    name = ?,
    level = ?,
    experience = ?,
    形态 = ?,
    personality = ?,
    stats = ?,
    inventory = ?,
    updated_at = ?
  WHERE id = ?
`);

export function getPet(id: string): Pet | undefined {
  const result = getPetStmt.get(id) as PetTable | undefined;
  if (!result) return undefined;
  
  return {
    id: result.id,
    name: result.name,
    level: result.level,
    experience: result.experience,
    形态: result.形态 as PetForm,
    personality: JSON.parse(result.personality) as string[],
    stats: JSON.parse(result.stats) as PetStats,
    inventory: JSON.parse(result.inventory) as Item[],
    createdAt: result.created_at,
    updatedAt: result.updated_at,
  };
}

export function savePet(pet: Pet): void {
  updatePetStmt.run(
    pet.name,
    pet.level,
    pet.experience,
    pet.形态,
    JSON.stringify(pet.personality),
    JSON.stringify(pet.stats),
    JSON.stringify(pet.inventory),
    pet.updatedAt,
    pet.id,
  );
}
```

---

## Async Type Safety

```typescript
// src/store/pet.ts
export const usePetStore = defineStore('pet', {
  actions: {
    async chatWithAI(messages: ChatMessage[]): Promise<string> {
      try {
        const client = new LLMClient(this.config);
        const response = await client.chat(messages);
        
        this.chatHistory.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        });
        
        return response;
      } catch (error) {
        console.error('Chat failed:', error);
        throw error;
      }
    },
    
    async generateOutfit(prompt: string): Promise<string> {
      try {
        const imageUrl = await this.imageClient.generate(prompt);
        
        this.inventory.push({
          id: crypto.randomUUID(),
          name: prompt,
          type: 'outfit',
          rarity: 'rare',
          metadata: { url: imageUrl },
        });
        
        return imageUrl;
      } catch (error) {
        console.error('Image generation failed:', error);
        throw error;
      }
    },
  },
});
```

---

## Constants Type Safety

```typescript
// src/constants/pet.ts
export const PET_FORMS = ['basic', 'evolved', 'final'] as const;
export type PetForm = typeof PET_FORMS[number];

export const PERSONALITY_TRAITS = [
  'friendly', 'shy', 'aggressive', 
  'playful', 'lazy', 'curious'
] as const;
export type PersonalityTrait = typeof PERSONALITY_TRAITS[number];

export const RARITIES = ['common', 'rare', 'epic', 'legendary'] as const;
export type Rarity = typeof RARITIES[number];
```

---

## Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| `any` type | Defeats TypeScript purpose |
| `// @ts-ignore` comments | Hides real type issues |
| Types scattered in files | Hard to maintain |
| `Record<string, any>` | Use specific types |

---

## Related Guides

- [Directory Structure](./directory-structure.md) - Type file organization
- [Component Guidelines](./component-guidelines.md) - Component types
