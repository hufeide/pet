/**
 * Test utilities and mocks for store testing
 */

import { vi } from 'vitest';
import type { LLMClient } from '../../api/llm.js';

/**
 * Mock LLM client for testing
 */
export const createMockLLMClient = (): LLMClient => {
  const chatFn = vi.fn(async (messages: unknown[]) => {
    // Return mock response based on message content
    const content = (messages as Array<{ content?: string }>)[messages.length - 1]?.content || '';

    if (content.includes('greeting') || content.includes('Greeting')) {
      return JSON.stringify({
        greeting: '你好呀！很高兴见到你！',
        reply1: 'Hi！今天过得怎么样？',
        reply2: '我今天学到了很多新知识呢！',
      });
    }

    if (content.includes('topic') || content.includes('Topic')) {
      return JSON.stringify({
        topic: '科技',
        description: '人工智能正在改变我们的生活',
      });
    }

    return '这是测试响应';
  });

  const chatWithResponseFn = vi.fn(async (messages: unknown[]) => ({
    success: true,
    data: await chatFn(messages),
  }));

  return {
    baseUrl: 'https://api.test.com',
    apiKey: 'test-key',
    model: 'test-model',
    chat: chatFn,
    chatWithResponse: chatWithResponseFn,
  } as unknown as LLMClient;
};

/**
 * Mock config store
 */
export const createMockConfigStore = () => ({
  getApiClient: vi.fn(() => createMockLLMClient()),
  apiType: 'openai',
  apiKey: 'test-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo',
});

/**
 * Mock memory store
 */
export const createMockMemoryStore = () => ({
  friendshipLevel: 'stranger' as const,
  friendshipStats: {
    currentLevel: 'stranger',
    progress: 0,
    nextLevel: 'acquaintance',
  },
  getPersonalityProfile: vi.fn(() => ({
    traits: {
      friendly: 80,
      curious: 60,
      playful: 70,
    },
  })),
  userInterests: [
    { interest: 'tech', lastUpdated: new Date().toISOString() },
    { interest: 'science', lastUpdated: new Date().toISOString() },
  ],
  isMealTime: vi.fn(() => false),
  isSleepTime: vi.fn(() => false),
  incrementMissedFeedings: vi.fn(),
  resetMissedFeedings: vi.fn(),
  isPetDead: vi.fn(() => false),
  canGenerateChatTopic: vi.fn(() => true),
  recordUserInterest: vi.fn(),
  recordNeedSatisfied: vi.fn(),
  recordPetState: vi.fn(),
  recordPetStatusHistory: vi.fn(),
  addMemory: vi.fn(),
  generateDailyDiary: vi.fn(),
  generateDailySummary: vi.fn(),
  recordEvolution: vi.fn(),
  evolutionHistory: [] as Array<{ timestamp: string; fromForm: string; toForm: string }>,
});

/**
 * Mock saveMemory function
 */
export const mockSaveMemory = vi.fn(async () => {
  // Mock implementation that does nothing
});

/**
 * Helper to reset all mocks
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
};
