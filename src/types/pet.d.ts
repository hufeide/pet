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
  happiness: number; // 0-100
  hunger: number; // 0-100
  health: number; // 0-100
  energy: number; // 0-100
}

// Item in pet inventory
export interface Item {
  id: string;
  name: string;
  type: 'outfit' | 'accessory' | 'toy' | 'food';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  metadata: Record<string, string>;
}

// Main pet interface
export interface Pet {
  id: string;
  name: string;
  level: number;
  experience: number;
  form: PetForm;
  personality: PersonalityTrait[];
  stats: PetStats;
  inventory: Item[];
  createdAt: string;
  updatedAt: string;
}

// Chat message in store
export interface ChatMessageStore {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Evolution config
export interface EvolutionConfig {
  level: number;
  experience: number;
  form: PetForm;
}

// API config for storing in database
export interface APIConfigStore {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  imageModel?: string;
}
