# Autonomous AI Pet Life System - Refined Implementation Plan

## Goal
Transform the AI Pet from a reactive chatbot into a proactive, autonomous digital life-form with biological needs, evolving personality, and an independent knowledge-gathering system.

## Current Architecture Analysis

### Existing Components
1. **`src/store/pet.ts`**: Core pet state (stats, chat history, AI chat)
2. **`src/store/memory.ts`**: Memory system, personality profiles, user interests, friendship levels
3. **`src/store/pet-kingdom.ts`**: Pet needs system, 10-min heartbeat, proactive chat
4. **`src/services/heartbeat.ts`**: Biological decay mechanism (partially implemented)
5. **`src/components/Chat.vue`**: Chat UI with pet status panel
6. **`src/db/indexeddb.ts`**: IndexedDB persistence layer

### Key Interfaces Already Defined
- `PetStatus`: hunger, sleep, play, love, chat, knowledge, health, happiness
- `FriendshipLevel`: stranger → acquaintance → friend → bestFriend
- `PersonalityTrait`: friendly, shy, playful, analytical, etc.
- `MEAL_TIMES`: breakfast (7-9), lunch (11-13), dinner (17-19)
- `SLEEP_HOURS`: 22:00-06:00

---

## Phase 1: Core Biological System (Foundation)

### 1.1 Heartbeat Service Integration
**File**: `src/services/heartbeat.ts`

**Current State**: Basic decay implemented, but not integrated with `pet-kingdom` store

**Required Changes**:
```
- [ ] Integrate heartbeatService with usePetKingdomStore
- [ ] Replace hardcoded decay with configurable rates from pet-kingdom
- [ ] Add circadian rhythm awareness (faster decay during active hours)
- [ ] Implement "missed meal" detection aligned with MEAL_TIMES
- [ ] Add death condition: 4 consecutive missed meals → health = 0
```

**Implementation Details**:
```typescript
// Enhanced HeartbeatConfig
interface HeartbeatConfig {
  intervalMs: 600000; // 10 minutes
  decayRates: {
    hunger: { base: 5, mealTimePenalty: 10 };  // Extra decay if missed meal time
    energy: { base: 3, sleepPenalty: 15 };      // Extra decay if not sleeping
    happiness: { base: 2, loneliness: 5 };       // Extra if no interaction
    health: { base: 1, starvation: 10 };         // Extra if hunger < 20
  };
  thresholds: {
    critical: 20;    // Below this triggers penalties
    danger: 40;      // Below this shows warnings
  };
}
```

### 1.2 Need Satisfaction Detection
**File**: `src/types/pet-kingdom.ts` (create new)

**Required**:
```
- [ ] Define NEED_SATISFACTION_PATTERNS:
  - eat: ['喂', '食物', '吃', 'hungry', 'feed', 'food']
  - sleep: ['睡觉', '休息', 'sleep', 'rest', 'bed']
  - play: ['玩', '游戏', 'play', 'game', 'fun']
  - love: ['爱', '喜欢', 'love', 'hug', 'kiss']
  - chat: ['聊天', 'chat', 'talk']
  - learn: ['学习', '知识', 'learn', 'study']
- [ ] Each pattern maps to stat increase (10-20 points)
- [ ] Phrase templates for LLM detection (e.g., "I want to...", "Can we...")
```

**Integration**:
```
- [ ] Add detectNeedSatisfaction() to pet-kingdom store
- [ ] Call from Chat.vue on user message
- [ ] Show "Need Satisfaction" notification toast
- [ ] Record to memory as 'need_satisfied' type
```

---

## Phase 2: Proactive Behavior System

### 2.1 Pet Request System
**File**: `src/store/pet-kingdom.ts`

**Current State**: `petRequest` computed property exists but uses hardcoded strings

**Required Changes**:
```
- [ ] Replace hardcoded requests with LLM-generated messages
- [ ] Context-aware requests:
  - Hunger + Meal Time → "主人，到吃饭时间了，我肚子咕咕叫了！"
  - Hunger + Not Meal Time → "主人，我有点饿了..."
  - Sleep + Night → "主人，好困啊，想睡觉了..."
  - Play + Day → "主人，天气真好，陪我玩会儿吧！"
- [ ] Personality-aware tone (shy pet vs playful pet)
```

### 2.2 Autonomous Topic Generation
**File**: `src/store/pet-kingdom.ts` (existing `generateChatTopic`)

**Current State**: Basic implementation exists

**Required Enhancements**:
```
- [ ] Add user interest weighting (prioritize topics user mentioned)
- [ ] Add knowledge synthesis (combine 2+ interests into new topic)
- [ ] Add humor/curiosity injection
- [ ] Rate limiting: 1 topic per hour, no night (22:00-06:00)
- [ ] Track last topic time in memoryStore.lastChatTopicTime
```

**Example Flow**:
```
User mentions: "I like cooking and jazz music"
Pet generates: "主人，我想到一个有趣的事！如果把爵士乐的即兴精神用到烹饪里，
               会不会创造出像'摇摆牛排'这样的菜？🎷🥩"
```

### 2.3 Knowledge Sharing System
**File**: `src/services/knowledge-sharing.ts` (create new)

**Required**:
```
- [ ] shouldShareKnowledge(lastTime): boolean
  - Max 1 per hour
  - No sharing during sleep hours
  - Only if user hasn't initiated chat in 30 mins
- [ ] generateKnowledgeShare(): { topic, content }
  - Fetch from user interests
  - Generate "Did you know..." style facts
  - Include emoji and conversational tone
```

---

## Phase 3: Evolution & Personality System

### 3.1 Friendship Level Evolution
**File**: `src/store/memory.ts`

**Current State**: `friendshipLevel` computed from diary count

**Required Changes**:
```
- [ ] Multi-factor evolution:
  - Daily diaries written (existing)
  - Total interactions (chat messages)
  - Needs satisfied ratio
  - Knowledge shared count
- [ ] Evolution thresholds:
  - Stranger → Acquaintance: 1 diary + 10 interactions
  - Acquaintance → Friend: 3 diaries + 30 interactions
  - Friend → BestFriend: 7 diaries + 100 interactions
- [ ] Evolution memory records with unlockable behaviors
```

### 3.2 Dynamic Personality Adaptation
**File**: `src/store/memory.ts` (existing `extractPersonalityFromConversation`)

**Current State**: Basic keyword matching

**Required Enhancements**:
```
- [ ] LLM-based personality inference:
  - Analyze conversation tone (formal vs casual)
  - Detect user's emotional state
  - Adjust pet's response style accordingly
- [ ] Personality trait decay:
  - Unused traits slowly decrease (max 1 point per day)
  - Prevents personality from becoming static
- [ ] Personality display in Chat UI (show top 3 traits)
```

### 3.3 Self-Care Mode
**File**: `src/store/pet-kingdom.ts`

**Required**:
```
- [ ] selfCare() function:
  - If hunger < 30 → "我去吃点东西"
  - If sleep < 30 → "我去睡一会儿"
  - If play < 30 → "我找点玩具玩"
- [ ] Trigger when user inactive for 2 hours
- [ ] Record as 'event' memory type
```

---

## Phase 4: Memory & Daily Journal

### 4.1 Daily Diary Generation
**File**: `src/store/memory.ts` (existing `generateDailyDiary`)

**Current State**: Basic template exists

**Required Enhancements**:
```
- [ ] LLM-enhanced diary:
  - Summarize day's events
  - Reflect on personality changes
  - Express feelings about user interactions
  - Preview tomorrow's goals
- [ ] Schedule at 23:59 daily
- [ ] Store as 'daily_diary' memory type
- [ ] Trigger evolution check after diary
```

**Example Diary Structure**:
```
# 2026-04-11 日记

## 今日总结
今天和主人聊了 3 次，学到了关于"咖啡"的知识...

## 需求状态
- 吃饭：满足 ✅
- 睡觉：部分满足 ⚠️
- 玩耍：未满足 ❌

## 心情记录
今天主人很忙，但我理解...

## 明日计划
- 想和主人聊聊音乐
- 希望能玩一会儿
```

### 4.2 Memory Retrieval System
**File**: `src/store/memory.ts`

**Required**:
```
- [ ] getMemoriesByTag(tag: string): MemoryRecord[]
- [ ] getMemoriesByType(type: PetMemoryType): MemoryRecord[]
- [ ] getRecentMemories(limit: number, days: number)
- [ ] Use in system prompt to provide conversation context
```

---

## Phase 5: UI Enhancements

### 5.1 Pet Status Panel Improvements
**File**: `src/components/Chat.vue`

**Current State**: Shows 6 stats + 3 needs

**Required Additions**:
```
- [ ] Show current friendship level badge
- [ ] Show top 3 personality traits
- [ ] Show "Last fed" timestamp
- [ ] Show "Next meal time" countdown
- [ ] Urgent need indicators (red pulsing border)
- [ ] Pet request banner (when need < 30)
```

### 5.2 Need Help Modal
**File**: `src/components/NeedHelpModal.vue` (create new)

**Required**:
```
- [ ] Explain each need type
- [ ] Show how to satisfy each need
- [ ] Show current status trend (up/down arrow)
- [ ] Examples:
  - Hunger: "喂食或聊天中提到食物"
  - Sleep: "让宠物睡觉或休息"
  - Love: "表达爱意或抚摸"
```

### 5.3 Memory View Component
**File**: `src/components/MemoryView.vue` (create new)

**Required**:
```
- [ ] Filter by type (diary, conversation, evolution)
- [ ] Filter by tag
- [ ] Search functionality
- [ ] Export to JSON
```

---

## Acceptance Criteria (Refined)

### Core System ✅ COMPLETED
- [x] Heartbeat runs every 10 minutes, decaying stats correctly
- [x] Meal time detection (7-9, 11-13, 17-19) triggers hunger penalties
- [x] Sleep time detection (22-6) triggers energy penalties
- [x] 4 consecutive missed meals → pet death (health = 0)
- [x] Need satisfaction detected from chat keywords

### Proactive Behavior ✅ COMPLETED
- [x] Pet sends LLM-generated requests when needs < 30
- [x] Pet generates user-centric topics hourly (8am-10pm only)
- [x] Knowledge sharing happens when user inactive 30+ mins
- [x] Self-care mode activates after 2 hours user inactivity

### Evolution ✅ COMPLETED
- [x] Friendship level evolves based on multi-factor scoring
- [x] Personality traits adapt based on conversation analysis
- [x] Daily diary generated at 23:59 with LLM enhancement
- [x] Evolution history viewable in Memory View

### UI/UX ✅ COMPLETED
- [x] Pet status panel shows all 9 stats with trends
- [x] Need help modal explains how to satisfy needs
- [x] Memory view allows filtering and searching
- [x] Error handling for LLM failures (fallback messages)

---

## Technical Implementation Notes

### Database Schema Updates
**File**: `src/db/indexeddb.ts`

**New Stores Needed**:
```typescript
// Already exists: memories, user_profiles, chat_history

// New: status_history (for tracking trends)
interface StatusHistory {
  id: string;
  petId: string;
  timestamp: string;
  stats: PetStatus;
  changes: Record<string, number>;
}

// New: evolution_history (for tracking growth)
interface EvolutionRecord {
  id: string;
  petId: string;
  fromLevel: FriendshipLevel;
  toLevel: FriendshipLevel;
  timestamp: string;
  changes: string[];
}
```

### Service Architecture
```
src/services/
├── heartbeat.ts          # Biological decay (10-min interval)
├── knowledge-sharing.ts  # Topic generation & knowledge synthesis
├── proactive-chat.ts     # Pet-initiated conversations
└── personality.ts        # Trait analysis & adaptation
```

### Error Handling Strategy
```
- LLM failures → Use fallback hardcoded messages
- DB failures → Cache in memory, retry on next heartbeat
- Network failures → Queue messages, sync when online
```

### Testing Strategy
```
1. Unit tests: decay calculations, meal time detection
2. Integration tests: need satisfaction detection
3. E2E tests: full 24-hour cycle simulation
4. Load tests: 1000+ memory records retrieval
```
