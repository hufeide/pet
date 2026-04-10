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
