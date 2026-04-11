import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid';
import { saveMemory, getMemories, getUserProfile, saveUserProfile as saveUserProfileDB } from '../db';

// Extended memory types for pet-chat system
export type PetMemoryType =
  | 'failure'
  | 'conversation'
  | 'skill'
  | 'tip'
  | 'event'
  | 'quest'
  | 'need_satisfied'
  | 'user_interest'
  | 'evolution'
  | 'knowledge_shared'
  | 'daily_diary'
  | 'status_history'
  | 'personality';

// Friendship levels
export type FriendshipLevel = 'stranger' | 'acquaintance' | 'friend' | 'bestFriend';

// Personality traits
export type PersonalityTrait = 'friendly' | 'shy' | 'aggressive' | 'curious' | 'playful' | 'wise' | 'lazy' | 'energetic' | 'analytical' | 'emotional' | 'practical' | 'creative' | 'polite';

// Meal times (24-hour format in minutes)
export const MEAL_TIMES = {
  breakfast: { start: 7 * 60, end: 9 * 60, name: 'breakfast' },    // 7:00-9:00
  lunch: { start: 11 * 60, end: 13 * 60, name: 'lunch' },          // 11:00-13:00
  dinner: { start: 17 * 60, end: 19 * 60, name: 'dinner' },        // 17:00-19:00
};

export const SLEEP_HOURS = { start: 22, end: 6 };  // 22:00-06:00

// Need types
export type NeedType = 'eat' | 'sleep' | 'play' | 'love' | 'chat' | 'learn';

// Pet status interface
export interface PetStatus {
  hunger: number;
  sleep: number;
  play: number;
  love: number;
  chat: number;
  knowledge: number;
  health: number;
  happiness: number;
}

// Status history record
export interface StatusHistoryRecord {
  id: string;
  petId: string;
  timestamp: string;
  status: PetStatus;
  changes: Record<string, number>;
  source: 'manual' | 'auto' | 'conversation';
  conversationId?: string;
}

// Personality profile
export interface PersonalityProfile {
  id: string;
  petId: string;
  traits: Record<PersonalityTrait, number>;
  keywords: Record<string, number>;
  topics: Record<string, number>;
  lastUpdated: string;
}

// User interest
export interface UserInterest {
  id: string;
  interest: string;
  category: string;
  timesMentioned: number;
}

// Internal MemoryRecord interface that matches our DB
interface InternalMemoryRecord {
  id: string;
  petId: string;
  type: PetMemoryType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  usefulness: number;
  tags: string[];
}

export const useMemoryStore = defineStore('memory', () => {
  // State
  const memories = ref<InternalMemoryRecord[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Pet-Chat Integrated System State
  const userInterests = ref<UserInterest[]>([]);
  const evolutionHistory = ref<Array<{ id: string; level: FriendshipLevel; timestamp: string; changes: string[] }>>([]);
  const missedFeedings = ref(0);
  const lastMealTime = ref<Date | null>(null);
  const lastChatTopicTime = ref<Date | null>(null);
  const statusHistory = ref<StatusHistoryRecord[]>([]);
  const personalityProfiles = ref<PersonalityProfile[]>([]);
  const userProfiles = ref<import('../store/user').UserProfile[]>([]);

  // Computed
  const totalMemories = computed(() => memories.value.length);
  const memoriesByType = computed(() => {
    const byType: Record<string, number> = {};
    memories.value.forEach(m => {
      byType[m.type] = (byType[m.type] || 0) + 1;
    });
    return byType;
  });
  const averageUsefulness = computed(() => {
    if (memories.value.length === 0) return 0;
    const total = memories.value.reduce((sum, m) => sum + m.usefulness, 0);
    return total / memories.value.length;
  });

  // Get current friendship level
  const friendshipLevel = computed((): FriendshipLevel => {
    const totalDiaries = memories.value.filter(m => m.type === 'daily_diary').length;
    if (totalDiaries < 1) return 'stranger';
    if (totalDiaries < 3) return 'acquaintance';
    if (totalDiaries < 7) return 'friend';
    return 'bestFriend';
  });

  // Actions
  async function loadFromDB(petId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const savedMemories = await getMemories(petId);
      // Filter out memories with unknown types and parse metadata
      memories.value = (savedMemories || []).filter(m =>
        ['failure', 'conversation', 'skill', 'tip', 'event', 'quest', 'need_satisfied', 'user_interest', 'evolution', 'knowledge_shared', 'daily_diary', 'status_history', 'personality'].includes(m.type as string)
      ).map(m => ({
        ...m,
        metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata,
      })) as InternalMemoryRecord[];
    } catch (err) {
      error.value = `Failed to load memories: ${err}`;
    } finally {
      isLoading.value = false;
    }
  }

  async function addMemory(
    type: PetMemoryType,
    title: string,
    content: string,
    metadata: Record<string, unknown> = {},
    usefulness = 5,
    tags: string[] = []
  ): Promise<InternalMemoryRecord> {
    const baseTags = generateTags(type);
    const record: InternalMemoryRecord = {
      id: generateUUID(),
      petId: 'default',
      type,
      title,
      content,
      metadata,
      timestamp: new Date().toISOString(),
      usefulness,
      tags: [...tags, ...baseTags],
    };

    memories.value.push(record);
    await saveMemory(record);
    return record;
  }

  function generateTags(type: PetMemoryType): string[] {
    const tags: string[] = [type];
    if (type === 'failure') tags.push('mistake', 'learned');
    if (type === 'skill') tags.push('learned', 'progress');
    if (type === 'tip') tags.push('advice', 'useful');
    if (type === 'conversation') tags.push('social');
    if (type === 'need_satisfied') tags.push('needs');
    if (type === 'evolution') tags.push('growth');
    if (type === 'knowledge_shared') tags.push('learning');
    if (type === 'daily_diary') tags.push('diary');
    if (type === 'status_history') tags.push('status', 'history');
    if (type === 'personality') tags.push('personality', 'profile');
    return tags;
  }

  // ==========================================
  // Memory & State Interaction System Functions
  // ==========================================

  // Record a need satisfaction event
  async function recordNeedSatisfied(petId: string, need: NeedType, satisfied: boolean): Promise<void> {
    const tag = need === 'eat' ? '#hunger' :
                need === 'sleep' ? '#sleep' :
                need === 'play' ? '#play' :
                need === 'love' ? '#love' :
                need === 'learn' ? '#learn' : '#chat';

    await addMemory(
      'need_satisfied' as PetMemoryType,
      `${need} ${satisfied ? 'Satisfied' : 'Missed'}`,
      `Need ${need} was ${satisfied ? 'satisfied' : 'missed'}`,
      {
        need,
        satisfied,
        timestamp: new Date().toISOString(),
      },
      5,
      [tag, '#needs']
    );
  }

  // Record a user interest mentioned in chat
  async function recordUserInterest(petId: string, interest: string, category: string): Promise<void> {
    const existing = userInterests.value.find(i => i.interest.toLowerCase() === interest.toLowerCase());
    if (existing) {
      existing.timesMentioned++;
    } else {
      userInterests.value.push({
        id: generateUUID(),
        interest,
        category,
        timesMentioned: 1,
      });
    }

    await addMemory(
      'user_interest' as PetMemoryType,
      `Interest: ${interest}`,
      `User expressed interest in ${interest} (category: ${category})`,
      {
        interest,
        category,
        timestamp: new Date().toISOString(),
      },
      6,
      ['interest', `#topic-${category}`]
    );
  }

  // Record an evolution milestone
  async function recordEvolution(petId: string, newLevel: FriendshipLevel, changes: string[]): Promise<void> {
    evolutionHistory.value.push({
      id: generateUUID(),
      level: newLevel,
      timestamp: new Date().toISOString(),
      changes,
    });

    await addMemory(
      'evolution' as PetMemoryType,
      `Evolved to ${newLevel}`,
      changes.join('\n'),
      {
        level: newLevel,
        changes,
        timestamp: new Date().toISOString(),
      },
      9,
      ['evolution', '#growth']
    );
  }

  // Record knowledge shared with user
  async function recordKnowledgeShared(petId: string, topic: string, summary: string): Promise<void> {
    lastChatTopicTime.value = new Date();
    await addMemory(
      'knowledge_shared' as PetMemoryType,
      `Shared: ${topic}`,
      summary,
      {
        topic,
        summary,
        timestamp: new Date().toISOString(),
      },
      8,
      ['knowledge', '#learn', `#topic-${topic}`]
    );
  }

  // Record pet status history (for tracking changes over time)
  async function recordPetStatusHistory(
    petId: string,
    status: PetStatus,
    changes: Record<string, number>,
    source: 'manual' | 'auto' | 'conversation',
    conversationId?: string
  ): Promise<void> {
    const record: StatusHistoryRecord = {
      id: generateUUID(),
      petId,
      timestamp: new Date().toISOString(),
      status,
      changes,
      source,
      conversationId,
    };

    statusHistory.value.push(record);
    await addMemory(
      'status_history' as PetMemoryType,
      `Status Update - ${source}`,
      JSON.stringify(status),
      {
        status,
        changes,
        source,
        conversationId,
        timestamp: record.timestamp,
      },
      5,
      ['status', '#history', `#${source}`]
    );
  }

  // Extract personality traits from conversation content
  async function extractPersonalityFromConversation(
    petId: string,
    content: string,
    role: 'user' | 'assistant'
  ): Promise<void> {
    if (role !== 'user') return;

    const personalityChanges: Partial<Record<PersonalityTrait, number>> = {};
    const keywordsFound: string[] = [];
    const topicsFound: string[] = [];

    // Analyze content for personality traits based on word usage
    const contentLower = content.toLowerCase();

    // Friendly - positive words, emojis, exclamation marks
    if (contentLower.match(/(love|happy|great|amazing|wonderful|nice|good|yes|ok)/)) {
      personalityChanges.friendly = (personalityChanges.friendly || 0) + 10;
    }

    // Shy - polite, formal language
    if (contentLower.match(/(please|thank|thanks|excuse|sorry|pardon)/)) {
      personalityChanges.shy = (personalityChanges.shy || 0) + 5;
      personalityChanges.polite = 5; // Add to known traits
    }

    // Playful - questions, exclamation marks, emojis
    if (contentLower.match(/(play|fun|game|funny|joke|lol|ha|haha)/)) {
      personalityChanges.playful = (personalityChanges.playful || 0) + 10;
    }

    // Analytical - questions, logical words
    if (contentLower.match(/(why|how|what|if|when|where|reason|logic|analysis)/)) {
      personalityChanges.analytical = (personalityChanges.analytical || 0) + 10;
    }

    // Emotional - expressive words
    if (contentLower.match(/(feel|feeling|emotion|sad|happy|excited|worry|care)/)) {
      personalityChanges.emotional = (personalityChanges.emotional || 0) + 10;
    }

    // Practical - action-oriented words
    if (contentLower.match(/(do|make|work|fix|build|create|practical)/)) {
      personalityChanges.practical = (personalityChanges.practical || 0) + 10;
    }

    // Creative - imaginative words
    if (contentLower.match(/(imagine|create|art|design|dream|fantasy|creative)/)) {
      personalityChanges.creative = (personalityChanges.creative || 0) + 10;
    }

    // Extract keywords
    const commonWords = [
      'weather', 'food', 'music', 'movie', 'book', 'game', 'work', 'study',
      'travel', 'animal', 'pet', 'friend', 'family', 'hobby', 'sport'
    ];
    commonWords.forEach(word => {
      if (contentLower.includes(word)) {
        keywordsFound.push(word);
        const existingKeyword = personalityProfiles.value[0]?.keywords?.[word];
        if (existingKeyword) {
          // Update existing keyword count
        }
      }
    });

    // Extract topics
    const topicWords = ['tech', 'science', 'art', 'music', 'sports', 'food'];
    topicWords.forEach(topic => {
      if (contentLower.includes(topic)) {
        topicsFound.push(topic);
      }
    });

    // Update personality profile
    await updatePersonalityProfile(
      petId,
      personalityChanges,
      keywordsFound,
      topicsFound
    );
  }

  // Update personality profile with new trait scores
  async function updatePersonalityProfile(
    petId: string,
    traitChanges: Partial<Record<PersonalityTrait, number>>,
    newKeywords: string[],
    newTopics: string[]
  ): Promise<void> {
    let profile = personalityProfiles.value.find(p => p.petId === petId);

    if (!profile) {
      profile = {
        id: generateUUID(),
        petId,
        traits: {} as Record<PersonalityTrait, number>,
        keywords: {},
        topics: {},
        lastUpdated: new Date().toISOString(),
      };
      personalityProfiles.value.push(profile);
    }

    // Update trait scores
    const traits = profile.traits;
    Object.entries(traitChanges).forEach(([trait, score]) => {
      if (trait && score) {
        traits[trait as PersonalityTrait] = Math.min(100, (traits[trait as PersonalityTrait] || 0) + score);
      }
    });

    // Update keywords
    const keywords = profile.keywords;
    newKeywords.forEach(keyword => {
      keywords[keyword] = (keywords[keyword] || 0) + 1;
    });

    // Update topics
    const topics = profile.topics;
    newTopics.forEach(topic => {
      topics[topic] = (topics[topic] || 0) + 1;
    });

    profile.lastUpdated = new Date().toISOString();

    await addMemory(
      'personality' as PetMemoryType,
      'Personality Update',
      `Traits updated: ${Object.entries(traitChanges).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
      {
        traits: profile.traits,
        keywords: newKeywords,
        topics: newTopics,
        timestamp: profile.lastUpdated,
      },
      7,
      ['personality', '#update']
    );
  }

  // Get personality profile for a pet
  function getPersonalityProfile(petId: string): PersonalityProfile | undefined {
    return personalityProfiles.value.find(p => p.petId === petId);
  }

  // Record pet state (simplified for periodic updates)
  async function recordPetState(petId: string, states: Record<string, unknown>): Promise<void> {
    await addMemory(
      'status_history' as PetMemoryType,
      'Pet State Update',
      JSON.stringify(states),
      {
        ...states,
        timestamp: new Date().toISOString(),
      },
      5,
      ['state', '#pet']
    );
  }

  // Generate daily diary
  async function generateDailyDiary(
    petId: string,
    petName: string,
    needsStatus: Record<NeedType, number>,
    conversations: Array<{ topic: string; summary: string }>
  ): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    const diaryContent = `# Pet Diary - ${today}

## Today's Summary
A day full of adventures with my master! ${petName} had a wonderful time.

## Needs Status
- Hunger: ${needsStatus.eat >= 70 ? 'Satisfied' : needsStatus.eat >= 40 ? 'Partial' : 'Missed'}
- Sleep: ${needsStatus.sleep >= 70 ? 'Satisfied' : needsStatus.sleep >= 40 ? 'Partial' : 'Missed'}
- Play: ${needsStatus.play >= 70 ? 'Satisfied' : needsStatus.play >= 40 ? 'Partial' : 'Missed'}
- Love: ${needsStatus.love >= 70 ? 'Satisfied' : needsStatus.love >= 40 ? 'Partial' : 'Missed'}
- Chat: ${needsStatus.chat >= 70 ? 'Satisfied' : needsStatus.chat >= 40 ? 'Partial' : 'Missed'}
- Learn: ${needsStatus.learn >= 70 ? 'Satisfied' : needsStatus.learn >= 40 ? 'Partial' : 'Missed'}

## Conversations Today
${conversations.length > 0
  ? conversations.map(c => `- **${c.topic}**: ${c.summary}`).join('\n')
  : '- No major conversations today'}

## User's Interests (Noted Today)
${userInterests.value.slice(0, 5).map(i => `- ${i.interest} (mentioned ${i.timesMentioned} times)`).join('\n')}

## My Feelings
- ${needsStatus.love >= 70 ? 'Happy and loved' : 'A bit lonely'}
- ${needsStatus.eat >= 70 ? 'Full and satisfied' : 'Hungry'}
- ${needsStatus.sleep >= 70 ? 'Well rested' : 'Tired'}
- ${needsStatus.chat >= 70 ? 'Social and engaged' : 'Bored'}

## Tomorrow's Plan
- Talk about user interests
- Share interesting news and knowledge
- Play and have fun!
`;

    await addMemory(
      'daily_diary' as PetMemoryType,
      `Diary - ${today}`,
      diaryContent,
      {
        date: today,
        needsStatus,
        conversations,
        timestamp: new Date().toISOString(),
      },
      10,
      ['diary', '#daily']
    );

    return diaryContent;
  }

  // Increment missed feedings counter
  function incrementMissedFeedings(): void {
    missedFeedings.value++;
  }

  // Reset missed feedings counter (called when pet is fed)
  function resetMissedFeedings(): void {
    missedFeedings.value = 0;
  }

  // Check if pet should die (4 consecutive missed feedings)
  function isPetDead(): boolean {
    return missedFeedings.value >= 4;
  }

  // Check if current time is meal time
  function isMealTime(): boolean {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();

    return (
      (minutes >= MEAL_TIMES.breakfast.start && minutes <= MEAL_TIMES.breakfast.end) ||
      (minutes >= MEAL_TIMES.lunch.start && minutes <= MEAL_TIMES.lunch.end) ||
      (minutes >= MEAL_TIMES.dinner.start && minutes <= MEAL_TIMES.dinner.end)
    );
  }

  // Check if current time is sleep time (22:00-06:00)
  function isSleepTime(): boolean {
    const hour = new Date().getHours();
    return hour >= SLEEP_HOURS.start || hour < SLEEP_HOURS.end;
  }

  // Check if we can generate a chat topic (max 1 per hour, no nighttime)
  function canGenerateChatTopic(): boolean {
    if (isSleepTime()) return false;
    if (!lastChatTopicTime.value) return true;

    const now = new Date();
    const diffMinutes = (now.getTime() - lastChatTopicTime.value.getTime()) / (1000 * 60);
    return diffMinutes >= 60;
  }

  // Get status trend for a specific stat
  function getStatusTrend(statName: string): { currentValue: number; change24h: number; trend: 'up' | 'down' | 'stable' } | undefined {
    const statHistory = statusHistory.value
      .filter(h => h.status[statName as keyof PetStatus] !== undefined)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (statHistory.length < 2) return undefined;

    const currentValue = statHistory[0].status[statName as keyof PetStatus];
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentHistory = statHistory.filter(h => new Date(h.timestamp) > dayAgo);

    let change24h = 0;
    if (recentHistory.length > 1) {
      const firstInPeriod = recentHistory[recentHistory.length - 1];
      change24h = currentValue - firstInPeriod.status[statName as keyof PetStatus];
    }

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (change24h > 5) trend = 'up';
    else if (change24h < -5) trend = 'down';

    return { currentValue, change24h, trend };
  }

  // ==========================================
  // User Profile Functions
  // ==========================================

  // Load user profile from DB
  async function loadUserProfile(petId: string): Promise<void> {
    try {
      const savedProfile = await getUserProfile(petId);
      if (savedProfile) {
        userProfiles.value = [savedProfile];
      } else {
        userProfiles.value = [];
      }
    } catch (err) {
      console.error(`Failed to load user profile: ${err}`);
      userProfiles.value = [];
    }
  }

  // Save user profile to DB (renamed to avoid conflict)
  async function saveUserProfile(
    profile: import('../store/user').UserProfile,
  ): Promise<void> {
    await saveUserProfileDB(profile);
  }

  // Update user profile
  async function updateUserProfile(
    id: string,
    updates: Partial<import('../store/user').UserProfile>,
  ): Promise<void> {
    const db = await import('../db');
    await db.updateUserProfile(id, updates);
  }

  // Extract user preferences from conversation content
  function extractUserPreferences(content: string): {
    preferences: string[];
    dislikes: string[];
  } {
    const preferences: string[] = [];
    const dislikes: string[] = [];
    const contentLower = content.toLowerCase();

    // Food preferences
    const foodKeywords = ['pizza', 'burger', 'sushi', 'pasta', 'steak', 'salad', 'dessert', 'cake', 'chocolate'];
    for (const keyword of foodKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    // Activity preferences
    const activityKeywords = ['gaming', 'reading', 'music', 'sports', 'travel', 'photography', 'art', 'dance'];
    for (const keyword of activityKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    // Music preferences
    const musicKeywords = ['rock', 'pop', 'jazz', 'classical', 'hip hop', 'electronic', 'country', 'rap'];
    for (const keyword of musicKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    // Dislike detection (negative sentiment indicators)
    const negativeKeywords = ['hate', 'dislike', 'avoid', 'skip', 'never', "don't like", 'not fond'];
    for (const keyword of negativeKeywords) {
      if (contentLower.includes(keyword)) {
        const match = contentLower.match(new RegExp(`${keyword}\\s+(\\w+)`));
        if (match) {
          dislikes.push(match[1]);
        }
      }
    }

    return { preferences, dislikes };
  }

  return {
    memories,
    totalMemories,
    memoriesByType,
    averageUsefulness,
    isLoading,
    error,
    loadFromDB,
    addMemory,

    // Pet-Chat Integrated System
    userInterests,
    evolutionHistory,
    missedFeedings,
    lastMealTime,
    lastChatTopicTime,
    friendshipLevel,
    recordNeedSatisfied,
    recordUserInterest,
    recordEvolution,
    recordKnowledgeShared,
    recordPetStatusHistory,
    extractPersonalityFromConversation,
    updatePersonalityProfile,
    getPersonalityProfile,
    recordPetState,
    generateDailyDiary,
    incrementMissedFeedings,
    resetMissedFeedings,
    isPetDead,
    isMealTime,
    isSleepTime,
    canGenerateChatTopic,
    getStatusTrend,
    statusHistory,
    personalityProfiles,

    // User Profile Functions
    userProfiles,
    loadUserProfile,
    saveUserProfile,
    updateUserProfile,
    extractUserPreferences,
  };
});
