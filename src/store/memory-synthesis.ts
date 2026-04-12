import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PetStatus } from './memory';
import type { PetSnapshot } from '../types/pet-kingdom';

// Memory synthesis types
export type SynthesisType =
  | 'daily_summary'
  | 'pattern_analysis'
  | 'trend_detection'
  | 'key_insight'
  | 'emotional_pattern'
  | 'knowledge_connection';

// Synthesized memory result
export interface SynthesizedMemory {
  id: string;
  type: SynthesisType;
  petId: string;
  timestamp: string;
  title: string;
  content: string;
  confidence: number; // 0-100
  tags: string[];
  metadata?: Record<string, unknown>;
}

// Pattern detection result
export interface PatternDetection {
  patternType: string;
  occurrences: number;
  strength: number; // 0-100
  description: string;
  examples: string[];
}

// Trend analysis result
export interface TrendAnalysis {
  trendType: string;
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // Percentage change
  period: string; // e.g., "last 24 hours"
  significance: 'low' | 'medium' | 'high';
}

export const useMemorySynthesisStore = defineStore('memorySynthesis', () => {
  // Synthesized memories storage
  const synthesizedMemories = ref<SynthesizedMemory[]>([]);

  // Pattern history for analysis
  const patternHistory = ref<Record<string, { count: number; lastSeen: string }[]>>({});

  // Computed: Get synthesized memories by type
  const memoriesByType = computed((): Record<string, SynthesizedMemory[]> => {
    const byType: Record<string, SynthesizedMemory[]> = {};
    synthesizedMemories.value.forEach(memory => {
      if (!byType[memory.type]) {
        byType[memory.type] = [];
      }
      byType[memory.type].push(memory);
    });
    return byType;
  });

  // Computed: Get recent synthesized memories (last 24 hours)
  const recentSyntheses = computed((): SynthesizedMemory[] => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return synthesizedMemories.value.filter(
      memory => new Date(memory.timestamp).getTime() > oneDayAgo
    );
  });

  // Computed: Get high-confidence insights (confidence > 70)
  const highConfidenceInsights = computed((): SynthesizedMemory[] => {
    return synthesizedMemories.value.filter(memory => memory.confidence > 70);
  });

  // Actions
  function addSynthesizedMemory(memory: Omit<SynthesizedMemory, 'id'>): void {
    const newMemory: SynthesizedMemory = {
      ...memory,
      id: `synth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    synthesizedMemories.value.push(newMemory);

    // Keep only last 500 synthesized memories
    if (synthesizedMemories.value.length > 500) {
      synthesizedMemories.value = synthesizedMemories.value.slice(-500);
    }
  }

  // Analyze pet status trends and generate insights
  function analyzePetStatusTrends(
    petId: string,
    currentStatus: PetStatus,
    previousStatus: PetStatus
  ): SynthesizedMemory | null {
    const changes: Record<string, number> = {};
    let hasSignificantChange = false;

    Object.keys(currentStatus).forEach(key => {
      const current = currentStatus[key as keyof PetStatus];
      const previous = previousStatus[key as keyof PetStatus];
      const change = current - previous;

      if (Math.abs(change) >= 10) {
        changes[key as string] = change;
        hasSignificantChange = true;
      }
    });

    if (!hasSignificantChange) return null;

    const changeDetails = Object.entries(changes)
      .map(([stat, amount]) => `${stat}: ${amount > 0 ? '+' : ''}${amount}`)
      .join(', ');

    return {
      id: '',
      type: 'trend_detection' as SynthesisType,
      petId,
      timestamp: new Date().toISOString(),
      title: 'Status Change Detected',
      content: `Pet status changed: ${changeDetails}`,
      confidence: Math.min(100, Math.abs(Object.values(changes).reduce((a, b) => a + Math.abs(b), 0))),
      tags: ['status', 'trend'],
      metadata: { changes, currentStatus, previousStatus },
    };
  }

  // Analyze conversation patterns
  function analyzeConversationPatterns(
    petId: string,
    conversations: Array<{ topic: string; content: string; timestamp: string }>,
    userInterests: string[]
  ): SynthesizedMemory | null {
    if (conversations.length === 0) return null;

    // Count topic occurrences
    const topicCounts: Record<string, number> = {};
    conversations.forEach(conv => {
      topicCounts[conv.topic] = (topicCounts[conv.topic] || 0) + 1;
    });

    // Find most common topics
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (sortedTopics.length === 0) return null;

    const commonTopics = sortedTopics.map(t => t[0]).join(', ');

    // Find knowledge connection
    const knowledgeConnections = sortedTopics
      .filter(([topic]) => userInterests.some(interest => topic.includes(interest)))
      .map(t => t[0]);

    let content = `Pet discussed: ${commonTopics}`;
    if (knowledgeConnections.length > 0) {
      content += `\nKey connections: ${knowledgeConnections.join(', ')}`;
    }

    return {
      id: '',
      type: 'pattern_analysis' as SynthesisType,
      petId,
      timestamp: new Date().toISOString(),
      title: 'Conversation Patterns',
      content,
      confidence: Math.min(100, (sortedTopics[0][1] / conversations.length) * 100),
      tags: ['conversation', 'patterns'],
      metadata: {
        topicCounts,
        knowledgeConnections,
        conversationCount: conversations.length,
      },
    };
  }

  // Detect emotional patterns
  function detectEmotionalPatterns(
    petId: string,
    emotions: Array<{ emotion: string; timestamp: string; reason?: string }>,
    status: PetStatus
  ): SynthesizedMemory | null {
    if (emotions.length === 0) return null;

    // Count emotion occurrences
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + 1;
    });

    // Find dominant emotion
    const dominantEmotion = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (!dominantEmotion) return null;

    let content = `Dominant emotion: ${dominantEmotion[0]} (${dominantEmotion[1]} times)`;

    // Add context based on status
    if (status.happiness < 40) {
      content += '\nNote: Low happiness may be affecting emotional state';
    }
    if (status.love < 40) {
      content += '\nNote: Love need may require attention';
    }

    return {
      id: '',
      type: 'emotional_pattern' as SynthesisType,
      petId,
      timestamp: new Date().toISOString(),
      title: 'Emotional Pattern',
      content,
      confidence: Math.min(100, (dominantEmotion[1] / emotions.length) * 100),
      tags: ['emotion', 'pattern'],
      metadata: {
        emotionCounts,
        dominantEmotion: dominantEmotion[0],
        status,
      },
    };
  }

  // Generate key insights from multiple data sources
  function generateKeyInsights(
    petId: string,
    status: PetStatus,
    conversations: string[],
    activities: string[]
  ): SynthesizedMemory | null {
    const insights: string[] = [];

    // Analyze status for insights
    if (status.hunger < 30) {
      insights.push('Pet is very hungry - needs feeding soon');
    }
    if (status.sleep < 30) {
      insights.push('Pet is very tired - needs rest');
    }
    if (status.love < 30) {
      insights.push('Pet feels lonely - needs affection');
    }
    if (status.knowledge > 70) {
      insights.push('Pet is eager to learn - good time for teaching');
    }

    if (insights.length === 0) return null;

    return {
      id: '',
      type: 'key_insight' as SynthesisType,
      petId,
      timestamp: new Date().toISOString(),
      title: 'Pet Insights',
      content: insights.join('\n'),
      confidence: 85,
      tags: ['insight', 'analysis'],
      metadata: { status, conversationCount: conversations.length, activityCount: activities.length },
    };
  }

  // Analyze pet snapshot for synthesis
  function analyzePetSnapshot(
    petId: string,
    snapshot: PetSnapshot
  ): SynthesizedMemory | null {
    const { stats } = snapshot;

    // Check for critical needs (using available stats)
    const criticalNeeds: string[] = [];
    if (stats.hunger < 30) criticalNeeds.push('hunger');
    if (stats.energy < 30) criticalNeeds.push('energy'); // energy instead of sleep
    if (stats.happiness < 30) criticalNeeds.push('happiness');
    if (stats.health < 30) criticalNeeds.push('health');

    if (criticalNeeds.length === 0) return null;

    return {
      id: '',
      type: 'trend_detection' as SynthesisType,
      petId,
      timestamp: new Date().toISOString(),
      title: 'Critical Needs Detected',
      content: `Pet has critical needs: ${criticalNeeds.join(', ')}`,
      confidence: 90,
      tags: ['critical', 'needs'],
      metadata: { criticalNeeds, snapshot },
    };
  }

  // Clear old synthesized memories
  function clearOldSyntheses(daysToKeep = 30): void {
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    synthesizedMemories.value = synthesizedMemories.value.filter(
      memory => new Date(memory.timestamp).getTime() > cutoffDate
    );
  }

  // Clear all synthesized memories
  function clearSyntheses(): void {
    synthesizedMemories.value = [];
  }

  return {
    synthesizedMemories,
    memoriesByType,
    recentSyntheses,
    highConfidenceInsights,
    addSynthesizedMemory,
    analyzePetStatusTrends,
    analyzeConversationPatterns,
    detectEmotionalPatterns,
    generateKeyInsights,
    analyzePetSnapshot,
    clearOldSyntheses,
    clearSyntheses,
  };
});
