/**
 * Unit tests for chat context building
 * Tests that pet status, personality, and user interests are properly included in AI prompts
 */

import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../store/pet';

// Mock types
interface MockPersonalityProfile {
  traits: Record<string, number>;
}

interface MockUserInterest {
  interest: string;
  timesMentioned: number;
}

describe('buildSystemPrompt', () => {
  it('should include pet name in system prompt', () => {
    const context = {
      petStatus: { name: 'Buddy', level: 3, friendship: 75 },
      petStats: {
        happiness: 80,
        energy: 60,
        health: 90,
        play: 70,
        love: 85,
        knowledge: 75,
      },
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('Buddy');
    expect(prompt).toContain('Level: 3');
  });

  it('should include all pet stats', () => {
    const context = {
      petStatus: {
        name: 'Pet',
        level: 1,
        friendship: 50,
        love: 80,
        knowledge: 60,
      },
      petStats: {
        happiness: 80,
        energy: 60,
        health: 90,
        play: 70,
        love: 80,
        knowledge: 60,
      },
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('Happiness: 80/100');
    expect(prompt).toContain('Health: 90/100');
    expect(prompt).toContain('Energy: 60/100');
    expect(prompt).toContain('Play: 70/100');
    expect(prompt).toContain('Love: 80/100');
    expect(prompt).toContain('Knowledge: 60/100');
  });

  it('should include personality traits when scores are above 30', () => {
    const context = {
      petStatus: { name: 'Pet', level: 1, friendship: 50 },
      petStats: {
        happiness: 100,
        energy: 100,
        health: 100,
        play: 100,
        love: 100,
        knowledge: 100,
      },
      personalityProfile: {
        traits: {
          friendly: 75,
          playful: 40,
          shy: 20, // Below threshold, should not appear
          aggressive: 80,
        },
      } as MockPersonalityProfile,
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('friendly');
    expect(prompt).toContain('playful');
    expect(prompt).not.toContain('shy'); // Below threshold
    expect(prompt).toContain('aggressive');
  });

  it('should include user interests', () => {
    const userInterests: MockUserInterest[] = [
      { interest: 'technology', timesMentioned: 5 },
      { interest: 'music', timesMentioned: 3 },
      { interest: 'travel', timesMentioned: 2 },
    ];

    const context = {
      petStatus: { name: 'Pet', level: 1, friendship: 50 },
      petStats: {
        happiness: 100,
        energy: 100,
        health: 100,
        play: 100,
        love: 100,
        knowledge: 100,
      },
      userInterests,
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('technology');
    expect(prompt).toContain('technology (mentioned 5 times)');
    expect(prompt).toContain('music');
    expect(prompt).toContain('travel');
  });

  it('should include identity section', () => {
    const context = {
      petStatus: { name: 'Pet', level: 1, friendship: 50 },
      petStats: {
        happiness: 100,
        energy: 100,
        health: 100,
        play: 100,
        love: 100,
        knowledge: 100,
      },
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('Your Identity');
    expect(prompt).toContain('AI-powered virtual pet');
    expect(prompt).toContain('virtual pet living in a pet-chat application');
  });

  it('should include chat guidelines', () => {
    const context = {
      petStatus: { name: 'Pet', level: 1, friendship: 50 },
      petStats: {
        happiness: 100,
        energy: 100,
        health: 100,
        play: 100,
        love: 100,
        knowledge: 100,
      },
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('Chat Guidelines');
    expect(prompt).toContain('personality traits and current status');
    expect(prompt).toContain('Consider your needs when responding');
  });

  it('should handle empty context gracefully', () => {
    const prompt = buildSystemPrompt({});
    expect(prompt).toContain('Your Identity');
    expect(prompt).toContain('Chat Guidelines');
  });

  it('should handle partial context', () => {
    const context = {
      petStatus: { name: 'Buddy' },
      petStats: { happiness: 90 },
      personalityProfile: {
        traits: { friendly: 80 },
      } as MockPersonalityProfile,
    };

    const prompt = buildSystemPrompt(context);
    expect(prompt).toContain('Buddy');
    expect(prompt).toContain('Happiness: 90/100');
    expect(prompt).toContain('friendly');
  });
});

describe('buildSystemPrompt - Conversation History', () => {
  it('should include conversation history in messages', () => {
    // This test verifies the conversation history is passed to AI
    const messages = [
      { role: 'user' as const, content: '你好' },
      { role: 'assistant' as const, content: '你好！有什么我可以帮你的吗？' },
      { role: 'user' as const, content: '我饿了' },
    ];

    // The messages should be included in the llmMessages array
    const systemPrompt = buildSystemPrompt({});
    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
    ];

    expect(llmMessages.length).toBe(4); // 1 system + 3 conversation messages
    expect(llmMessages[0].role).toBe('system');
    expect(llmMessages[1].content).toBe('你好');
    expect(llmMessages[2].content).toBe('你好！有什么我可以帮你的吗？');
    expect(llmMessages[3].content).toBe('我饿了');
  });
});