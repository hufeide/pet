# Fix Pet Memory for Identity and Preferences

## Goal
Ensure the AI pet consistently remembers its own identity (name, personality, traits) and the user's identity/preferences (name, likes, dislikes) throughout the chat experience.

## Requirements
- [ ] The AI should always know its assigned identity/personality.
- [ ] The AI should implicitly extract user preferences (e.g., likes, dislikes, hobbies) from the conversation.
- [ ] Preference extraction should happen **periodically** (every X messages), where a background process reviews the recent chat history to update the permanent profile.
- [ ] The AI should retrieve and utilize these stored preferences to personalize future responses.
- [ ] Memory should persist across chat messages and different sessions/restarts (Permanent Storage).

## Acceptance Criteria
- [ ] Pet correctly identifies itself by name and personality in chat.
- [ ] Pet remembers user's name and preferences mentioned earlier in the conversation across sessions.
- [ ] Periodic background process successfully updates the user profile in the database without interrupting the chat flow.
- [ ] No "hallucinations" regarding its identity (e.g., claiming to be a generic AI model).

## Technical Notes
- Need to investigate how the chat context is currently built.
- Need to check if there is a database table or state object storing pet/user profiles.
- Need to design a background task/trigger for periodic memory updates.
- Need to verify the prompt template used for the LLM.
