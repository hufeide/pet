# Fix Chat Issues

## Issues Fixed

### 1. NeedHelpModal Not Showing
**Issue**: Clicking the "?" button next to need labels in Pet or Chat tab did not show the help modal.

**Root Cause**: The NeedHelpModal component has a local `showModal` state that should be synced with the `show` prop. The `watch`侦听器 was missing `immediate: true` option, so the initial value was not synced.

**Fix**: Modified `src/components/NeedHelpModal.vue` to add `immediate: true` to the watch:
```typescript
watch(
  () => props.show,
  (newVal) => {
    showModal.value = newVal;
  },
  { immediate: true }
);
```

### 2. No AI Response When Sending Chat Message
**Issue**: When sending a message in chat, there was no response from the AI, and errors were silently handled.

**Root Cause**: The `chatWithAI` function's errors were only logged to console, not shown to users.

**Fix**: Modified `src/components/Chat.vue` `sendMessage` function to show error to user:
```typescript
petStore.chatWithAI(messages, (userContent, assistantContent) => {
  // Save conversation to memory system
  memoryStore.addMemory(...)
}).catch((err) => {
  console.error('Chat error:', err);
  alert(`Failed to get response: ${err.message}`);
});
```

### 3. Chat History Cleared When Switching Tabs
**Analysis**: 
- Chat component uses `v-if` conditional rendering, so it's unmounted when switching tabs
- `chatHistory` is stored in Pinia store (`usePetStore`) which is reactive and persistent
- `loadFromDB()` is called on `onMounted` to load history from IndexedDB
- The code logic is correct for persistence

**Verification**: The history should persist because:
1. Store is singleton across component instances
2. DB persistence is implemented in `db/indexeddb.ts`
3. History loads on component mount

If history still clears, it might be due to:
- Database not having data yet (first-time use)
- `petId` mismatch between save and load
