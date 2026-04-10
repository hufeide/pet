# Fix Chat Issues

## Issues

### 1. Need Help Modal Not Showing
**Issue**: Clicking the "?" button next to need labels in Pet or Chat tab does not show the help modal.

**Root Cause**: The NeedHelpModal component has a local `showModal` state that should be synced with the `show` prop, but there might be an issue with the prop binding or component reactivity.

### 2. No AI Response When Sending Chat Message
**Issue**: When sending a message in chat, there is no response from the AI.

**Root Cause**: The `chatWithAI` function may be failing silently due to:
- Missing or invalid API configuration
- Network errors not being properly handled
- The LLM API call not being executed correctly

### 3. Chat History Cleared When Switching Tabs
**Issue**: When switching from Chat tab to another tab and back, the conversation history is cleared.

**Root Cause**: The Chat component uses `petStore.chatHistory` which is reset when the component is unmounted/created. The history is loaded from IndexedDB on `onMounted`, but there might be a timing issue or the DB persistence is not working correctly.

## Requirements

1. **Need Help Modal**: Clicking "?" must show the modal with:
   - Why the need decreases
   - How to increase it

2. **Chat Response**: Sending a message must:
   - Show user message immediately
   - Call LLM API and show AI response
   - Handle errors gracefully with user feedback

3. **History Persistence**: Chat history must persist across:
   - Tab switches
   - Component unmount/remount
   - Page reloads

## Files to Fix

- `src/components/Chat.vue` - Fix history persistence and verify modal integration
- `src/components/NeedHelpModal.vue` - Fix prop binding
- `src/store/pet.ts` - Verify chat history loading from DB
- `src/api/llm.ts` - Verify API call implementation
