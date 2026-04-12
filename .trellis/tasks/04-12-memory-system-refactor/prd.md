# Memory System Enhancements - Sorting, Folding, and Summarization

## Goal
Refactor the memory system to improve organization and discoverability of pet memories, introducing time-based grouping, category-based sorting, and automated daily interaction summaries.

## Requirements

### 1. Organization & Sorting
- [ ] **Time-based Grouping**: Memories must be grouped by date.
- [ ] **Category Classification**: Support distinct categories for memories:
  - `chat`: Conversation-based memories.
  - `share`: Knowledge sharing and proactive interactions.
- [ ] **Chronological Order**: Within each date group, memories should be sorted in reverse chronological order (newest first).

### 2. UI/UX Enhancements
- [ ] **Daily View**: By default, only today's memories should be expanded and visible.
- [ ] **Folding/Collapsing**: Memories from previous days should be grouped into folded sections (e.g., "Yesterday", "Last Week") that can be expanded by the user.
- [ ] **Scrolling**: Implement a smooth scrolling experience for the memory list.

### 3. Automated Summarization
- [ ] **Interaction Summary**: Implement a system to periodically (e.g., once a day or upon request) summarize the most important interactions of the day.
- [ ] **Placement**: The daily summary should be pinned to the top of the current day's memory list.
- [ ] **Content**: Summary should highlight key topics discussed, emotional shifts, or significant events.

## Technical Notes
- **Store**: `src/store/memory.ts` already contains `timestamp` and `type`. We need to add computed properties to group these records.
- **UI**: Relevant components are likely `src/components/MemoryArchive.vue`, `src/components/Memory.vue`, or `src/components/PetDiary.vue`.
- **Summarization**: Will require an LLM call to process the day's `conversation` type memories and generate a concise summary. This summary should be saved as a new memory record with a specific type (e.g., `daily_summary`).

## Acceptance Criteria
- [ ] User can see today's memories immediately upon opening the memory view.
- [ ] Previous days' memories are collapsed and expandable.
- [ ] Memories are clearly distinguished between 'chat' and 'share' categories.
- [ ] A generated summary of the day's key interactions appears at the top of today's list.
- [ ] The memory list supports vertical scrolling.
