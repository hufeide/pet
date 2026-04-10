# Fix Chat and Pet Features

## Issues

### 1. API Configuration Error
**Issue**: Chat shows "Failed to get response: API configuration not set" error.

**Root Cause**: The LLM API configuration is not being loaded correctly from localStorage or the config store.

**Fix**:
- Verify Config store is properly saving API configuration
- Ensure Chat component reads from correct config source
- Add fallback error handling when API config is missing

### 2. Pet Not Sending定时 Messages and Knowledge Sharing
**Issue**: Pet is not proactively chatting or sharing knowledge with user.

**Root Cause**: 
- The定时 trigger for chat/knowledge sharing is not working
- `tryShareKnowledge()` in pet-kingdom store may not be called correctly
- Knowledge sharing logic needs to be integrated with pet's behavior system

**Fix**:
- Add定时 trigger (every 1-4 hours) for pet to initiate conversation
- Integrate knowledge sharing with the定时 trigger
- Ensure pet shares interesting topics based on user interests

### 3. Pet Needs Not Changing Based on Chat
**Issue**: Happiness, Hunger, and other stats are not updating based on user-pet interaction.

**Root Cause**:
- Chat interactions do not affect pet needs/statistics
- The pet is not "living" - stats only decrease over time, never increase from interaction

**Fix**:
- Add logic to increase stats when user chats with pet
- Happiness increases with positive chat interactions
- Knowledge increases when learning topics are discussed
- Love increases with affectionate interactions
- Pet needs to respond to chat in a way that affects its stats

## Requirements

1. **API Configuration**: Fix the "API configuration not set" error
   - Verify config is saved to localStorage correctly
   - Add clear error message if API config is missing
   - Allow users to configure API in Config tab

2. **定时 Pet Behavior**: Implement定时 triggers for pet proactive behavior
   - Pet initiates conversation every 1-4 hours (max 1 per hour)
   - No conversations during night hours (10pm - 8am)
   - Pet shares interesting knowledge periodically
   - Knowledge sharing based on user interests and chat history

3. **Dynamic Pet Needs**: Pet stats change based on interactions
   - Chat increases Happiness and Knowledge stats
   - Affectionate interactions increase Love stat
   - Playful interactions increase Play stat
   - Pet responds to chat in real-time, affecting its state

## Files to Modify

| File | Change |
|------|--------|
| `src/store/config.ts` | Verify API config saving/loading |
| `src/store/pet-kingdom.ts` | Add定时 triggers for pet proactive behavior |
| `src/store/pet.ts` | Add chat-based stat increases |
| `src/components/Chat.vue` | Handle API config error gracefully |
| `src/services/knowledge-sharing.ts` | Integrate with定时 triggers |
