# Adventure Game - Diagonal Jump Logic

## Goal
Improve the jump physics in the Adventure Game to allow the player to jump diagonally (forward-right and forward-left) instead of only jumping straight up.

## Requirements
- [ ] **Diagonal Trajectory**: When the player jumps while moving left or right, the resulting trajectory should be a diagonal arc.
- [ ] **Input Integration**: The jump direction should be determined by the current horizontal input (`ArrowLeft`/`a` or `ArrowRight`/`d`).
- [ ] **Consistent Physics**: Ensure that diagonal jumps do not unintentionally increase the maximum jump height or distance beyond reasonable limits.
- [ ] **Fluidity**: The transition from walking to jumping diagonally should feel smooth.

## Technical Notes
- **Current State**: Jump is implemented as a simple vertical impulse: `player.value.velocity.y = -10` (or `-8` in `update`).
- **Proposed Change**: 
  - Modify the jump logic to consider the current `velocity.x`.
  - Potentially add a "jump boost" to horizontal velocity when the jump is initiated to make diagonal jumps more pronounced.
  - Review `src/store/adventure.ts` lines 246-250 and 293-296.

## Acceptance Criteria ✅ COMPLETED

### Core Requirements
- [x] Player can jump and move right simultaneously, resulting in an upward-right arc.
- [x] Player can jump and move left simultaneously, resulting in an upward-left arc.
- [x] Jumping without horizontal input still results in a vertical jump.
- [x] Collision detection continues to work correctly during diagonal jumps.

### Implementation Notes
- Jump logic modified in `src/store/adventure.ts` lines 272-303
- Added `jumpBoost` parameter (0.2) for diagonal trajectory
- Horizontal velocity is adjusted during jump to create natural arc
