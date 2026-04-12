# Emotion Engine - AI Pet Emotional State Machine

## Goal
Upgrade the AI pet's emotional system from static numeric values (Happiness) to a dynamic State Machine that influences dialogue, behavior, and visual representation.

## Requirements

### 1. Emotional State Definition
- Implement a set of distinct emotional states:
  - **Excited (兴奋)**: High energy, frequent emojis, proactive conversation.
  - **Melancholy (忧郁)**: Low energy, slower responses, may ask for comfort.
  - **Anxious (焦虑)**: High energy but negative, nervous tone, needs reassurance.
  - **Lazy (慵懒)**: Low energy, short responses, prefers sleep.
  - **Neutral (平静)**: Standard balanced state.

### 2. State Transition Logic
- States should transition based on:
  - **Immediate Triggers**: Need satisfaction (e.g., being fed $\rightarrow$ Excited), User tone (e.g., kindness $\rightarrow$ Excited, anger $\rightarrow$ Anxious).
  - **Gradual Decay**: States slowly drift back to Neutral over time.
  - **Stat influence**: Happiness $< 30 \rightarrow$ higher probability of Melancholy; Energy $< 30 \rightarrow$ higher probability of Lazy.

### 3. Dialogue Integration
- The current emotional state must be injected into the LLM system prompt.
- Define state-specific "behavioral guidelines" for the LLM:
  - *Excited*: "Use more exclamation marks and emojis. Be overly enthusiastic."
  - *Melancholy*: "Be quiet and slightly sad. Use soft language."
  - *Anxious*: "Use ellipses (...), express uncertainty or worry."
  - *Lazy*: "Be terse, act like you are yawning, avoid complex topics."

### 4. Visual Feedback Mapping
- Provide a mapping from State $\rightarrow$ Emoji/Visuals for the UI to use.
  - Excited $\rightarrow$ ✨ / 🤩
  - Melancholy $\rightarrow$ 🌧️ / 😔
  - Anxious $\rightarrow$ 😰 / 🌀
  - Lazy $\rightarrow$ 💤 / 🥱
  - Neutral $\rightarrow$ 🙂

## Technical Notes
- **State Storage**: Add `currentEmotion` to `PetStatus` or create a new state in `usePetKingdomStore`.
- **Integration**: Update `src/services/heartbeat.ts` to handle state decay/transitions.
- **Prompting**: Modify the chat service to include the current emotion in the prompt payload.

## Acceptance Criteria ✅ COMPLETED

- [x] Pet's emotional state changes dynamically based on user interaction and stats.
- [x] LLM responses clearly reflect the current emotional state.
- [x] UI can retrieve and display the current emotion (emoji/label).
- [x] Transitions between states feel natural and not abrupt.

## Implementation Summary

### Files Modified
1. **src/types/pet-kingdom.ts** - Already existed with complete implementation
   - `PetEmotion` type: 'Excited' | 'Melancholy' | 'Anxious' | 'Lazy' | 'Neutral'
   - `EMOTION_MAP` with emojis, labels, prompts, and altEmojis

2. **src/store/pet-kingdom.ts** - Already existed with complete implementation
   - `currentEmotion` added to `petStatus` ref
   - `updateEmotion()` function with triggers: 'satisfaction', 'tone', 'decay', 'stat-influence'
   - State transition logic based on stats and triggers

3. **src/components/Chat.vue** - Already integrated
   - `currentEmotionEmoji` computed property
   - `currentEmotionLabel` computed property
   - `emotionClass` computed property
   - Emotion injected into LLM prompt via `currentEmotion` and `emotionPrompt`

### Emotion States
| State | Emoji | Label | Prompt |
|-------|-------|-------|--------|
| Excited | ✨ | 兴奋 | "Use more exclamation marks and emojis. Be overly enthusiastic." |
| Melancholy | 🌧️ | 忧郁 | "Be quiet and slightly sad. Use soft language." |
| Anxious | 😰 | 焦虑 | "Use ellipses (...), express uncertainty or worry." |
| Lazy | 💤 | 慵懒 | "Be terse, act like you are yawning, avoid complex topics." |
| Neutral | 🙂 | 平静 | "Maintain a balanced and natural tone." |
