# Feature: Pet Memory & State Interaction System

## Overview

Enhance the pet chat system to have comprehensive memory capabilities:
1. Remember pet's own status changes over time
2. Remember user personality traits and update continuously
3. Remember conversation history for context-aware responses
4. Allow users to satisfy pet's needs through conversation

---

## Requirements

### 1. Pet Status Memory
- Track recent status changes (last 24 hours)
- Store historical pet states with timestamps
- Show status trends to user
- Use memory system to persist status history

### 2. User Personality Memory
- Extract personality traits from conversation patterns
- Continuously update personality based on:
  - Words used (friendly, formal, etc.)
  - Topic preferences
  - Response patterns
- Store personality as part of memory with tags

### 3. Conversation History Memory
- Store all chat messages with metadata
- Tag memories by topic/need
- Use conversation history as context for AI responses
- Summarize long conversation history for LLM context

### 4. Chat-Driven Need Satisfaction
Users can satisfy pet needs through conversation:
- "I'll play with you" → increases play need
- "Let's chat" → increases chat need
- "Time to sleep" → increases sleep need
- "Here's some food" → increases hunger need
- "I love you" → increases love need
- "Learn something" → increases knowledge need

Pet should recognize these patterns and update states accordingly.

---

## Acceptance Criteria

- [ ] Pet remembers its own status changes (last 24 hours)
- [ ] User personality traits extracted and stored in memory
- [ ] Conversation history saved with proper tagging
- [ ] Pet uses conversation history as context for responses
- [ ] Users can satisfy needs via specific conversation patterns
- [ ] Pet recognizes need-satisfaction phrases and updates states
- [ ] All interactions saved to memory system
- [ ] Type checks pass

---

## Files to Modify

| File | Change |
|------|--------|
| `src/store/pet-kingdom.ts` | Add status history tracking, need satisfaction detection |
| `src/store/memory.ts` | Add personality extraction, status history storage |
| `src/components/Chat.vue` | Add need-satisfaction phrase detection |
| `src/types/pet-kingdom.ts` | Add PetStatusHistory, Personality traits |

---

## Technical Approach

### Status History Structure
```typescript
interface PetStatusHistory {
  id: string;
  petId: string;
  timestamp: string;
  status: PetStatus; // All pet stats at this point
  changes: Record<string, number>; // What changed from previous
}
```

### Personality Extraction
- Analyze user's word usage patterns
- Track topic preferences from conversation
- Update personality scores continuously

### Need Satisfaction Detection
- Define keyword patterns for each need type
- Detect when user expresses intent to satisfy needs
- Update pet state immediately when pattern detected
