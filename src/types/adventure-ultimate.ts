// Adventure Game Ultimate Types - "The Last Guardian"
// Extended types for advanced platformer mechanics

// === Base Types ===
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

// === Advanced Player State ===
export interface AdvancedPlayerState {
  position: Position;
  velocity: Velocity;
  onGround: boolean;
  wallSliding: boolean;
  wallJumpCooldown: number;
  airDashesRemaining: number;
  slideVelocity: number;
  isSliding: boolean;
  isStunned: boolean;
  stunTimer: number;
  facing: 'left' | 'right';
  invincible: boolean;
  invincibleTime: number;
  dead: boolean;
  win: boolean;
  health: number;
  maxHealth: number;
}

// === Extended Block Types ===
export type ExtendedBlockType =
  | 'air'
  | 'ground'
  | 'brick'
  | 'question'
  | 'pipe'
  | 'block'
  | 'hard'
  | 'flag'
  | 'weak'           // Breakable with slide kick
  | 'wood'           // Destructible
  | 'pressure_plate' // Interactive
  | 'moving_platform'; // Moving blocks

export interface ExtendedGameBlock {
  x: number;
  y: number;
  type: ExtendedBlockType;
  id?: string;
  hp?: number;        // For destructible blocks
  maxHp?: number;
  movingDirection?: 'horizontal' | 'vertical';
  movingRange?: number;
  movingSpeed?: number;
  movingOffset?: number;
  isPressed?: boolean; // For pressure plates
  pressureTimer?: number;
}

// === Extended Particle Types ===
export type ExtendedParticleType =
  | 'dust'
  | 'coin'
  | 'break'
  | 'explosion'
  | 'debris'
  | 'spark'
  | 'blood'
  | 'magic';

export interface ExtendedParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  type: ExtendedParticleType;
  size?: number;
  gravity?: boolean;
}

// === Screen Shake ===
export interface ScreenShake {
  intensity: number;
  decay: number;
}

// === Narrative & AI ===
export type UrgencyLevel = 'calm' | 'urgent' | 'desperate';
export type LevelPhase = 'exploration' | 'awakening' | 'collapse' | 'escape';

export interface NarrativeEvent {
  id?: string;
  trigger: string;  // 'phase_start', 'player_stuck', 'checkpoint', 'custom'
  message: string;
  urgency: UrgencyLevel;
  timestamp?: number;
}

// === Level Events ===
export interface LevelEvent {
  id: string;
  type: 'earthquake' | 'bridge_collapse' | 'lava_rise' | 'path_open' | 'wind_burst';
  triggerTime: number;
  duration: number;
  active: boolean;
  intensity: number;
  affectedArea?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

// === Extended Enemy ===
export type ExtendedEnemyType = 'goomba' | 'turtle' | 'plant' | 'boss' | 'falling_statue';

export interface ExtendedEnemy {
  id: string;
  type: ExtendedEnemyType;
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
  state?: 'patrol' | 'attack' | 'falling' | 'dead';
  attackPattern?: string;
}

// === Ultimate Level ===
export interface UltimateLevel {
  id: string;
  name: string;
  width: number;
  height: number;
  blocks: ExtendedGameBlock[];
  enemies: ExtendedEnemy[];
  spawnX: number;
  spawnY: number;
  flagX: number;
  flagY: number;
  background: 'temple' | 'temple_collapse' | 'temple_escape';
  difficulty: number;
  phaseTransitions: {
    phase: LevelPhase;
    time: number;
    message: string;
    urgency: UrgencyLevel;
  }[];
}

// === Game State ===
export interface UltimateGameState {
  phase: LevelPhase;
  startTime: number;
  currentTime: number;
  score: number;
  screenShake?: ScreenShake;
  narrativeQueue: NarrativeEvent[];
  events: LevelEvent[];
}

// === Helper Functions ===
export function isSolidBlock(block: ExtendedGameBlock): boolean {
  return block.type !== 'air' && block.type !== 'pressure_plate';
}

export function isDestructibleBlock(block: ExtendedGameBlock): boolean {
  return block.type === 'weak' || block.type === 'wood' || block.type === 'brick';
}

export function getBlockCollisionBox(block: ExtendedGameBlock): { x: number; y: number; width: number; height: number } {
  return {
    x: block.x,
    y: block.y,
    width: 1,
    height: block.type === 'pressure_plate' ? 0.2 : 1,
  };
}
