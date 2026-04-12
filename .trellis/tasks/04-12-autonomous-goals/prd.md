# Autonomous Goals System

## Goal
Implement an autonomous goals system that allows the AI pet to set, track, and pursue goals independently based on its needs and personality.

## Requirements

### 1. Goal Definition
- [ ] Define goal types:
  - **Learning Goals**: Learn new topics, gain knowledge points
  - **Social Goals**: Interact with other pets, make friends
  - **Play Goals**: Play games, increase play stat
  - **Rest Goals**: Sleep, recover energy
  - **Exploration Goals**: Visit new locations in pet kingdom

### 2. Goal Lifecycle
- [ ] Goal creation based on needs (e.g., hunger < 50 → Feed Goal)
- [ ] Goal priority based on urgency (need level)
- [ ] Goal completion tracking
- [ ] Goal cancellation when needs change

### 3. Autonomous Pursuit
- [ ] Pet attempts to fulfill its own goals
- [ ] Progress updates displayed in UI
- [ ] Completion rewards (stat increase, happiness boost)

### 4. Memory Integration
- [ ] Record goal history (started, completed, cancelled)
- [ ] Learn from goal completion patterns

## Technical Notes
- **Store**: Extend `src/store/pet-kingdom.ts` with goals array
- **Type**: `src/types/pet-kingdom.ts` with `Goal` interface
- **Priority**: Use urgency (need level) to sort goals

## Acceptance Criteria
- [ ] Pet sets goals based on current needs
- [ ] Goals are displayed in the UI
- [ ] Pet attempts to fulfill goals autonomously
- [ ] Goal history is recorded in memory
- [ ] Goal completion boosts stats
