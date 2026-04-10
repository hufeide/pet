import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid';
import { saveMemory, getMemories } from '../db';

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
  | 'daily_diary';

// Friendship levels
export type FriendshipLevel = 'stranger' | 'acquaintance' | 'friend' | 'bestFriend';

// Personality traits
export type PersonalityTrait = 'friendly' | 'shy' | 'aggressive' | 'curious' | 'playful' | 'wise' | 'lazy' | 'energetic';

// Meal times (24-hour format in minutes)
export const MEAL_TIMES = {
  breakfast: { start: 7 * 60, end: 9 * 60, name: 'breakfast' },    // 7:00-9:00
  lunch: { start: 11 * 60, end: 13 * 60, name: 'lunch' },          // 11:00-13:00
  dinner: { start: 17 * 60, end: 19 * 60, name: 'dinner' },        // 17:00-19:00
};

export const SLEEP_HOURS = { start: 22, end: 6 };  // 22:00-06:00

// Need types
export type NeedType = 'eat' | 'sleep' | 'play' | 'love' | 'chat' | 'learn';

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
  const userInterests = ref<Array<{ id: string; interest: string; category: string; timesMentioned: number }>>([]);
  const evolutionHistory = ref<Array<{ id: string; level: FriendshipLevel; timestamp: string; changes: string[] }>>([]);
  const missedFeedings = ref(0);
  const lastMealTime = ref<Date | null>(null);

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
      // Filter out memories with unknown types to avoid type errors
      // Type assertion is safe here because we filter by valid types
      memories.value = (savedMemories || []).filter(m =>
        ['failure', 'conversation', 'skill', 'tip', 'event', 'quest', 'need_satisfied', 'user_interest', 'evolution', 'knowledge_shared', 'daily_diary'].includes(m.type as string)
      ) as unknown as InternalMemoryRecord[];
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
    return tags;
  }

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

  // Record pet state
  async function recordPetState(petId: string, states: Record<string, unknown>): Promise<void> {
    await addMemory(
      'pet_state' as PetMemoryType,
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
    if (!lastMealTime.value) return true;

    const now = new Date();
    const diffMinutes = (now.getTime() - lastMealTime.value.getTime()) / (1000 * 60);
    return diffMinutes >= 60;
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
    friendshipLevel,
    recordNeedSatisfied,
    recordUserInterest,
    recordEvolution,
    recordKnowledgeShared,
    recordPetState,
    generateDailyDiary,
    incrementMissedFeedings,
    resetMissedFeedings,
    isPetDead,
    isMealTime,
    isSleepTime,
    canGenerateChatTopic,
  };
});
