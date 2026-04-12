# Adventure Game Ultimate Upgrade - "The Last Guardian"

## Goal
Create a **single, ultimate level** that completely reimagines the Adventure Game with:
- **Creative gameplay mechanics** beyond basic platforming
- **Advanced AI integration** for dynamic difficulty and narrative
- **Immersive storytelling** with environmental narrative
- **Polished visual/audio feedback** (particle systems, screen shake, etc.)

---

## Core Concept: "The Last Guardian"

**Theme**: A mystical temple where the player must escape while the temple collapses, guided by an ancient AI guardian that provides hints, adjusts difficulty, and creates an emotional narrative arc.

**Unique Selling Points**:
1. **Dynamic Level Destruction** - The level physically changes as you progress (bridges collapse, new paths open)
2. **AI Dungeon Master** - An LLM-powered guardian that narrates, hints, and adapts difficulty in real-time
3. **Momentum-Based Physics** - Advanced movement: wall jumps, slide kicks, variable jump height
4. **Environmental Storytelling** - Visual clues, ancient inscriptions, and the collapsing temple tell a story

---

## Gameplay Mechanics

### 1. Advanced Movement System
| Mechanic | Description | Input |
|----------|-------------|-------|
| **Variable Jump** | Hold longer = higher jump | Hold Space/Up |
| **Wall Jump** | Jump off walls with momentum | Touch wall + Jump |
| **Slide** | Fast low-profile movement | Down + Direction |
| **Air Dash** | Single mid-air directional burst | Jump + Direction (once per jump) |
| **Momentum Carry** | Running jumps carry horizontal velocity | Natural physics |

### 2. Dynamic Level Events
- **Phase 1 (0-30s)**: Exploration - Temple is stable, AI guardian introduces the world
- **Phase 2 (30-60s)**: Awakening - Earthquakes shake the screen, blocks crumble
- **Phase 3 (60-90s)**: Collapse - Sections fall away, forcing rapid movement
- **Phase 4 (90s+)**: Escape - Final sprint with AI providing urgent guidance

### 3. AI Integration Points
```
AI Guardian ("Aethel") provides:
- Narrative commentary based on player position/actions
- Hints when player stuck > 10 seconds
- Difficulty adjustment (spawn fewer enemies if player struggling)
- Emotional tone shifts (calm → urgent → desperate)
```

### 4. Interactive Elements
- **Pressure Plates**: Hold to keep doors open, create puzzles
- **Breakable Walls**: Reveal secrets/coins with slide kick
- **Moving Platforms**: Horizontal/vertical conveyors
- **Lava Pits**: Rising lava forces upward progression
- **Wind Zones**: Push player, affect jump arcs

---

## Level Design: "The Spiral Descent"

**Layout**: A vertical-scrolling hybrid (mostly horizontal but with vertical sections)

```
Section A: The Entrance (x: 0-50)
- Tutorial area teaching basic movement
- AI introduction: "I am Aethel, last guardian of this place..."
- Safe, stable environment

Section B: The Puzzle Hall (x: 50-100)
- Pressure plate puzzles
- Breakable walls with secrets
- First earthquake event

Section C: The Collapse (x: 100-150)
- Falling platforms
- Rising lava
- Wall jump sections
- AI becomes urgent: "The temple falls! Move!"

Section D: The Final Ascent (x: 150-200)
- Vertical climbing section
- Moving platforms
- Boss-like environmental hazard (giant falling statue)
- Escape to flag
```

---

## Technical Requirements

### Physics Engine Upgrades
- [ ] Implement velocity-based movement (not position-based)
- [ ] Add friction/acceleration curves
- [ ] Wall collision detection with normal vectors
- [ ] Particle system for dust, debris, sparks

### AI System
- [ ] Integrate with existing LLM API infrastructure
- [ ] Context window: player position, health, time, stuck detection
- [ ] Pre-generated narrative branches + dynamic insertion
- [ ] Latency handling (queue system for AI messages)

### Visual Effects
- [ ] Screen shake on earthquakes/explosions
- [ ] Dynamic lighting (torch flicker, lava glow)
- [ ] Particle emitters (dust, sparks, crumbling blocks)
- [ ] Camera shake and dynamic framing

### Audio (Placeholder for future)
- [ ] Sound effect triggers (jump, land, hit, collect)
- [ ] Dynamic music intensity based on phase

---

## Acceptance Criteria

### Must Have
- [ ] Single complete level (3-5 minutes playtime)
- [ ] Variable jump height + wall jumps working smoothly
- [ ] AI guardian provides at least 5 narrative moments
- [ ] Level destruction sequence (at least 3 major changes)
- [ ] Particle effects for key actions
- [ ] No game-breaking bugs (fall through floor, softlocks)

### Nice to Have
- [ ] Secret areas (2+ hidden zones)
- [ ] Speedrun-friendly design (consistent RNG)
- [ ] Death recap ("You fell. Time: 45s. Try again?")
- [ ] Achievement system integration

---

## AI Prompt Strategy

**System Prompt**:
```
You are Aethel, an ancient AI guardian of a collapsing temple. 
Speak in an archaic but urgent tone. 
Provide hints only when the player is stuck.
Escalate urgency as time passes.
```

**User Context** (sent when player stuck or at checkpoints):
```
Player status:
- Health: {lives}/3
- Time elapsed: {gameTime}s
- Current section: {sectionName}
- Stuck duration: {stuckTime}s
- Recent deaths: {deathCount}

Provide a brief (max 20 words) narrative comment or hint.
```

---

## File Structure Changes

```
src/
  store/
    adventure-ultimate.ts    # New store with advanced physics
  components/
    AdventureUltimate.vue    # New component
  types/
    adventure-ultimate.ts    # Extended types
  services/
    ai-narrator.ts           # LLM integration for narrative
```

---

## Testing Checklist

- [ ] Wall jump consistency (no pixel hunting)
- [ ] AI latency doesn't block gameplay
- [ ] Level destruction doesn't kill player unfairly
- [ ] Mobile controls work (if applicable)
- [ ] Type safety (no `any` in new code)

---

## Notes

**This is a creative showcase level**, not a replacement for existing levels. It demonstrates:
1. Advanced game design capabilities
2. AI integration patterns
3. Physics-based gameplay
4. Narrative + gameplay fusion

**Estimated Scope**: 8-12 hours of focused development.
