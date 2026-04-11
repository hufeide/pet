import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getPet, savePet, addChatMessage, getChatHistory } from '../db';
import { generateUUID } from '../utils/uuid';
import { LLMClient } from '../api/llm';

// Default API configuration
const DEFAULT_CONFIG = {
  provider: 'custom',
  baseUrl: 'http://192.168.1.159:19000/v1',
  apiKey: 'sk-no-key-required',
  model: 'Qwen3Coder',
  imageModel: '',
};

// Personality trait descriptions for system prompt
const PERSONALITY_TRAITS = {
  friendly: 'Friendly - warm, approachable, enjoys social interaction',
  shy: 'Shy - reserved, polite, takes time to open up',
  aggressive: 'Aggressive - assertive, direct, strong-willed',
  playful: 'Playful - fun-loving, humorous, energetic',
  lazy: 'Lazy - relaxed, low energy, prefers comfort',
  curious: 'Curious - inquisitive, loves learning, asks questions',
  greedy: 'Greedy - material-focused, value-oriented',
  generous: 'Generous - giving, sharing, caring',
  wise: 'Wise - thoughtful, provides guidance, knowledgeable',
  energetic: 'Energetic - active, enthusiastic, always on the move',
  analytical: 'Analytical - logical, detail-oriented, reasoned',
  emotional: 'Emotional - expressive, empathetic, feeling-oriented',
  practical: 'Practical - realistic, solution-focused, action-oriented',
  creative: 'Creative - imaginative, artistic, innovative',
  polite: 'Polite - courteous, respectful, well-mannered',
};

// Build system prompt with pet context for AI
function buildSystemPrompt(context?: {
  petStatus?: any;
  petStats?: any;
  personalityProfile?: any;
  userInterests?: any;
}): string {
  const parts: string[] = [];

  // Pet status context from petKingdom store
  if (context?.petStatus) {
    parts.push('# Your Current Status');
    parts.push(`- Name: ${context.petStatus.name || 'Pet'}`);
    parts.push(`- Level: ${context.petStatus.level || 1}`);
    parts.push(`- Friendship: ${context.petStatus.friendship || 50}/100`);
    parts.push('');
  }

  // Detailed stats from pet store
  if (context?.petStats) {
    parts.push('# Your Stats (0-100)');
    parts.push(`- Happiness: ${context.petStats.happiness || 0}/100`);
    parts.push(`- Hunger: ${context.petStats.hunger || 0}/100`);
    parts.push(`- Health: ${context.petStats.health || 0}/100`);
    parts.push(`- Energy: ${context.petStats.energy || 0}/100`);
    parts.push(`- Sleep: ${context.petStats.sleep || 0}/100`);
    parts.push(`- Play: ${context.petStats.play || 0}/100`);
    parts.push('');
  }

  // Pet status from kingdom store (for chat-related stats)
  if (context?.petStatus) {
    parts.push('# User Needs (0-100)');
    parts.push(`- Love: ${context.petStatus.love || 0}/100`);
    parts.push(`- Chat: ${context.petStatus.chat || 0}/100`);
    parts.push(`- Knowledge: ${context.petStatus.knowledge || 0}/100`);
    parts.push('');
  }

  // Personality context
  if (context?.personalityProfile?.traits) {
    parts.push('# Your Personality Traits');
    const traits = context.personalityProfile.traits;
    Object.entries(traits).forEach(([trait, score]: [string, number]) => {
      if (score > 30 && PERSONALITY_TRAITS[trait as keyof typeof PERSONALITY_TRAITS]) {
        parts.push(`- ${trait}: ${PERSONALITY_TRAITS[trait as keyof typeof PERSONALITY_TRAITS]}`);
      }
    });
    parts.push('');
  }

  // User interests context
  if (context?.userInterests && context.userInterests.length > 0) {
    parts.push('# Your Master\'s Interests');
    context.userInterests.slice(0, 5).forEach((interest: any) => {
      parts.push(`- ${interest.interest} (mentioned ${interest.timesMentioned || 1} times)`);
    });
    parts.push('');
  }

  // Identity and role
  parts.push('# Your Identity');
  parts.push('You are an AI-powered virtual pet living in a pet-chat application.');
  parts.push('You can communicate with your master, express your needs, and learn from interactions.');
  parts.push('');

  // General instructions
  parts.push('# Chat Guidelines');
  parts.push('- Respond naturally based on your personality traits and current status');
  parts.push('- Consider your needs when responding (e.g., hungry pets may be cranky)');
  parts.push('- Remember previous conversations and your master\'s interests');
  parts.push('- Be consistent with your personality and relationship level');
  parts.push('- If a master asks about your status, answer truthfully based on the numbers');
  parts.push('- Show your personality through your word choices and tone');
  parts.push('');

  return parts.join('\n');
}

interface PetStats {
  happiness: number;
  hunger: number;
  health: number;
  energy: number;
  sleep: number;
  play: number;
}

interface PetData {
  id: string;
  name: string;
  level: number;
  experience: number;
  form: string;
  personality: string[];
  stats: PetStats;
  inventory: any[];
  createdAt: string;
  updatedAt: string;
}

export const usePetStore = defineStore('pet', () => {
  // State
  const pet = ref<PetData>({
    id: 'default',
    name: 'Pet',
    level: 1,
    experience: 0,
    form: 'basic',
    personality: ['friendly'],
    stats: {
      happiness: 100,
      hunger: 100,
      health: 100,
      energy: 100,
      sleep: 100,
      play: 100,
    },
    inventory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const chatHistory = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isHappy = computed(() => pet.value.stats.happiness > 70);
  const isHungry = computed(() => pet.value.stats.hunger < 30);
  const isTired = computed(() => pet.value.stats.energy < 30);
  const levelName = computed(() => `Level ${pet.value.level}`);
  const canEvolve = computed(() => pet.value.experience >= pet.value.level * 100);

  // Actions
  async function loadFromDB(petId = 'default'): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const petData = await getPet(petId);
      if (petData) {
        pet.value = petData as PetData;
      }

      // Load chat history
      const history = await getChatHistory(petId);
      chatHistory.value = history;
    } catch (err) {
      error.value = `Failed to load data: ${err}`;
    } finally {
      loading.value = false;
    }
  }

  async function saveToDB(): Promise<void> {
    pet.value.updatedAt = new Date().toISOString();

    // Create a plain object for IndexedDB (remove Vue reactivity)
    const plainPet = JSON.parse(JSON.stringify(pet.value));

    await savePet(plainPet);
  }

  async function updateStats(updates: Partial<PetStats>): Promise<void> {
    pet.value.stats = { ...pet.value.stats, ...updates };
    pet.value.updatedAt = new Date().toISOString();
    await saveToDB();
  }

  async function gainExperience(amount: number): Promise<void> {
    pet.value.experience += amount;
    if (pet.value.experience >= pet.value.level * 100) {
      pet.value.level++;
      pet.value.experience = 0;
    }
    await saveToDB();
  }

  async function changeForm(newForm: string): Promise<void> {
    pet.value.form = newForm;
    pet.value.updatedAt = new Date().toISOString();
    await saveToDB();
  }

  async function addPersonality(trait: string): Promise<void> {
    if (!pet.value.personality.includes(trait)) {
      pet.value.personality.push(trait);
      await saveToDB();
    }
  }

  async function interact(): Promise<void> {
    pet.value.stats.happiness = Math.min(100, pet.value.stats.happiness + 5);
    await gainExperience(5);
  }

  async function feed(): Promise<void> {
    pet.value.stats.hunger = Math.min(100, pet.value.stats.hunger + 10);
    await gainExperience(5);
  }

  async function rest(): Promise<void> {
    pet.value.stats.energy = Math.min(100, pet.value.stats.energy + 20);
    pet.value.stats.hunger = Math.max(0, pet.value.stats.hunger - 5);
    await saveToDB();
  }

  async function playMiniGame(score: number): Promise<void> {
    pet.value.stats.happiness = Math.min(100, pet.value.stats.happiness + score * 2);
    await gainExperience(score * 2);
  }

  async function chatWithAI(
    messages: any[],
    context?: {
      petStatus?: any;
      personalityProfile?: any;
      userInterests?: any;
    },
    onConversationSaved?: (userContent: string, assistantContent: string) => void
  ): Promise<string> {
    loading.value = true;
    error.value = null;

    try {
      // Get config from localStorage, use default if not set
      const configStr = localStorage.getItem('llm_config');
      const config = configStr ? JSON.parse(configStr) : DEFAULT_CONFIG;

      // Create LLM client and get response from real API
      const client = new LLMClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        model: config.model,
      });

      // Build system prompt with pet context
      const systemPrompt = buildSystemPrompt(context);

      // Convert messages to LLM format
      const llmMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
      ];

      // Get response from real LLM API
      const response = await client.chat(llmMessages);

      // Add assistant message to history
      const assistantMessage = {
        id: generateUUID(),
        role: 'assistant' as const,
        content: response,
        timestamp: new Date().toISOString(),
      };
      chatHistory.value.push(assistantMessage);
      await addChatMessage(pet.value.id, 'assistant', response);

      // Save conversation to memory system
      const userContent = messages.find((m) => m.role === 'user')?.content || '';
      if (onConversationSaved) {
        onConversationSaved(userContent, response);
      }

      // Update pet state
      await gainExperience(10);

      return response;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Add user message immediately to chat history (before AI response)
  function addChatMessageImmediately(content: string): void {
    const userMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content,
      timestamp: new Date().toISOString(),
    };
    chatHistory.value.push(userMessage);
    // Save user message to database immediately
    addChatMessage(pet.value.id, 'user', content);
  }

  async function generateOutfit(prompt: string): Promise<string> {
    loading.value = true;
    error.value = null;

    try {
      const imageUrl = `https://placehold.co/1024x1024?text=${encodeURIComponent(prompt)}`;

      // Add to inventory
      const newItem = {
        id: generateUUID(),
        name: prompt,
        type: 'outfit' as const,
        rarity: 'rare' as const,
        metadata: { url: imageUrl },
      };
      pet.value.inventory.push(newItem);
      await saveToDB();

      await gainExperience(50);
      return imageUrl;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset(): void {
    pet.value = {
      id: 'default',
      name: 'Pet',
      level: 1,
      experience: 0,
      form: 'basic',
      personality: ['friendly'],
      stats: {
        happiness: 100,
        hunger: 100,
        health: 100,
        energy: 100,
        sleep: 100,
        play: 100,
      },
      inventory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    chatHistory.value = [];
  }

  return {
    pet,
    chatHistory,
    loading,
    error,
    isHappy,
    isHungry,
    isTired,
    levelName,
    canEvolve,
    loadFromDB,
    saveToDB,
    updateStats,
    gainExperience,
    changeForm,
    addPersonality,
    interact,
    feed,
    rest,
    playMiniGame,
    chatWithAI,
    addChatMessageImmediately,
    generateOutfit,
    reset,
  };
});
