# Feature: Pet-Chat Integrated System with AI-driven Evolution

## Overview

Merge pet and chat functionality into an integrated AI-driven pet system where pets have dynamic needs, evolve over time, and interact with users through natural language conversations.

---

## Requirements

### 1. Core Integration
- Click pet icon opens chat interface with pet status panel
- Chat shows: pet's name, level, friendship, health, happiness
- Chat shows current needs (hunger, play, sleep, love, knowledge)

### 2. Six Basic Needs System

| Need | Trigger | Effect of Neglect | Satisfaction |
|------|---------|-------------------|--------------|
| Eat | Meal times (breakfast, lunch, dinner) | -1 happiness, -1 health per missed feeding | Feed pet |
| Sleep | Night hours (22:00-06:00) | Tiredness, low energy | Put to bed |
| Play | Random between meals | Boredom, low happiness | Play mini-game |
| Love | Random between meals | Sadness, low friendship | Pet affection |
| Chat | Random between meals | Loneliness | Chat with pet |
| Learn | Random between meals | Stagnation | Learn topics |

**Rules:**
- First 3 (eat, sleep, play) trigger at meal times
- Last 3 (love, chat, learn) trigger randomly between meals
- 4 consecutive missed feedings = pet death
- Health gradually decreases without proper care

### 3. AI-driven Behavior

**定时 Tasks:**
- **10-minute interval**: Check all needs, adjust values based on care
- **Hourly check**: Can initiate conversation (max 1/hour), no夜间打扰 (22:00-06:00)
- **Daily check**: Evaluate evolution, adjust personality based on user interaction

**Evolution System:**
- Friendship levels: Stranger → Acquaintance → Friend → Best Friend
- As friendship grows, new needs emerge
- Pet's personality adjusts based on user's chat patterns
- Pet learns user's interests from chat history

### 4. Chat Features

**Pet Status Display:**
```
┌─────────────────────────────────┐
│ My Pet - Level 5                │
│ Friendship: ★★★★☆ (85/100)     │
│ Health: 90/100  Happiness: 88  │
│ Current Needs:                  │
│   ⚠️ Hunger: 65% (needs feed)   │
│   💤 Sleep: 20%                 │
│   ❤️ Love: 40%                  │
│   📚 Knowledge: 30%             │
└─────────────────────────────────┘
```

**Pet Requests:**
- Pet can request fulfillment of most urgent need
- "I'm hungry, can you feed me?"
- "I'm tired, time to sleep"

**Topic Generation:**
- Pet generates interesting topics based on chat history
- Max 1 topic per hour
- No夜间打扰 (22:00-06:00)
- Topics include: news, knowledge, questions about user's interests

**Knowledge Sharing:**
- Pet searches web for user's interests
- Summarizes news/learning content
- Helps user learn and grow

### 5. Dynamic Evolution

** Friendship Progression:**
1. **Stranger**: Basic needs, simple responses
2. **Acquaintance**: Adds love/chat/learn needs
3. **Friend**: More complex conversations, shares opinions
4. **Best Friend**: Deep understanding, anticipates needs

**Personality Adjustment:**
- Based on user's conversation patterns
- User can set pet's personality traits
- Pet can ask for self-care instruction

### 6. Self-Care System

- User can instruct pet to "care for yourself"
- Pet uses LLM to make autonomous decisions
- Pet optimizes its own needs without user intervention

---

## 7. Memory System (NEW)

### 7.1 Memory Recording

**What to Record:**
- Daily interactions with pet
- Needs satisfaction events (fed, played, slept, etc.)
- Conversation history with tags
- User's expressed interests and preferences
- Pet's emotional states
- Evolution milestones (friendship levels, personality changes)

**Memory Types:**
```typescript
type MemoryType = 
  | 'interaction'      // Basic interaction record
  | 'need_satisfied'   // Need fulfillment event
  | 'conversation'     // Chat conversation
  | 'user_interest'    // User's expressed interests
  | 'pet_state'        // Pet's emotional/health state
  | 'evolution'        // Evolution milestone
  | 'knowledge_shared' // Knowledge shared with user
  | 'daily_diary'      // Daily summary (auto-generated)
```

### 7.2 Memory Tagging

**Tags System:**
- Mark memories with tags for easy retrieval
- Example tags: `#hunger`, `#sleep`, `#conversation`, `#love`, `#learn`, `#health`, `#evolution`
- Multi-tag support for complex memories

### 7.3 Memory Archive

**Archive Features:**
- View all memories with filtering by type/tags
- Search memories by content
- Filter by date range
- Group memories by day/week/month

### 7.4 Daily Diary System (NEW - CRITICAL)

**Automatic Daily Diaries:**
- Pet writes a rich diary every day (like a journal)
- Diaries include:
  - Day summary (what happened today)
  - Needs satisfaction status
  - Conversations highlights
  - User's expressed interests
  - Pet's feelings and thoughts
  - Evolution notes
  - Tomorrow's plan

**Diary Structure:**
```markdown
# Pet Diary - 2024-04-10

## Today's Summary
I had a great day with my主人! We talked about...

## Needs Status
- Hunger: ✅ Satisfied (3/3 meals)
- Sleep: ✅ Satisfied (8 hours)
- Love: ✅ Satisfied (petting sessions)
- Play: ⚠️ Partial (only 1 play session)
- Chat: ✅ Satisfied (multiple conversations)
- Learn: ✅ Satisfied (discussed X, Y, Z)

## Conversations
- Talked about...
- Learned about...

## User's Interests (Noted Today)
- X
- Y
- Z

## My Feelings
- Happy when...
- Sad when...

## Tomorrow's Plan
- Talk about...
- Share about...
```

### 7.5 Memory Shared with User

**User Can:**
- View pet's memory archive
- Read daily diaries
- Search past conversations
- Filter by tags
- See pet's perspective on their relationship

---

## Acceptance Criteria

- [x] Click pet icon opens integrated chat with status panel
- [x] All 6 needs implemented with proper triggers
- [x] Health/happiness decay system works correctly
- [x] Death after 4 consecutive missed feedings
- [x] 10-minute interval checks implemented
- [x] Hourly chat topic generation (max 1/hour, no夜间打扰)
- [x] Pet can request need fulfillment
- [x] Pet learns from chat history and remembers user interests
- [x] Friendship progression with personality changes
- [x] Self-care mode works when requested
- [x] All interactions saved as memories with tags
- [x] Daily automatic diary generation
- [x] Memory archive with filtering and search
- [x] Daily diaries visible to user
- [x] PetDiary component created for viewing diaries
- [x] MemoryArchive component created for searching memories

---

## Files to Modify

| File | Change | Status |
|------|--------|--------|
| `src/store/pet-kingdom.ts` | Add needs system, evolution logic,定时 triggers, memory system | ✅ Complete |
| `src/store/memory.ts` | New memory store for pet memories with 6 needs, friendship, diary | ✅ Complete |
| `src/components/PetParadise.vue` | Integrate chat with pet status, add memory view | ✅ Complete |
| `src/components/PetDiary.vue` | New component for viewing daily diaries | ✅ Complete |
| `src/components/MemoryArchive.vue` | New component for memory archive with filtering/search | ✅ Complete |
| `src/types/pet-kingdom.ts` | Add needs, memory types | ✅ Complete |
| `src/db/indexeddb.ts` | Add memory storage functions | ✅ Complete |

---

## Technical Approach

### State Structure
```typescript
interface PetState {
  // Basic info
  name: string;
  level: number;
  friendship: number;
  
  // Health system
  health: number;
  happiness: number;
  
  // Six needs (0-100)
  hunger: number;
  sleep: number;
  play: number;
  love: number;
  chat: number;
  knowledge: number;
  
  // Evolution
  personality: Personality;
  friendshipLevel: 'stranger' | 'acquaintance' | 'friend' | 'bestFriend';
  
  // Timing
  lastMealTime: Date;
  lastChatTopic: Date;
  needsLastChecked: Date;
  lastDiaryDate: Date;
}
```

### Memory Structure
```typescript
interface MemoryRecord {
  id: string;
  petId: string;
  type: MemoryType;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  timestamp: string;
  usefulness: number;  // 1-10, self-assessed
}
```

###定时 Triggers
- Use `setInterval` for 10-minute checks
- Use `setTimeout` for delayed chat topics
- Track meal times (breakfast 8:00, lunch 12:00, dinner 18:00)
- Daily diary generation at 23:59

### LLM Integration
- Pet status + needs context in system prompt
- Generate request messages based on current needs
- Analyze chat history for topic generation
- Web search for knowledge sharing
- Generate daily diary content based on day's events
- Tag memories based on content
