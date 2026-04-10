// Adventure Game Types - Platformer (like Super Mario)

export type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Physics {
  position: Position;
  velocity: Velocity;
  onGround: boolean;
  facing: Direction;
}

// 游戏方块类型
export type BlockType = 'air' | 'ground' | 'brick' | 'question' | 'pipe' | 'block' | 'hard' | 'flag';

export interface GameBlock {
  x: number;
  y: number;
  type: BlockType;
  id?: string;
}

// 敌人类型
export type EnemyType = 'goomba' | 'turtle' | 'plant' | 'boss';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  patrolStart: number;
  patrolEnd: number;
  alive: boolean;
  level: number;
}

// 粒子效果
export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  type: 'dust' | 'coin' | 'break';
}

// 玩家状态
export interface PlayerState {
  position: Position;
  velocity: Velocity;
  onGround: boolean;
  facing: Direction;
  invincible: boolean;
  invincibleTime: number;
  dead: boolean;
  win: boolean;
  coins: number;
  lives: number;
}

// 关卡数据
export interface Level {
  id: string;
  name: string;
  width: number;
  height: number;
  blocks: GameBlock[];
  enemies: Enemy[];
  spawnX: number;
  spawnY: number;
  flagX: number;
  background: 'day' | 'night' | 'cave' | 'castle';
  difficulty: number;
}

// 闯关结果
export interface LevelResult {
  levelId: string;
  completed: boolean;
  time: number;
  coinsCollected: number;
  enemiesDefeated: number;
  damageTaken: number;
  score: number;
}

// 失败记录（用于记忆系统）
export interface FailureRecord {
  id: string;
  petId: string;
  levelId: string;
  location: Position;
  reason: string; // 'hit-by-enemy', 'fell', 'time-out'
  timestamp: string;
  experienceLearned: number;
}

// 项目奖励
export interface QuestReward {
  experience: number;
  items: string[];
  evolution?: string;
}

// 关卡奖励
export interface LevelReward {
  experience: number;
  coins: number;
  items: string[];
}
