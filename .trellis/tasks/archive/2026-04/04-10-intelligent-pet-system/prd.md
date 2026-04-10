# Feature: Intelligent Pet System with State-aware AI Responses

## Goal
Create an intelligent pet system where the AI pet responds based on its current state, past conversation history, and helps users understand how to improve pet's stats.

## Requirements

### 1. State-aware AI Responses
- Pet should consider its current stats when responding to user messages
- Stats include: Happiness, Hunger, Health, Energy, Sleep, Play, Love, Chat, Knowledge
- Pet should proactively mention its state in responses when relevant

### 2. Conversation History Persistence
- Currently only pet's replies are saved, user questions are lost on tab switch
- All conversations (both user and pet) must be persisted in memory system
- Chat history should survive tab switching

### 3. Stat Improvement Guidance
- When user asks about low stats (e.g., Energy at 50%), pet should:
  - Acknowledge the current state
  - Provide specific advice on how to improve
  - Reference past improvement attempts if any
- Each stat should have clear rules documented in "Need Help" modal

### 4. Clear Stat Change Rules
Each stat needs documented rules for:
- **Happiness**: How it increases/decreases
- **Hunger**: How it increases/decreases
- **Health**: How it increases/decreases
- **Energy**: How it increases/decreases
- **Sleep**: How it increases/decreases
- **Play**: How it increases/decreases
- **Love**: How it increases/decreases
- **Chat**: How it increases/decreases
- **Knowledge**: How it increases/decreases

### 5. UI Cleanup
- Remove Level 1 display from home page
- Remove old 4-state display from home page
- Level 3 also has duplicate states - clean up to show only relevant ones
- Final display should show: Happiness, Hunger, Health, Energy, Sleep, Play

### 6. Pet Personality Memory
- Pet should remember user's personality traits
- Remember user's interests from conversations
- Build friendship level over time

## Acceptance Criteria

- [ ] Pet's AI responses consider current stat values
- [ ] Conversation history persists across tab switches
- [ ] Pet provides specific advice when stats are low
- [ ] "Need Help" modal shows clear rules for each stat
- [ ] Home page cleaned up - shows only final level and relevant stats
- [ ] All 9 stats have documented change rules
- [ ] Pet remembers user interests and personality

## Technical Notes

### Files to Modify
1. **src/store/pet-kingdom.ts** - Add state-aware response generation
2. **src/store/memory.ts** - Fix conversation persistence
3. **src/components/Chat.vue** - Ensure user messages are saved
4. **src/components/NeedHelpModal.vue** - Add stat change rules
5. **src/store/pet.ts** - Clean up UI state
6. **src/components/PetStatus.vue** - Update to show final stat display

### State-Aware Response Pattern
```typescript
// Pet should check its state before responding
const currentStat = petStatus.value.energy;
const lowStatAdvice = getAdviceForLowStat('energy', currentStat);
// Include advice in LLM prompt
```

### Conversation Persistence
- User messages should be saved immediately when sent
- Both user and pet messages stored in memory system
- Tagged appropriately for retrieval
