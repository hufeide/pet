// Social Game Types

export type CharacterRole = 'boss' | 'tourist' | 'merchant' | 'local' | 'rival' | 'guide';

export interface SocialCharacter {
  id: string;
  role: CharacterRole;
  name: string;
  personality: string[];
  dialogueStyle: 'formal' | 'casual' | 'aggressive' | 'friendly' | 'mysterious';
  questions: string[];
  difficulty: number; // 1-10, based on pet level
  responsePatterns: Record<string, string[]>; // emotion -> possible responses
}

export interface ConversationRecord {
  id: string;
  petId: string;
  characterId: string;
  characterRole: string;
  characterName: string;
  questionsAnswered: {
    question: string;
    answer: string;
    llmScore: number; // 0-100, how good was the answer
  }[];
  success: boolean;
  experience: number;
  learnedTips: string[];
  timestamp: string;
  mood: 'happy' | 'neutral' | 'sad' | 'angry';
}

export interface SocialResult {
  success: boolean;
  characterReaction: string;
  experience: number;
  learnedTips: string[];
  newQuestions?: string[];
  characterMoodChange?: 'positive' | 'negative' | 'neutral';
}

export interface SocialScenario {
  id: string;
  title: string;
  description: string;
  characters: SocialCharacter[];
  difficulty: number;
  maxLevel: number; // Max pet level for this scenario
  experienceBase: number;
  requiredStats?: {
    happiness?: number;
    energy?: number;
  };
}

export interface SocialState {
  currentScenario: SocialScenario | null;
  activeCharacters: SocialCharacter[];
  currentQuestions: string[];
  conversations: ConversationRecord[];
  learnedSkills: string[];
  relationshipScore: Record<string, number>; // characterId -> score
  totalExperience: number;
}
