# Feature: Fix Chat Message Display and Add Need Help

## Overview

Fix chat message display issue and add help tooltips for each need status.

## Requirements

### 1. Chat Message Display Fix
**Current Issue**: When user sends a message in chat, the message is not immediately displayed. It only appears after the conversation ends.

**Expected Behavior**:
- When user clicks "Send" button:
  1. Clear the input box immediately
  2. Display the user's message in the chat panel immediately
  3. Show loading state while AI is responding
  4. Display AI's response when ready

### 2. Need Help Tooltips
Each need status should have a "?" icon that shows a help modal with:
- Why this need decreases
- What actions increase this need

**Needs to add help for**:
- **Happiness (❤️)**: Why decreases (neglect, loneliness) + How to increase (petting, playing)
- **Hunger (🍗)**: Why decreases (time passes) + How to increase (feeding)
- **Health (❤️)**: Why decreases (poor care, illness) + How to increase (proper care, medicine)
- **Energy (⚡)**: Why decreases (activity, lack of sleep) + How to increase (rest, sleep)
- **Sleep (💤)**: Why decreases (activity, lack of rest) + How to increase (put to bed, rest)
- **Play (⚽)**: Why decreases (no playtime) + How to increase (play games, toys)
- **Love (💖)**: Why decreases (neglect, lack of affection) + How to increase (petting, affection)
- **Chat (💬)**: Why decreases (no conversation) + How to increase (talk to pet)
- **Knowledge (📚)**: Why decreases (no learning) + How to increase (learn topics, read)

## Acceptance Criteria

- [ ] User message appears immediately after clicking "Send"
- [ ] Input box clears immediately after clicking "Send"
- [ ] Loading indicator shows while AI is responding
- [ ] Each need has a "?" help icon
- [ ] Clicking "?" shows modal with help content
- [ ] Help content explains why need decreases and how to increase it

## Files to Modify

| File | Change |
|------|--------|
| `src/components/Chat.vue` | Fix message display logic, add help tooltips for each need |
| `src/components/NeedHelpModal.vue` | New component for displaying need help content |

## Technical Approach

1. **Chat Fix**: Modify `sendMessage()` to add user message to chat history immediately before calling AI
2. **Need Help**: Add "?" icon to each need item, create `NeedHelpModal` component with help content
