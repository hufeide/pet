// Memory System Types

export type MemoryType = 'failure' | 'conversation' | 'skill' | 'tip' | 'event' | 'quest';

export interface MemoryRecord {
  id: string;
  petId: string;
  type: MemoryType;
  title: string;
  content: string;
  metadata: {
    [key: string]: unknown;
  };
  timestamp: string;
  usefulness: number; // 1-10, self-assessed
  tags: string[];
}

export interface MemorySummary {
  totalMemories: number;
  failureCount: number;
  conversationCount: number;
  skillCount: number;
  tipCount: number;
  averageUsefulness: number;
  keyLearnings: string[];
  mostValuableMemory?: MemoryRecord;
}

export interface DiaryEntry {
  date: string;
  title: string;
  content: string;
  experienceGained: number;
  lessonsLearned: string[];
}

export interface ExperienceLibrary {
  tips: string[];
  skills: string[];
  lessons: string[];
  totalEntries: number;
  lastUpdated: string;
}
