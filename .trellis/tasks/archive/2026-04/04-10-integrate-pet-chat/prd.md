# Feature: Integrate Pet and Chat

## Overview

Merge the Pet and Chat tabs into an integrated experience where clicking on the pet opens a chat interface with pet status panel.

## Current State

- **App.vue** has separate tabs: `Pet` and `Chat`
- **Pet.vue** shows the pet avatar and stats, but no chat functionality
- **Chat.vue** shows chat interface, but no pet status

## Target State

- **Pet tab**: Shows the pet avatar with a "Chat" button
- When clicking pet or chat button:
  - Open integrated chat interface
  - Display pet's current status (happiness, hunger, health, energy)
  - Display pet's current needs (sleep, play, love, chat, knowledge)
  - Allow pet to request fulfillment of urgent needs

## Requirements

### 1. Pet Component Changes (Pet.vue)
- Add "Chat" button that opens integrated chat
- When clicked, switch to chat view with pet status
- Keep current pet display when not chatting

### 2. Chat Component Changes (Chat.vue)
- Accept pet status as prop
- Display pet status panel at top of chat
- Show current needs with progress bars
- Pet can request fulfillment of urgent needs

### 3. State Management
- Share pet status between Pet and Chat components
- Track chat session state (is chatting with pet?)

## Acceptance Criteria

- [ ] Clicking pet avatar or "Chat" button opens integrated chat
- [ ] Chat interface shows pet's current status (happiness, hunger, health, energy)
- [ ] Chat interface shows pet's current needs (sleep, play, love, chat, knowledge)
- [ ] Pet can request fulfillment of most urgent need
- [ ] All 6 needs displayed with progress bars
- [ ] Urgent needs (< 40%) highlighted
- [ ] Chat history preserved when switching between pet and chat views

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Pet.vue` | Add chat button, emit event when clicked |
| `src/components/Chat.vue` | Add pet status panel prop |
| `src/App.vue` | Update to show integrated view |
| `src/store/pet-kingdom.ts` | Export petStatus and petRequest |

## Technical Approach

1. Add `isChattingWithPet` state in App.vue
2. When `isChattingWithPet = true`, show Chat component with pet status
3. Pet component emits `start-chat` event to open chat view
4. Chat component receives petStatus as prop and displays it at top
