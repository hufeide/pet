# Feature: Fix Chat Issues and Integrate Memory System

## Overview

Fix critical chat issues and integrate with the Memory system to provide a complete chat experience with persistent history and knowledge sharing.

## Requirements

### 1. Chat Message Delivery Fix
**Current Issue**: When user sends a message in chat, there is no AI response.

**Expected Behavior**:
- User message is sent to LLM API
- AI response is received and displayed
- No blocking or hanging on send

### 2. Chat History Persistence
**Current Issue**: When switching tabs and returning to chat, the conversation history is lost.

**Expected Behavior**:
- Chat history is saved to IndexedDB/Database
- History persists across tab switches
- History persists across page reloads
- Load from DB when chat component mounts

### 3. Memory System Integration
**Current Issue**: Chat conversations are not organized in the Memory tab.

**Expected Behavior**:
- All chat conversations are saved to Memory system
- Conversations are categorized by date/topic
- Memory tab shows organized chat history
- Users can search and review past conversations

### 4. Pet Knowledge Sharing
**New Feature**: Pet automatically shares interesting content with user.

**Content Types**:
- Historical facts
- Travel destinations
- Cultural knowledge
- Current news
- Educational topics

**Behavior**:
- Share at regular intervals (e.g., every 2-4 hours)
- No sharing during night hours (e.g., 10pm - 8am)
- Max 1 share per hour to avoid spamming
- Content based on chat history context

## Acceptance Criteria

- [ ] User sends message and receives AI response
- [ ] Chat history persists when switching tabs
- [ ] Chat history persists after page reload
- [ ] All chat messages saved to Memory system
- [ ] Memory tab shows organized chat history
- [ ] Pet shares knowledge topics periodically
- [ ] No sharing during night hours
- [ ] Max 1 share per hour

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Chat.vue` | Fix sendMessage, add history persistence, add sharing timer |
| `src/store/pet.ts` | Fix chatWithAI to properly handle responses |
| `src/components/Memory.vue` | Display chat conversations organized by date |
| `src/api/llm.ts` | Verify LLM API call works correctly |
| `src/services/sharing.ts` | New service for pet knowledge sharing |

## Technical Approach

1. **Chat Fix**: Verify `chatWithAI` properly handles API response and adds to chat history
2. **Persistence**: Ensure `addChatMessageImmediately` saves to DB immediately
3. **Memory Integration**: Create mapping between chat messages and memory records
4. **Sharing System**: Create periodic job that runs while chat is open
