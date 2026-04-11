// Pet Kingdom Types - Multiplayer pet interaction system

// 玩家信息
export interface PlayerInfo {
  id: string;
  name: string;
  level: number;
  avatar?: string;
  lastActive: string;
  petId: string;
}

// 在线玩家列表
export interface OnlinePlayer {
  playerId: string;
  petId: string;
  name: string;
  level: number;
  position: { x: number; y: number };
  lastUpdate: number;
}

// 互动类型
export type InteractionType = 'greet' | 'trade' | 'battle' | 'chat' | 'showoff';

// 互动记录
export interface InteractionRecord {
  id: string;
  type: InteractionType;
  withPlayerId: string;
  withPlayerName: string;
  result: 'success' | 'failed';
  experience: number;
  timestamp: string;
}

// 比赛/对战
export interface PetBattle {
  id: string;
  challengerId: string;
  challengerName: string;
  defenderId: string;
  defenderName: string;
  challengerPetLevel: number;
  defenderPetLevel: number;
  winnerId: string;
  experienceGained: number;
  timestamp: string;
}

// 宠物乐园位置
export interface PetParadiseLocation {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  type: 'meeting' | 'battle' | 'trade' | 'rest';
  capacity: number;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

// 宠物状态快照
export interface PetSnapshot {
  petId: string;
  level: number;
  name: string;
  form: string;
  experience: number;
  stats: {
    happiness: number;
    hunger: number;
    health: number;
    energy: number;
  };
  inventoryCount: number;
  timestamp: string;
}

// 交流话题
export interface ConversationTopic {
  id: string;
  title: string;
  category: 'master' | 'level' | 'battle' | 'general';
  questions: string[];
  difficulty: number;
}

// ==========================================
// Pet Memory & State Interaction System Types
// ==========================================

// Need types for pet needs
export type NeedType = 'eat' | 'sleep' | 'play' | 'love' | 'chat' | 'learn';

// Pet status at a point in time
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

// Status history record - tracks status changes over time
export interface PetStatusHistory {
  id: string;
  petId: string;
  timestamp: string;
  status: PetStatus;
  changes: Record<string, number>; // What changed from previous snapshot
  source: 'manual' | 'auto' | 'conversation'; // How this status was recorded
  conversationId?: string; // If from conversation, reference the message
}

// Personality traits that can be extracted from user behavior
export type PersonalityTrait =
  | 'friendly'
  | 'shy'
  | 'aggressive'
  | 'playful'
  | 'lazy'
  | 'curious'
  | 'greedy'
  | 'generous'
  | 'wise'
  | 'energetic'
  | 'analytical'
  | 'emotional'
  | 'practical'
  | 'creative';

// User personality profile extracted from conversations
export interface PersonalityProfile {
  id: string;
  petId: string;
  traits: Record<PersonalityTrait, number>; // Score 0-100 for each trait
  keywords: Record<string, number>; // Words frequently used by user
  topics: Record<string, number>; // Topics user frequently discusses
  lastUpdated: string;
}

// Personality extraction from conversation
export interface PersonalityExtraction {
  petId: string;
  traits: Partial<Record<PersonalityTrait, number>>;
  keywords: string[];
  topics: string[];
  confidence: number; // 0-100
  timestamp: string;
}

// Need satisfaction pattern for conversation detection
export interface NeedSatisfactionPattern {
  need: NeedType;
  keywords: string[];
  phraseTemplates: string[];
  statIncrease: number;
  description: string;
}

// Conversation memory with tags
export interface ConversationMemory {
  id: string;
  petId: string;
  messageId: string;
  content: string;
  tags: string[];
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

// Status trend for display
export interface StatusTrend {
  statName: string;
  currentValue: number;
  change24h: number;
  change7d: number;
  trend: 'up' | 'down' | 'stable';
}

// Conversation context for AI responses
export interface ConversationContext {
  petId: string;
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  petStatus: PetStatus;
  recentHistory: PetStatusHistory[];
  userInterests: string[];
  personality: PersonalityProfile;
}

// Need satisfaction phrase configurations
export const NEED_SATISFACTION_PATTERNS: NeedSatisfactionPattern[] = [
  {
    need: 'eat',
    keywords: ['喂', '食物', '吃', 'hungry', 'hunger', 'feed', 'food', 'meal'],
    phraseTemplates: [
      'I will feed you',
      'Here is some food',
      'Let\'s eat',
      'Time to eat',
    ],
    statIncrease: 20,
    description: 'Satisfies hunger need',
  },
  {
    need: 'sleep',
    keywords: ['睡觉', '休息', 'sleep', 'rest', 'bed', 'nap'],
    phraseTemplates: [
      'Time to sleep',
      'Go to bed',
      'Take a rest',
      'Have a nap',
    ],
    statIncrease: 20,
    description: 'Satisfies sleep need',
  },
  {
    need: 'play',
    keywords: ['玩', '游戏', 'play', 'game', 'fun', 'entertain', 'toy'],
    phraseTemplates: [
      'I will play with you',
      'Let\'s play a game',
      'Time to play',
      'Want to play?',
    ],
    statIncrease: 20,
    description: 'Satisfies play need',
  },
  {
    need: 'love',
    keywords: ['爱', '喜欢', 'love', 'like', ' affection', 'hug', 'kiss'],
    phraseTemplates: [
      'I love you',
      'I like you',
      'You are loved',
      'Here is affection',
    ],
    statIncrease: 20,
    description: 'Satisfies love need',
  },
  {
    need: 'chat',
    keywords: ['聊天', '聊天', 'chat', 'talk', 'conversation', 'speak'],
    phraseTemplates: [
      'Let\'s chat',
      'Time to talk',
      'I want to chat',
      'Let\'s have a conversation',
    ],
    statIncrease: 15,
    description: 'Satisfies chat need',
  },
  {
    need: 'learn',
    keywords: ['学习', '知识', 'learn', 'study', 'knowledge', 'education', 'teach'],
    phraseTemplates: [
      'Let\'s learn something',
      'Time to study',
      'I want to learn',
      'Teach me something',
    ],
    statIncrease: 20,
    description: 'Satisfies knowledge need',
  },
];
