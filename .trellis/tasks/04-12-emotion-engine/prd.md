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

## Acceptance Criteria
- [ ] Pet's emotional state changes dynamically based on user interaction and stats.
- [ ] LLM responses clearly reflect the current emotional state.
- [ ] UI can retrieve and display the current emotion (emoji/label).
- [ ] Transitions between states feel natural and not abrupt.
