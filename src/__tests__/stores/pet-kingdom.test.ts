import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePetKingdomStore } from '@/store/pet-kingdom';

// Mock LLM client
vi.mock('@/services/llm-client', () => ({
  default: {
    chat: vi.fn().mockResolvedValue({
      content: 'Mock response',
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    }),
  },
}));

// Mock memory store functions
vi.mock('@/store/memory', () => ({
  useMemoryStore: () => ({
    recordPetStatusHistory: vi.fn().mockResolvedValue(undefined),
    addMemory: vi.fn().mockResolvedValue(undefined),
    saveMemory: vi.fn().mockResolvedValue(undefined),
    isMealTime: vi.fn().mockReturnValue(false),
    isSleepTime: vi.fn().mockReturnValue(false),
    recordNeedSatisfied: vi.fn().mockResolvedValue(undefined),
    recordUserInterest: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock IndexedDB
vi.mock('@/db/indexeddb', () => ({
  saveMemory: vi.fn().mockResolvedValue(undefined),
  getMemories: vi.fn().mockResolvedValue([]),
  initDB: vi.fn().mockResolvedValue(undefined),
}));

describe('Pet Kingdom Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('Initialization', () => {
    it('should initialize with default pet status', () => {
      const store = usePetKingdomStore();
      expect(store.petStatus).toBeDefined();
      expect(store.petStatus.name).toBe('My Pet');
      expect(store.petStatus.level).toBe(1);
      expect(store.petStatus.friendship).toBe(50);
    });

    it('should initialize all stats at 100', () => {
      const status = usePetKingdomStore().petStatus;
      expect(status.happiness).toBe(100);
      expect(status.energy).toBe(100);
      expect(status.play).toBe(100);
      expect(status.love).toBe(100);
      expect(status.health).toBe(100);
      expect(status.knowledge).toBe(50);
    });
  });

  describe('Pet Actions', () => {
    it('should increase energy stat when restoring energy', async () => {
      const store = usePetKingdomStore();
      store.petStatus.energy = 50;
      const initialEnergy = store.petStatus.energy;
      await store.restoreEnergy();
      expect(store.petStatus.energy).toBeGreaterThan(initialEnergy);
    });

    it('should increase friendship when restoring energy', async () => {
      const store = usePetKingdomStore();
      const initialFriendship = store.petStatus.friendship;
      await store.restoreEnergy();
      expect(store.petStatus.friendship).toBeGreaterThan(initialFriendship);
    });

    it('should increase play stat when playing with pet', async () => {
      const store = usePetKingdomStore();
      await store.playWithPet();
      expect(store.petStatus.play).toBe(100);
    });

    it('should increase love stat when showing affection', async () => {
      const store = usePetKingdomStore();
      await store.showAffection();
      expect(store.petStatus.love).toBe(100);
    });

    it('should increase knowledge stat when learning', async () => {
      const store = usePetKingdomStore();
      const initialKnowledge = store.petStatus.knowledge;
      await store.learnTopic('science');
      expect(store.petStatus.knowledge).toBeGreaterThan(initialKnowledge);
    });
  });

  describe('Emotion System', () => {
    it('should update emotion to Excited on satisfaction', () => {
      const store = usePetKingdomStore();
      store.updateEmotion('satisfaction');
      expect(store.petStatus.currentEmotion).toBe('Excited');
    });

    it('should update emotion to Neutral on decay', () => {
      const store = usePetKingdomStore();
      store.petStatus.energy = 20;
      store.updateEmotion('decay');
      expect(store.petStatus.currentEmotion).toBe('Neutral');
    });

    it('should update emotion to Lazy on low energy with stat-influence', () => {
      const store = usePetKingdomStore();
      store.petStatus.energy = 20;
      store.updateEmotion('stat-influence');
      expect(store.petStatus.currentEmotion).toBe('Lazy');
    });
  });

  describe('Need Satisfaction Detection', () => {
    it('should detect energy-related need satisfaction', () => {
      const store = usePetKingdomStore();
      const result = store.detectNeedSatisfaction('I need to rest');
      expect(result?.need).toBe('energy');
    });

    it('should detect play-related need satisfaction', () => {
      const store = usePetKingdomStore();
      const result = store.detectNeedSatisfaction('Let\'s play a game');
      expect(result?.need).toBe('play');
    });

    it('should detect love-related need satisfaction', () => {
      const store = usePetKingdomStore();
      const result = store.detectNeedSatisfaction('I love you');
      expect(result?.need).toBe('love');
    });

    it('should detect learn-related need satisfaction', () => {
      const store = usePetKingdomStore();
      const result = store.detectNeedSatisfaction('Let\'s learn something');
      expect(result?.need).toBe('learn');
    });

    it('should return undefined for non-matching input', () => {
      const store = usePetKingdomStore();
      const result = store.detectNeedSatisfaction('今天天气不错');
      expect(result).toBeUndefined();
    });
  });

  describe('Pet Request Generation', () => {
    it('should generate a request for urgent needs', () => {
      const store = usePetKingdomStore();
      store.petStatus.energy = 20;
      const request = store.petRequest;
      expect(request).toBeDefined();
      expect(request.length).toBeGreaterThan(0);
    });

    it('should return empty string when no urgent needs', () => {
      const store = usePetKingdomStore();
      store.petStatus.energy = 100;
      store.petStatus.play = 100;
      store.petStatus.love = 100;
      const request = store.petRequest;
      expect(request).toBe('');
    });
  });
});