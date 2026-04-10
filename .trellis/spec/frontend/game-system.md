# Game System

> Code-spec for pet mini-games: Adventure Game (platformer) and Social Game (LLM-driven).

---

## Overview

The AI Pet project includes two mini-game systems:

1. **Adventure Game** - Super Mario-style platformer with levels, enemies, and platforming challenges
2. **Social Game** - LLM-driven social interactions with role-playing characters (boss, tourists, merchants)

Both games run in the "Pet Paradise" - a shared space where multiple players' pets interact.

---

## 1. Adventure Game (Platformer)

### 1.1 Scope / Trigger
- **Trigger**: Implementing Super Mario-style platformer mechanics for pet evolution
- **Purpose**: Allow pets to navigate levels, avoid/enemy encounters, collect coins, and reach goal flags

### 1.2 Signatures

#### Adventure Game Store
```typescript
// src/store/adventure.ts
export interface Physics {
  position: Position;
  velocity: Velocity;
  onGround: boolean;
  facing: Direction;
}

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

export const useAdventureStore = defineStore('adventure', () => ({
  currentLevel: ref<Level>,
  player: ref<PlayerState>,
  enemies: ref<Enemy[]>,
  particles: ref<Particle[]>,
  
  actions: {
    initLevel(levelIndex: number): void;
    handleKeyDown(key: string): void;
    handleKeyUp(key: string): void;
    update(dt: number): void;
    winLevel(): void;
    getLevelReward(): LevelReward;
  }
}));
```

#### Game Types
```typescript
export type BlockType = 'air' | 'ground' | 'brick' | 'question' | 'pipe' | 'block' | 'hard' | 'flag';

export type EnemyType = 'goomba' | 'turtle' | 'plant' | 'boss';

export interface GameBlock {
  x: number;
  y: number;
  type: BlockType;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  patrolStart: number;
  patrolEnd: number;
  alive: boolean;
}

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
```

#### Level Result
```typescript
export interface LevelResult {
  levelId: string;
  completed: boolean;
  time: number;
  coinsCollected: number;
  enemiesDefeated: number;
  damageTaken: number;
  score: number;
}

export interface FailureRecord {
  id: string;
  petId: string;
  levelId: string;
  location: Position;
  reason: string; // 'hit-by-enemy', 'fell', 'time-out'
  timestamp: string;
  experienceLearned: number;
}

### 1.3 Contracts

#### Movement & Physics
- Player moves horizontally with velocity x: -3 to 3
- Gravity applies constant downward acceleration (0.5)
- Jump applies upward velocity (-10)
- Player can only jump when onGround is true

#### Collision Detection
```typescript
function checkCollision(r1: { x, y, width, height }, r2: { x, y, width, height }): boolean {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}
```

#### Enemy Types
| Type | Behavior | HP | Reward |
|------|----------|-----|--------|
| goomba | Patrols left/right | 1 | 200 pts |
| turtle | Patrols, slower | 1 | 250 pts |
| plant | Stationary, shoots | 2 | 300 pts |
| boss | Pattern-based attack | 3+ | 1000 pts |

### 1.4 Validation & Error Matrix

| Condition | Error/Behavior |
|-----------|----------------|
| Player falls off map | Die, lose life, reset to spawn |
| Player hits enemy (not jump) | Take damage, lose life |
| Player runs out of lives | Game over, failure recorded |
| Player reaches flag | Level complete, reward given |
| Invalid level index | Reset to level 1 |
| Inventory full (for items) | Cannot collect, show notification |

### 1.5 Good/Base/Bad Cases

#### Good: Physics-Based Movement
```typescript
// src/store/adventure.ts
function update(dt: number): void {
  // Gravity
  player.velocity.y += gravity;
  
  // Horizontal movement
  if (keys['ArrowLeft']) {
    player.velocity.x = -speed;
    player.facing = 'left';
  }
  if (keys['ArrowRight']) {
    player.velocity.x = speed;
    player.facing = 'right';
  }
  
  // Apply velocity
  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;
  
  // Ground collision
  blocks.forEach(block => {
    if (checkCollision(playerRect, blockRect)) {
      if (player.velocity.y > 0 && player.position.y - player.velocity.y + 1 <= block.y) {
        player.position.y = block.y - 1;
        player.velocity.y = 0;
        player.onGround = true;
      }
    }
  });
}

### 1.4 Validation & Error Matrix

| Condition | Error/Behavior |
|-----------|----------------|
| Player falls off map | Die, lose life, reset to spawn |
| Player hits enemy (not jump) | Take damage, lose life |
| Player runs out of lives | Game over, failure recorded |
| Player reaches flag | Level complete, reward given |
| Invalid level index | Reset to level 1 |
| Inventory full (for items) | Cannot collect, show notification |

### 1.5 Good/Base/Bad Cases

#### Good: Physics-Based Movement
```typescript
// src/store/adventure.ts
function update(dt: number): void {
  // Gravity
  player.velocity.y += gravity;
  
  // Horizontal movement
  if (keys['ArrowLeft']) {
    player.velocity.x = -speed;
    player.facing = 'left';
  }
  if (keys['ArrowRight']) {
    player.velocity.x = speed;
    player.facing = 'right';
  }
  
  // Apply velocity
  player.position.x += player.velocity.x;
  player.position.y += player.velocity.y;
  
  // Ground collision
  blocks.forEach(block => {
    if (checkCollision(playerRect, blockRect)) {
      if (player.velocity.y > 0 && player.position.y - player.velocity.y + 1 <= block.y) {
        player.position.y = block.y - 1;
        player.velocity.y = 0;
        player.onGround = true;
      }
    }
  });
}

### 1.5 Good/Base/Bad Cases

#### Good: Experience from Failure
```typescript
// src/store/adventure.ts
function recordFailure(location: { x: number; y: number }, reason: string): void {
  const experienceLearned = calculateExperienceFromMistake(reason);
  
  failureRecords.push({
    id: generateUUID(),
    location,
    reason,
    timestamp: new Date().toISOString(),
    experienceLearned,
  });
  
  // Add experience to pet for learning
  petStore.gainExperience(experienceLearned);
  
  // Save to database for long-term memory
  db.saveFailureRecord({
    petId: petStore.id,
    ...failureRecords[failureRecords.length - 1],
  });
}
```

#### Base: Basic Adventure Flow
```typescript
async function explore(): Promise<AdventureResult> {
  if (petStore.stats.energy < 10) {
    return { success: false, message: 'Pet is too tired to explore' };
  }
  
  const newLocation = calculateRandomMove(currentLocation);
  const discovery = checkForDiscovery(newLocation);
  
  petStore.stats.energy -= 10;
  petStore.gainExperience(5);
  
  return {
    success: true,
    message: `Explored ${discovery?.name || 'new area'}`,
    discovery,
  };
}
```

#### Bad: No Experience from Failure
```typescript
// Bad - player doesn't learn from mistakes
function recordFailure(location: { x: number; y: number }, reason: string): void {
  failureRecords.push({ ... }); // Just records, no experience gain
  // Pet doesn't evolve from the mistake
}
```

### 1.6 Tests Required

1. **Unit Tests**
   - Movement validation (boundaries, obstacles)
   - Experience calculation from failures
   - Quest progress tracking

2. **Integration Tests**
   - Adventure flow: explore → discover → quest
   - Battle flow: encounter → fight → result → evolution

3. **E2E Tests**
   - Complete adventure session
   - Failure → learn → evolve chain

### 1.7 Wrong vs Correct

#### Wrong: Missing Failure Memory
```typescript
// Bad - failures not saved to database
function recordFailure(reason: string): void {
  failureRecords.push({ reason });
  // Missing: petId, location, long-term storage
}
```

#### Correct: Comprehensive Failure Tracking
```typescript
// Good - all failure data persisted
function recordFailure(reason: string): void {
  const record: FailureRecord = {
    id: generateUUID(),
    petId: petStore.id,
    location: currentLocation,
    reason,
    timestamp: new Date().toISOString(),
    experienceLearned: calculateExperienceFromMistake(reason),
  };
  
  failureRecords.push(record);
  db.saveFailureRecord(record);
  petStore.gainExperience(record.experienceLearned);
}
```

---

## 2. Social Game

### 2.1 Scope / Trigger
- **Trigger**: Implementing LLM-driven social interactions for pet evolution
- **Purpose**: Allow pets to interact with characters (boss, tourists, etc.) and learn

### 2.2 Signatures

#### Social Game Store
```typescript
// src/store/social.ts
export interface SocialState {
  currentScenario: string;
  characters: SocialCharacter[];
  conversations: ConversationRecord[];
  learnedSkills: string[];
}

export const useSocialStore = defineStore('social', {
  state: (): SocialState => ({ ... }),
  actions: {
    interact(characterId: string, response: string): Promise<SocialResult>;
    learnFromConversation(conversation: ConversationRecord): void;
    getScenarioForLevel(level: number): SocialScenario;
  }
});
```

#### Character System
```typescript
export interface SocialCharacter {
  id: string;
  role: 'boss' | 'tourist' | 'merchant' | 'local' | 'rival';
  name: string;
  personality: string[];
  questions: string[];
  difficulty: number; // 1-10, based on pet level
}

export interface ConversationRecord {
  id: string;
  characterId: string;
  characterRole: string;
  questionsAnswered: { question: string; answer: string }[];
  success: boolean;
  experience: number;
  learnedTips: string[];
  timestamp: string;
}
```

### 2.3 Contracts

#### SocialResult
```typescript
export interface SocialResult {
  success: boolean;
  characterReaction: string;
  experience: number;
  learnedTips: string[];
  newQuestions?: string[]; // New questions character asks
}
```

#### SocialScenario
```typescript
export interface SocialScenario {
  id: string;
  title: string;
  description: string;
  characters: SocialCharacter[];
  difficulty: number;
  maxLevel: number; // Max pet level for this scenario
  experienceBase: number;
}
```

### 2.4 Validation & Error Matrix

| Condition | Error/Behavior |
|-----------|----------------|
| Pet level too high for scenario | Show warning, scenario too easy |
| Invalid character interaction | No response, log warning |
| Poor response quality | Lower success rate, less experience |
| Conversation completed | Experience distributed, tips learned |

### 2.5 Good/Base/Bad Cases

#### Good: LLM-Driven Social Interaction
```typescript
// src/store/social.ts
async function interact(characterId: string, response: string): Promise<SocialResult> {
  const character = characters.find(c => c.id === characterId);
  if (!character) {
    return { success: false, characterReaction: 'Character not found', experience: 0, learnedTips: [] };
  }

  // Get LLM to evaluate the response
  const evaluation = await llmClient.chatWithResponse([
    { role: 'system', content: socialSystemPrompt(character) },
    { role: 'user', content: `Your response: ${response}` },
  ]);

  const success = evaluateSuccess(evaluation.data, character.difficulty);
  const experience = calculateExperience(success, character.difficulty);
  const learnedTips = extractTips(evaluation.data);

  // Save conversation for long-term memory
  const record: ConversationRecord = {
    id: generateUUID(),
    characterId,
    characterRole: character.role,
    questionsAnswered: currentQuestions.map(q => ({ question: q, answer: response })),
    success,
    experience,
    learnedTips,
    timestamp: new Date().toISOString(),
  };
  
  conversations.push(record);
  db.saveConversation(record);

  if (success) {
    petStore.gainExperience(experience);
  }

  return {
    success,
    characterReaction: generateCharacterReaction(success, character),
    experience,
    learnedTips,
  };
}
```

#### Base: Dynamic Scenario Generation
```typescript
function getScenarioForLevel(level: number): SocialScenario {
  // Scenarios scale with pet level
  const scenarios = [
    { minLevel: 1, maxLevel: 3, characters: ['tourist'] },
    { minLevel: 4, maxLevel: 7, characters: ['tourist', 'merchant'] },
    { minLevel: 8, maxLevel: 10, characters: ['boss', 'rival'] },
  ];

  const suitable = scenarios.find(s => level >= s.minLevel && level <= s.maxLevel);
  return createScenario(suitable || scenarios[0], level);
}
```

#### Bad: Hardcoded Responses
```typescript
// Bad - no LLM involvement
function interact(characterId: string, response: string): SocialResult {
  // Just checks keywords, no actual social simulation
  if (response.includes('hello')) return { success: true, ... };
  if (response.includes('buy')) return { success: true, ... };
  return { success: false, ... };
}
```

### 2.6 Tests Required

1. **Unit Tests**
   - LLM response evaluation
   - Experience calculation based on difficulty
   - Tip extraction from responses

2. **Integration Tests**
   - Full social interaction flow
   - Scenario scaling with pet level

3. **E2E Tests**
   - Complete social session with multiple characters
   - Learning chain: interact → learn → evolve

### 2.7 Wrong vs Correct

#### Wrong: No Long-Term Memory
```typescript
// Bad - conversations not saved
async function interact(characterId: string, response: string): Promise<SocialResult> {
  const result = await llmClient.chat(...);
  petStore.gainExperience(result.experience);
  // Missing: save conversation, track learned tips long-term
  return result;
}
```

#### Correct: Comprehensive Social Tracking
```typescript
// Good - all social data persisted and used
async function interact(characterId: string, response: string): Promise<SocialResult> {
  const result = await llmClient.chatWithResponse([...]);
  
  const record: ConversationRecord = {
    id: generateUUID(),
    characterId,
    characterRole: character.role,
    questionsAnswered: currentQuestions.map(q => ({ question: q, answer: response })),
    success: result.success,
    experience: result.experience,
    learnedTips: extractTips(result.data),
    timestamp: new Date().toISOString(),
  };
  
  conversations.push(record);
  db.saveConversation(record); // Long-term persistence
  
  // Update learned skills for future interactions
  result.learnedTips.forEach(tip => {
    if (!learnedSkills.includes(tip)) {
      learnedSkills.push(tip);
    }
  });
  
  return { ...result, learnedTips: result.learnedTips };
}
```

---

## 3. Shared Concepts

### 3.1 Pet Paradise Architecture
```
src/
├── store/
│   ├── adventure.ts    # Adventure game state
│   ├── social.ts       # Social game state
│   └── memory.ts       # Long-term memory storage
├── types/
│   ├── adventure.d.ts  # Adventure types
│   ├── social.d.ts     # Social types
│   └── memory.d.ts     # Memory types
└── utils/
    ├── adventure.ts    # Adventure helpers
    ├── social.ts       # Social helpers
    └── memory.ts       # Memory helpers
```

### 3.2 Experience System

#### Total Experience Formula
```typescript
function calculateTotalExperience(): number {
  // Base experience from all sources
  const baseExperience = 
    petStore.experience + 
    adventureStore.totalExperience +
    socialStore.totalExperience;
  
  // Bonus from successful social interactions
  const socialBonus = socialStore.learnedSkills.length * 5;
  
  // Penalty from frequent failures (encourages learning)
  const failurePenalty = failureStore.records.length > 10 ? -10 : 0;
  
  return baseExperience + socialBonus + failurePenalty;
}
```

### 3.3 Long-Term Memory System

#### Memory Storage
```typescript
// src/db/memory.ts
export interface MemoryRecord {
  id: string;
  petId: string;
  type: 'failure' | 'conversation' | 'skill' | 'tip';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  usefulness: number; // 1-10, self-assessed
}

export function saveMemory(record: MemoryRecord): void {
  const db = getDB();
  db.prepare('INSERT INTO memories ...').run(record);
}

export function getMemories(petId: string, type?: string): MemoryRecord[] {
  const query = type 
    ? 'SELECT * FROM memories WHERE petId = ? AND type = ?'
    : 'SELECT * FROM memories WHERE petId = ?';
  return db.prepare(query).all(petId);
}

export function summarizeMemories(petId: string): MemorySummary {
  const failures = getMemories(petId, 'failure');
  const conversations = getMemories(petId, 'conversation');
  
  return {
    failureCount: failures.length,
    conversationCount: conversations.length,
    averageUsefulness: calculateAverageUsefulness(conversations),
    keyLearnings: extractKeyLearnings(conversations),
  };
}
```

### 3.4 Diaries and Experience Library

#### Diary Generation
```typescript
// src/utils/diary.ts
export function generateDiary(petId: string, period: 'daily' | 'weekly' | 'monthly'): string {
  const memories = getMemories(petId);
  const filtered = filterByPeriod(memories, period);
  
  const sections = {
    adventures: filtered.filter(m => m.type === 'failure'),
    social: filtered.filter(m => m.type === 'conversation'),
    learnings: filtered.filter(m => m.type === 'tip'),
  };
  
  return `
# Diary: ${period} Report
## Adventures
${sections.adventures.map(m => `- ${m.content}`).join('\n')}

## Social Interactions
${sections.social.map(m => `- ${m.content}`).join('\n')}

## Key Learnings
${sections.learnings.map(m => `- ${m.content}`).join('\n')}
  `;
}

export function getExperienceLibrary(petId: string): ExperienceLibrary {
  const memories = getMemories(petId);
  const tips = memories.filter(m => m.type === 'tip');
  const skills = memories.filter(m => m.type === 'skill');
  
  return {
    tips: tips.map(t => t.content),
    skills: skills.map(s => s.content),
    totalLessons: tips.length + skills.length,
  };
}
```

---

## 4. Anti-Patterns

| Pattern | Why Avoid |
|---------|-----------|
| No physics-based movement | Feels floaty/unrealistic, poor platforming feel |
| No persistence of failures | Player can't learn from mistakes |
| Hardcoded social responses | No dynamic interaction, repetitive |
| No experience from social interactions | Pets won't evolve through socializing |
| Separate experience pools | Confusing for players, hard to balance |
| No diary/experience library | Player can't review past experiences |
| No camera following | Player moves out of view, disorienting |
| No collision detection | Player walks through walls/platforms |

---

## 5. Platformer Game Patterns

### 5.1 Level Design
- Platforms at jumpable heights (3-5 blocks apart)
- Ground blocks every 12 units (jump distance)
- Question blocks placed at head height (y=5-7)
- Pipe obstacles at varying heights
- Flag pole at level end for goal

### 5.2 Enemy Placement
- Goombas: Start at x=40, spaced 35 units apart
- Turtles: Slower, wider patrol zones
- Plants: Above gaps, shoot projectiles
- Boss: At end of level 3, pattern-based attacks

### 5.3 Power-Up System
```typescript
// Future extension
interface PowerUp {
  type: 'mushroom' | 'flower' | 'star';
  effect: 'grow' | 'fireball' | 'invincibility';
  duration?: number;
}
```

---

## 6. Related Specifications

- [State Management](./state-management.md) - Pinia store patterns
- [Type Safety](./type-safety.md) - Type definitions
- [Component Guidelines](./component-guidelines.md) - UI components
