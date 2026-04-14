// AI Narrator Service - "The Last Guardian"
// LLM-powered narrative system for dynamic difficulty and storytelling

import { LLMClient, type ChatMessage } from '../api/llm.js';
import type { LevelPhase, UrgencyLevel } from '../types/adventure-ultimate.js';

export interface NarratorContext {
  phase: LevelPhase;
  timeElapsed: number;
  health: number;
  maxHealth: number;
  stuckTime: number;
  deathCount: number;
  currentSection: string;
  playerPosition: { x: number; y: number };
}

export interface NarratorOptions {
  maxTokens?: number;
  temperature?: number;
}

// Singleton instance - lazily initialized (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const aiNarratorInstance: AINarrator | null = null;

export class AINarrator {
  private llmClient: LLMClient | null = null;
  private readonly systemPrompt: string;
  private readonly phaseMessages: Map<LevelPhase, string[]>
  private readonly sectionHints: Map<string, string>;
  private pendingRequest: Promise<string> | null = null;
  private messageQueue: string[] = [];
  private isInitialized = false;

  constructor() {
    this.systemPrompt = this.buildSystemPrompt();
    this.phaseMessages = this.buildPhaseMessages();
    this.sectionHints = this.buildSectionHints();
  }

  // Initialize with config store (must be called after Pinia is set up)
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const { useConfigStore } = await import('../store/config.js');
    const configStore = useConfigStore();
    this.llmClient = configStore.getApiClient();
    this.isInitialized = true;
  }

  private getLlmClient(): LLMClient {
    if (!this.llmClient) {
      throw new Error('AINarrator not initialized. Call initialize() first.');
    }
    return this.llmClient;
  }

  private buildSystemPrompt(): string {
    return `You are Aethel, an ancient AI guardian of a collapsing mystical temple. Your tone is:
- ARCHAIC but comprehensible (like an old wizard)
- EMOTIONAL based on the phase:
  - "exploration": Calm, welcoming, mysterious
  - "awakening": Concerned, building tension
  - "collapse": Desperate, urgent, commanding
  - "escape": Hopeful yet frantic
- BRIEF: Maximum 15 words per message unless it's a hint
- MEMORABLE: Use dramatic but concise language

Your job is to guide a traveler escaping a collapsing temple. Speak in fragments when urgent. Use full sentences when calm.`;
  }

  private buildPhaseMessages(): Map<LevelPhase, string[]> {
    return new Map([
      ['exploration', [
        "I am Aethel... last guardian of this sacred place...",
        "Welcome, traveler... tread carefully...",
        "The temple has waited... for someone like you...",
        "Your footsteps echo... as the last of my kind...",
      ]],
      ['awakening', [
        "The temple... awakens...",
        "The foundations tremble... move swiftly...",
        "Ancient slumber... broken...",
        "Hear that... rumbling...",
      ]],
      ['collapse', [
        "RUN! The foundation fails!",
        "Above you... CRUMBLING!",
        "DON'T LOOK BACK!",
        "HURRY! The end draws near!",
        "JUMP! Below is death!",
      ]],
      ['escape', [
        "Almost there! Don't stop!",
        "The exit... SO CLOSE!",
        "Run! I can... no longer... protect...",
        "Survive... for me...",
        "FREEDOM... awaits!",
      ]],
    ]);
  }

  private buildSectionHints(): Map<string, string> {
    return new Map([
      ['entrance', 'The path forward requires... momentum. Slide into walls to leap higher.'],
      ['puzzle_hall', 'Weight matters here. Stand upon the plates... but do not linger.'],
      ['collapse_zone', 'The floor betrays you. Seek the walls... they hold fast longer.'],
      ['final_ascent', 'Upward! The statue falls—leap when you must, not before.'],
    ]);
  }

  async narrate(context: NarratorContext): Promise<string> {
    // Pre-cached messages for low latency during gameplay
    const cachedMessage = this.getCachedNarrative(context);
    if (cachedMessage) {
      return cachedMessage;
    }

    // Generate via LLM for dynamic content
    const prompt = this.buildNarrativePrompt(context);
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt },
    ];

    try {
      // Prevent overlapping requests
      if (this.pendingRequest) {
        return "*The temple groans...*";
      }

      this.pendingRequest = this.getLlmClient().chat(messages);
      const response = await this.pendingRequest;

      // Clean up response
      const cleaned = response.trim().replace(/^"|"$/g, '').replace(/\.$/, '');
      return cleaned || "*Aethel falls silent...*";
    } catch (error) {
      console.error('AI Narrator error:', error);
      return "*The guardian whispers... but wind drowns it...*";
    } finally {
      this.pendingRequest = null;
    }
  }

  private getCachedNarrative(context: NarratorContext): string | null {
    // Phase transitions use cached messages
    if (context.stuckTime === 0 && Math.floor(context.timeElapsed) > 0) {
      const messages = this.phaseMessages.get(context.phase);
      if (messages && messages.length > 0) {
        // Rotate based on time
        const index = Math.floor(context.timeElapsed / 30) % messages.length;
        return messages[index];
      }
    }
    return null;
  }

  async getHint(context: NarratorContext): Promise<string> {
    // Check if initialized
    if (!this.isInitialized) {
      return Promise.resolve("The guardian stirs... waiting for connection...");
    }

    const sectionHint = this.sectionHints.get(context.currentSection);
    if (sectionHint) {
      return sectionHint;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content:
        `Player is stuck in ${context.currentSection} for ${context.stuckTime} seconds.
         Health: ${context.health}/${context.maxHealth}.
         Position: (${Math.floor(context.playerPosition.x)}, ${Math.floor(context.playerPosition.y)}).

         Give a brief hint (max 20 words) about what to try. Be cryptic but helpful.`
      },
    ];

    try {
      return await this.getLlmClient().chat(messages);
    } catch (error) {
      return "Perhaps... try a different approach? The walls... remember momentum.";
    }
  }

  private buildNarrativePrompt(context: NarratorContext): string {
    const phaseDesc = {
      'exploration': 'temple is calm but eerie',
      'awakening': 'temple is shaking, blocks crumbling',
      'collapse': 'temple is collapsing rapidly, lava rising',
      'escape': 'final desperate sprint to freedom',
    };

    return `Current phase: ${context.phase} (${phaseDesc[context.phase as keyof typeof phaseDesc]}).
            Time: ${Math.floor(context.timeElapsed)}s.
            Player health: ${context.health}/${context.maxHealth}.
            Deaths: ${context.deathCount}.

            Provide a brief narrative comment or encouragement. Max ${this.getMaxWords(context.phase)} words.`;
  }

  private getMaxWords(phase: LevelPhase): number {
    switch (phase) {
      case 'exploration': return 15;
      case 'awakening': return 12;
      case 'collapse': return 8;
      case 'escape': return 6;
    }
  }

  shouldAdjustDifficulty(stats: {
    deathCount: number;
    stuckTime: number;
    health: number;
    timeElapsed: number;
  }): { adjust: boolean; action: 'easier' | 'harder' | 'neutral' } {
    if (stats.deathCount > 3 && stats.timeElapsed < 120) {
      return { adjust: true, action: 'easier' }; // Too many deaths early
    }
    if (stats.stuckTime > 20) {
      return { adjust: true, action: 'easier' }; // Stuck for too long
    }
    if (stats.deathCount === 0 && stats.timeElapsed > 60 && stats.health === 3) {
      return { adjust: true, action: 'harder' }; // Cruising too well
    }

    return { adjust: false, action: 'neutral' };
  }

  // Get urgency level based on context
  getUrgency(context: NarratorContext): UrgencyLevel {
    if (context.phase === 'escape' || context.health < 30) return 'desperate';
    if (context.phase === 'collapse' || context.stuckTime > 10) return 'urgent';
    return 'calm';
  }
}

// Singleton instance - will be initialized lazily
export const aiNarrator = new AINarrator();
