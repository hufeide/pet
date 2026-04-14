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
  personality?: string; // AI宠物性格描述
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

// 花园聊天消息
export interface GardenChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isSystem?: boolean;
}

// 宠物情绪状态
export type PetEmotion = 'Excited' | 'Melancholy' | 'Anxious' | 'Lazy' | 'Neutral';

// 情绪映射配置
export const EMOTION_MAP: Record<PetEmotion, { emoji: string; label: string; prompt: string; altEmojis: string[] }> = {
  Excited: {
    emoji: '✨',
    label: '兴奋',
    prompt: 'Use more exclamation marks and emojis. Be overly enthusiastic. Show high energy and eagerness.',
    altEmojis: ['🤩', '🎉', '⚡']
  },
  Melancholy: {
    emoji: '🌧️',
    label: '忧郁',
    prompt: 'Be quiet and slightly sad. Use soft, gentle language. May ask for comfort. Show low energy.',
    altEmojis: ['😔', '💔', '🌧️']
  },
  Anxious: {
    emoji: '😰',
    label: '焦虑',
    prompt: 'Use ellipses (...), express uncertainty or worry. Show nervousness and need for reassurance.',
    altEmojis: ['🌀', '😖', '💭']
  },
  Lazy: {
    emoji: '💤',
    label: '慵懒',
    prompt: 'Be terse, act like you are yawning, avoid complex topics. Show low energy and preference for rest.',
    altEmojis: ['🥱', '😴', '🛌']
  },
  Neutral: {
    emoji: '🙂',
    label: '平静',
    prompt: 'Maintain a balanced and natural tone. Be friendly and responsive without extreme emotions.',
    altEmojis: ['😌', '🙂', '🐾']
  },
};

// 宠物状态快照
export interface PetSnapshot {

  petId: string;
  level: number;
  name: string;
  form: string;
  experience: number;
  stats: {
    happiness: number;
    energy: number;
    play: number;
    love: number;
    knowledge: number;
    health: number;
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
export type NeedType = 'energy' | 'play' | 'love' | 'learn';

// Pet status at a point in time
export interface PetStatus {
  energy: number;
  play: number;
  love: number;
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
export type PetPersonalityTrait =
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
  traits: Record<PetPersonalityTrait, number>; // Score 0-100 for each trait
  keywords: Record<string, number>; // Words frequently used by user
  topics: Record<string, number>; // Topics user frequently discusses
  lastUpdated: string;
}

// Personality extraction from conversation
export interface PersonalityExtraction {
  petId: string;
  traits: Partial<Record<PetPersonalityTrait, number>>;
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

// User identity and preference profile
export interface UserProfile {
  id: string;
  petId: string;
  name: string;
  bio: string;
  preferences: string[];
  dislikes: string[];
  lastUpdated: string;
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

// Self-care action result
export interface SelfCareResult {
  action: string;
  message: string;
  statIncreased?: string;
}

// Need satisfaction phrase configurations
export const NEED_SATISFACTION_PATTERNS: NeedSatisfactionPattern[] = [
  {
    need: 'energy',
    keywords: ['休息', '能量', '恢复', 'rest', 'energy', 'recharge', 'sleep', 'nap'],
    phraseTemplates: [
      'Time to rest',
      'Let\'s recharge',
      'Take a break',
      'Have a rest',
    ],
    statIncrease: 30,
    description: 'Restores energy',
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
    keywords: ['爱', '喜欢', 'love', 'like', ' affection', 'hug', 'kiss', 'chat', 'talk'],
    phraseTemplates: [
      'I love you',
      'I like you',
      'You are loved',
      'Here is affection',
      'Let\'s chat',
      'I want to talk with you',
    ],
    statIncrease: 20,
    description: 'Satisfies love need',
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

// ==========================================
// Autonomous Goals Types
// ==========================================

// Goal types for autonomous pursuit
export type GoalType = 'learn' | 'social' | 'play' | 'rest' | 'explore';

// Goal status
export type GoalStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// Autonomous goal for pet to pursue
export interface Goal {
  id: string;
  petId: string;
  type: GoalType;
  title: string;
  description: string;
  targetValue: number; // Target stat value for completion
  currentProgress: number; // Current progress (0-100)
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  priority: number; // Based on urgency
  metadata?: Record<string, unknown>;
}
