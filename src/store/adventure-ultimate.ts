// Adventure Game Ultimate Store - "The Last Guardian"
// Advanced physics: wall jumps, variable jump, momentum, screen shake, particles

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid.js';
import { aiNarrator, type NarratorContext } from '../services/ai-narrator.js';
import type {
  AdvancedPlayerState,
  ExtendedGameBlock,
  ExtendedParticle,
  ExtendedEnemy,
  UltimateLevel,
  ScreenShake,
  LevelEvent,
} from '../types/adventure-ultimate.js';
import { isDestructibleBlock } from '../types/adventure-ultimate.js';

// === Constants ===
const GRAVITY = 0.25;
const JUMP_FORCE = -7;            // Reduced: was -10, peak height ~10 tiles (fits 15-tile level)
const VARIABLE_JUMP_CUTOFF = -4;  // Adjusted to match reduced jump force
const WALL_JUMP_FORCE_X = 5;
const WALL_JUMP_FORCE_Y = -7;
const WALL_SLIDE_SPEED = 0.4;
const FRICTION = 0.88;            // Slightly increased friction for more controlled stops
const ACCELERATION = 0.2;         // Reduced: was 0.3, for less snappy acceleration
const MAX_SPEED = 0.4;            // Reduced: was 0.6, for slower horizontal movement
const WALL_JUMP_COOLDOWN = 0.1;   // 100ms
const AIR_DASH_SPEED = 1.2;       // Reduced: was 1.5, for less explosive air dashes
const SLIDE_SPEED = 0.5;          // Reduced: was 0.8, for slower slides

// === Level Design: "The Spiral Descent" ===
const ULTIMATE_LEVEL: UltimateLevel = {
  id: 'ultimate_1',
  name: 'The Last Guardian',
  width: 200,
  height: 15,
  spawnX: 2,
  spawnY: 9,
  flagX: 195,
  flagY: 9,
  background: 'temple',
  difficulty: 5,
  phaseTransitions: [
    { phase: 'exploration', time: 0, message: 'I am Aethel...', urgency: 'calm' },
    { phase: 'awakening', time: 30, message: 'The temple... awakens...', urgency: 'calm' },
    { phase: 'collapse', time: 60, message: 'RUN! The foundation fails!', urgency: 'desperate' },
    { phase: 'escape', time: 90, message: 'Almost there! Don\'t stop!', urgency: 'desperate' },
  ],
  blocks: generateUltimateLevel(),
  enemies: generateUltimateEnemies(),
};

// Generate "The Spiral Descent" level
function generateUltimateLevel(): ExtendedGameBlock[] {
  const blocks: ExtendedGameBlock[] = [];

  // Section A: The Entrance (x: 0-40) - Tutorial
  // Ground with gaps
  for (let x = 0; x < 40; x++) {
    if (x >= 15 && x <= 17) continue; // Small gap to jump
    blocks.push({ x, y: 10, type: 'ground', id: `ground_${x}` });
  }

  // Walls for wall jump tutorial
  for (let y = 6; y <= 10; y++) {
    blocks.push({ x: 5, y, type: 'hard', id: `wall_${y}` });
  }

  // Hidden weak block with secret
  blocks.push({ x: 25, y: 6, type: 'weak', hp: 1, maxHp: 1, id: 'weak_secret' });

  // Section B: Puzzle Hall (x: 40-80) - Pressure plates
  // Ground continues
  for (let x = 40; x < 80; x++) {
    if (x >= 55 && x <= 57) continue; // Gap
    blocks.push({ x, y: 10, type: 'ground', id: `ground2_${x}` });
  }

  // Pressure plates
  for (let x = 45; x < 55; x++) {
    blocks.push({ x, y: 10, type: 'pressure_plate', id: `plate_${x}`, isPressed: false });
  }

  // Wall sections for climbing
  blocks.push({ x: 45, y: 9, type: 'hard', id: 'wall_b1' });
  blocks.push({ x: 45, y: 8, type: 'hard', id: 'wall_b2' });
  blocks.push({ x: 45, y: 7, type: 'hard', id: 'wall_b3' });

  // Section C: Collapse Zone (x: 80-140) - Falling platforms
  // Ground with gaps
  for (let x = 80; x < 140; x++) {
    if (x >= 90 && x <= 92) continue; // Gap
    if (x >= 110 && x <= 112) continue; // Gap
    blocks.push({ x, y: 10, type: 'ground', id: `ground3_${x}` });
  }

  // Moving platforms
  for (let i = 0; i < 5; i++) {
    blocks.push({
      x: 95 + i * 8,
      y: 8,
      type: 'moving_platform',
      movingDirection: 'vertical',
      movingRange: 3,
      movingSpeed: 0.5,
      movingOffset: i * 2,
      id: `moving_${i}`,
    });
  }

  // Weak blocks that will fall
  for (let x = 115; x < 125; x++) {
    if (x % 2 === 0) {
      blocks.push({ x, y: 8, type: 'weak', hp: 2, maxHp: 2, id: `weak_collapse_${x}` });
    }
  }

  // Wall jump tower
  for (let y = 6; y <= 10; y++) {
    blocks.push({ x: 135, y, type: 'hard', id: `tower_${y}` });
  }

  // Section D: Final Stretch (x: 140-200) - Horizontal run to flag
  // Ground continues to flag
  for (let x = 140; x <= 200; x++) {
    if (x >= 160 && x <= 162) continue; // Small gap
    if (x >= 180 && x <= 182) continue; // Small gap
    blocks.push({ x, y: 10, type: 'ground', id: `ground4_${x}` });
  }

  // Flag at ground level
  blocks.push({ x: 195, y: 10, type: 'flag', id: 'flag' });

  return blocks;
}

function generateUltimateEnemies(): ExtendedEnemy[] {
  return [
    // Goombas in puzzle hall
    {
      id: generateUUID(),
      type: 'goomba',
      x: 50,
      y: 10,
      vx: 0.3,
      vy: 0,
      hp: 1,
      maxHp: 1,
      patrolStart: 40,
      patrolEnd: 55,
      alive: true,
      level: 3,
      state: 'patrol',
    },
    // Goomba in collapse zone
    {
      id: generateUUID(),
      type: 'goomba',
      x: 100,
      y: 10,
      vx: 0.4,
      vy: 0,
      hp: 1,
      maxHp: 1,
      patrolStart: 85,
      patrolEnd: 108,
      alive: true,
      level: 4,
      state: 'patrol',
    },
  ];
}

// === Store ===
export const useAdventureUltimateStore = defineStore('adventure-ultimate', () => {
  // Game state
  const level = ref<UltimateLevel>(ULTIMATE_LEVEL);
  const player = ref<AdvancedPlayerState>({
    position: { x: 2, y: 10 },
    velocity: { x: 0, y: 0 },
    onGround: false,
    wallSliding: false,
    wallJumpCooldown: 0,
    airDashesRemaining: 1,
    slideVelocity: 0,
    isSliding: false,
    isStunned: false,
    stunTimer: 0,
    facing: 'right',
    invincible: false,
    invincibleTime: 0,
    dead: false,
    win: false,
    health: 3,
    maxHealth: 3,
  });
  const enemies = ref<ExtendedEnemy[]>([]);
  const particles = ref<ExtendedParticle[]>([]);
  const cameraX = ref(0);
  const cameraY = ref(0);
  const gameTime = ref(0);
  const score = ref(0);
  const narrativeMessage = ref<string>('');
  const narrativeUrgency = ref<'calm' | 'urgent' | 'desperate'>('calm');
  const deathCount = ref(0);
  const stuckTimer = ref(0);
  const lastPosition = ref({ x: 2, y: 10 });

  // Screen shake
  const screenShake = ref<ScreenShake | undefined>(undefined);

  // Level events
  const events = ref<LevelEvent[]>([]);

  // Input
  const keys = ref<Record<string, boolean>>({});

  // Current phase
  const currentPhase = computed(() => {
    const transitions = level.value.phaseTransitions;
    const current = transitions.findLast(t => gameTime.value >= t.time);
    return current?.phase || 'exploration';
  });

  // === Initialization ===
  function initGame(): void {
    // Deep copy level data
    level.value = JSON.parse(JSON.stringify(ULTIMATE_LEVEL));
    enemies.value = JSON.parse(JSON.stringify(level.value.enemies));

    resetPlayer();
    gameTime.value = 0;
    score.value = 0;
    deathCount.value = 0;
    particles.value = [];
    screenShake.value = undefined;
    narrativeMessage.value = "";

    // Initialize level events
    initLevelEvents();

    // Initial narrative
    const firstMessage = level.value.phaseTransitions[0].message;
    showNarrative(firstMessage, level.value.phaseTransitions[0].urgency);
  }

  function resetPlayer(): void {
    player.value = {
      position: { x: level.value.spawnX, y: level.value.spawnY },
      velocity: { x: 0, y: 0 },
      onGround: false,
      wallSliding: false,
      wallJumpCooldown: 0,
      airDashesRemaining: 1,
      slideVelocity: 0,
      isSliding: false,
      isStunned: false,
      stunTimer: 0,
      facing: 'right',
      invincible: false,
      invincibleTime: 0,
      dead: false,
      win: false,
      health: 3,
      maxHealth: 3,
    };
    lastPosition.value = { ...player.value.position };
  }

  function initLevelEvents(): void {
    events.value = [
      {
        id: 'earthquake_1',
        type: 'earthquake',
        triggerTime: 30,
        duration: 5,
        active: false,
        intensity: 1,
      },
      {
        id: 'bridge_collapse',
        type: 'bridge_collapse',
        triggerTime: 60,
        duration: 10,
        active: false,
        intensity: 2,
        affectedArea: { minX: 80, maxX: 120, minY: 0, maxY: 15 },
      },
    ];
  }

  // === Input Handling ===
  function handleKeyDown(key: string): void {
    keys.value[key] = true;

    if (player.value.dead || player.value.win || player.value.isStunned) return;

    const isJump = key === 'ArrowUp' || key === ' ' || key === 'w' || key === 'W';
    const isSlide = key === 'ArrowDown' || key === 's' || key === 'S';

    // Wall jump
    if (isJump && player.value.wallSliding && player.value.wallJumpCooldown <= 0) {
      player.value.velocity.x = player.value.facing === 'right' ? -WALL_JUMP_FORCE_X : WALL_JUMP_FORCE_X;
      player.value.velocity.y = WALL_JUMP_FORCE_Y;
      player.value.wallSliding = false;
      player.value.wallJumpCooldown = WALL_JUMP_COOLDOWN;
      player.value.onGround = false;

      // Wall jump particles
      createParticles(player.value.position.x, player.value.position.y, 'spark', 10);
    }

    // Normal jump with variable height and diagonal support
    if (isJump && player.value.onGround && !player.value.wallSliding) {
      player.value.velocity.y = JUMP_FORCE;
      player.value.onGround = false;

      // Apply horizontal boost when jumping with a direction held (diagonal jump)
      const isLeft = keys.value['ArrowLeft'] || keys.value['a'] || keys.value['A'];
      const isRight = keys.value['ArrowRight'] || keys.value['d'] || keys.value['D'];
      if (isLeft) {
        player.value.velocity.x = -MAX_SPEED * 0.8;
        player.value.facing = 'left';
      } else if (isRight) {
        player.value.velocity.x = MAX_SPEED * 0.8;
        player.value.facing = 'right';
      }

      // Jump particles
      createParticles(player.value.position.x + 0.5, player.value.position.y + 1, 'dust', 5);
    }

    // Slide
    if (isSlide && player.value.onGround) {
      player.value.isSliding = true;
      player.value.slideVelocity = player.value.facing === 'right' ? SLIDE_SPEED : -SLIDE_SPEED;
    }

    // Air dash - only when in air and NOT wall sliding
    if (isJump && !player.value.onGround && !player.value.wallSliding && player.value.airDashesRemaining > 0) {
      player.value.velocity.x = player.value.facing === 'right' ? AIR_DASH_SPEED : -AIR_DASH_SPEED;
      player.value.velocity.y = -0.5;
      player.value.airDashesRemaining--;

      // Dash particles
      createParticles(player.value.position.x, player.value.position.y, 'magic', 8);
    }
  }

  function handleKeyUp(key: string): void {
    keys.value[key] = false;

    // Variable jump - cut velocity early if released
    const isJump = key === 'ArrowUp' || key === ' ' || key === 'w' || key === 'W';
    if (isJump && player.value.velocity.y < VARIABLE_JUMP_CUTOFF) {
      player.value.velocity.y = VARIABLE_JUMP_CUTOFF;
    }

    // End slide
    const isSlide = key === 'ArrowDown' || key === 's' || key === 'S';
    if (isSlide) {
      player.value.isSliding = false;
      player.value.slideVelocity = 0;
    }
  }

  // === Physics Update ===
  function update(dt: number): void {
    if (player.value.dead || player.value.win) {
      updateParticles(dt);
      updateScreenShake();
      return;
    }

    gameTime.value += dt;
    score.value = Math.floor(gameTime.value * 10) + (player.value.health * 100);

    // Update cooldowns
    if (player.value.wallJumpCooldown > 0) player.value.wallJumpCooldown -= dt;

    // Update phase
    checkPhaseTransitions();

    // Update events
    updateLevelEvents();

    // Update moving platforms
    updateMovingPlatforms(dt);

    // Update pressure plates
    updatePressurePlates(dt);

    // Check if stuck (non-blocking)
    checkStuck().catch(() => {
      // Silently handle errors to prevent game crash
    });

    // Apply physics
    applyPhysics(dt);

    // Update enemies
    updateEnemies();

    // Update particles
    updateParticles(dt);

    // Update screen shake
    updateScreenShake();

    // Update camera
    updateCamera();

    // Check win
    checkWinCondition();
  }

  function applyPhysics(dt: number): void {
    // Ground snap - ensure player is on ground if at ground level
    if (!player.value.onGround && player.value.velocity.y >= 0) {
      for (const block of level.value.blocks) {
        if (block.type === 'air' || block.type === 'pressure_plate') continue;
        // Check if player is standing exactly on a block
        if (player.value.position.y + 1 >= block.y &&
            player.value.position.y + 1 <= block.y + 0.1 &&
            player.value.position.x + 0.5 > block.x &&
            player.value.position.x < block.x + 1) {
          player.value.position.y = block.y - 1;
          player.value.velocity.y = 0;
          player.value.onGround = true;
          break;
        }
      }
    }

    // Horizontal movement with momentum
    let targetVelX = 0;
    const isLeft = keys.value['ArrowLeft'] || keys.value['a'] || keys.value['A'];
    const isRight = keys.value['ArrowRight'] || keys.value['d'] || keys.value['D'];

    if (player.value.isSliding) {
      targetVelX = player.value.slideVelocity;
    } else {
      if (isLeft) {
        targetVelX = -MAX_SPEED;
        player.value.facing = 'left';
      }
      if (isRight) {
        targetVelX = MAX_SPEED;
        player.value.facing = 'right';
      }
    }

    // Apply acceleration/friction
    player.value.velocity.x += (targetVelX - player.value.velocity.x) * ACCELERATION;
    player.value.velocity.x *= FRICTION;

    // Gravity
    if (!player.value.onGround && !player.value.wallSliding) {
      player.value.velocity.y += GRAVITY;
    }

    // Wall slide
    if (player.value.wallSliding) {
      player.value.velocity.y = Math.min(player.value.velocity.y, WALL_SLIDE_SPEED);
    }

    // === Horizontal Movement (PREDICTIVE COLLISION) ===
    const nextX = player.value.position.x + player.value.velocity.x;

    // Horizontal collision - check BEFORE updating position
    let blockedX = false;
    for (const block of level.value.blocks) {
      if (block.type === 'air') continue;
      if (block.type === 'pressure_plate') continue; // Pass through plates

      const blockBox = {
        left: block.x,
        right: block.x + 1,
        top: block.y,
        bottom: block.y + 1,
      };

      // Player box at next position
      const playerBox = {
        left: nextX,
        right: nextX + 0.5,
        top: player.value.position.y,
        bottom: player.value.position.y + 1,
      };

      // Check vertical overlap
      if (playerBox.bottom <= blockBox.top || playerBox.top >= blockBox.bottom) {
        continue;
      }

      // Collision detected
      if (player.value.velocity.x > 0) {
        // Moving right, hit left side of block
        if (playerBox.right > blockBox.left && player.value.position.x + 0.5 <= blockBox.left) {
          player.value.position.x = blockBox.left - 0.5;
          player.value.velocity.x = 0;

          // Check for destructible block (slide kick)
          if (player.value.isSliding && isDestructibleBlock(block)) {
            breakBlock(block);
          }
          blockedX = true;
          break;
        }
      } else if (player.value.velocity.x < 0) {
        // Moving left, hit right side of block
        if (playerBox.left < blockBox.right && player.value.position.x >= blockBox.right) {
          player.value.position.x = blockBox.right;
          player.value.velocity.x = 0;

          if (player.value.isSliding && isDestructibleBlock(block)) {
            breakBlock(block);
          }
          blockedX = true;
          break;
        }
      }
    }

    // Only update X if not blocked
    if (!blockedX) {
      player.value.position.x = nextX;
    }

    // === Vertical Movement (PREDICTIVE COLLISION) ===
    const nextY = player.value.position.y + player.value.velocity.y;

    // Vertical collision - check BEFORE updating position
    player.value.onGround = false;
    let blockedY = false;

    for (const block of level.value.blocks) {
      if (block.type === 'air') continue;

      const blockBox = {
        left: block.x,
        right: block.x + 1,
        top: block.y,
        bottom: block.y + (block.type === 'pressure_plate' ? 0.2 : 1),
      };

      // Player box at next position
      const playerBox = {
        left: player.value.position.x,
        right: player.value.position.x + 0.5,
        top: nextY,
        bottom: nextY + 1,
      };

      // Check horizontal overlap
      const hasHorizontalOverlap = !(playerBox.right <= blockBox.left || playerBox.left >= blockBox.right);
      if (!hasHorizontalOverlap) {
        continue;
      }

      // Landing on top (falling down onto block)
      if (player.value.velocity.y >= 0) {
        if (playerBox.bottom >= blockBox.top && player.value.position.y + 1 <= blockBox.top + 0.5) {
          player.value.position.y = blockBox.top - 1;
          player.value.velocity.y = 0;
          player.value.onGround = true;

          // Pressure plate interaction
          if (block.type === 'pressure_plate') {
            block.isPressed = true;
            block.pressureTimer = 2; // Hold for 2 seconds
          }

          blockedY = true;
          break;
        }
      } else {
        // Hitting ceiling (moving up into block)
        if (playerBox.top < blockBox.bottom && player.value.position.y >= blockBox.bottom - 0.5) {
          player.value.position.y = blockBox.bottom;
          player.value.velocity.y = 0;
          blockedY = true;
          break;
        }
      }
    }

    // Only update Y if not blocked
    if (!blockedY) {
      player.value.position.y = nextY;
    }

    // Wall slide detection - check BOTH directions
    detectWallSlide();

    // Bounds checking
    if (player.value.position.x < 0) player.value.position.x = 0;
    if (player.value.position.x > level.value.width) player.value.position.x = level.value.width;

    // Fall death
    if (player.value.position.y > level.value.height + 2) {
      die('fell');
    }
  }

  function detectWallSlide(): void {
    const isTouchingWallLeft = checkWallContact('left');
    const isTouchingWallRight = checkWallContact('right');
    const isTouchingWall = isTouchingWallLeft || isTouchingWallRight;
    const canSlide = player.value.velocity.y > 0 && !player.value.onGround;

    if (isTouchingWall && canSlide) {
      if (!player.value.wallSliding) {
        // Just started sliding
        createParticles(player.value.position.x, player.value.position.y, 'dust', 3);
      }
      player.value.wallSliding = true;
      // Update facing direction based on which wall we're touching
      if (isTouchingWallLeft) player.value.facing = 'left';
      if (isTouchingWallRight) player.value.facing = 'right';
    } else {
      player.value.wallSliding = false;
    }
  }

  function checkWallContact(direction: 'left' | 'right'): boolean {
    const checkX = direction === 'right'
      ? player.value.position.x + 0.5
      : player.value.position.x;

    for (const block of level.value.blocks) {
      if (block.type === 'air' || block.type === 'pressure_plate') continue;

      const blockLeft = block.x;
      const blockRight = block.x + 1;
      const blockTop = block.y;
      const blockBottom = block.y + 1;

      // Check if player's side is touching the block
      if (checkX >= blockLeft - 0.05 && checkX <= blockRight + 0.05 &&
          player.value.position.y + 0.5 > blockTop && player.value.position.y + 0.5 < blockBottom) {
        return true;
      }
    }
    return false;
  }

  // === Moving Platforms ===
  function updateMovingPlatforms(dt: number): void {
    for (const block of level.value.blocks) {
      if (block.type === 'moving_platform' && block.movingDirection === 'vertical') {
        // Simple oscillation
        const baseY = 8;
        const range = block.movingRange || 3;
        const speed = block.movingSpeed || 0.5;
        const offset = block.movingOffset || 0;

        block.y = baseY + Math.sin(gameTime.value * speed + offset) * range;
      }
    }
  }

  // === Pressure Plates ===
  function updatePressurePlates(dt: number): void {
    for (const block of level.value.blocks) {
      if (block.type === 'pressure_plate' && block.isPressed) {
        if (block.pressureTimer !== undefined) {
          block.pressureTimer -= dt;
          if (block.pressureTimer <= 0) {
            block.isPressed = false;
          }
        }
      }
    }
  }

  // === Destruction ===
  function breakBlock(block: ExtendedGameBlock): void {
    if (!isDestructibleBlock(block) || block.hp === undefined) return;

    block.hp--;

    // Explosion particles
    createParticles(block.x, block.y, 'explosion', 20);
    createParticles(block.x, block.y, 'debris', 10);

    // Screen shake
    addScreenShake(0.3, 0.5);

    if (block.hp <= 0) {
      block.type = 'air';
      score.value += 50;
    }
  }

  // === Particles ===
  function createParticles(
    x: number,
    y: number,
    type: ExtendedParticle['type'],
    count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 0.5 + 0.2;

      const particle: ExtendedParticle = {
        id: generateUUID(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        type,
        color: getParticleColor(type),
        size: 0.2 + Math.random() * 0.2,
        gravity: type !== 'spark' && type !== 'magic',
      };
      particles.value.push(particle);
    }
  }

  function getParticleColor(type: ExtendedParticle['type']): string {
    const colors: Record<ExtendedParticle['type'], string> = {
      dust: '#bdbdbd',
      coin: '#ffd700',
      break: '#8d6e63',
      explosion: '#ff6b35',
      debris: '#6d4c41',
      spark: '#ffffff',
      blood: '#d32f2f',
      magic: '#9c27b0',
    };
    return colors[type];
  }

  function updateParticles(dt: number): void {
    particles.value.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += GRAVITY * 0.5;
      p.life -= dt;
    });
    particles.value = particles.value.filter(p => p.life > 0);
  }

  // === Screen Shake ===
  function addScreenShake(intensity: number, decay: number): void {
    screenShake.value = {
      intensity: (screenShake.value?.intensity || 0) + intensity,
      decay,
    };
  }

  function updateScreenShake(): void {
    if (screenShake.value) {
      screenShake.value.intensity *= (1 - screenShake.value.decay);
      if (screenShake.value.intensity < 0.05) {
        screenShake.value = undefined;
      }
    }
  }

  // === Enemies ===
  function updateEnemies(): void {
    enemies.value.forEach(enemy => {
      if (!enemy.alive) return;

      // Simple patrol
      if (enemy.state === 'patrol') {
        enemy.x += enemy.vx;
        if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
          enemy.vx *= -1;
        }

        // Simple ground check for enemies
        enemy.vy += GRAVITY;
        enemy.y += enemy.vy;

        // Check for ground collision
        const groundBlock = level.value.blocks.find(b =>
          b.type !== 'air' &&
          b.type !== 'pressure_plate' &&
          Math.floor(enemy.x) === b.x &&
          Math.floor(enemy.y) + 1 === b.y
        );
        if (groundBlock) {
          enemy.y = groundBlock.y - 1;
          enemy.vy = 0;
        }

        // Collision with player
        if (checkPlayerEnemyCollision(enemy)) {
          if (player.value.velocity.y > 0 && player.value.position.y < enemy.y) {
            // Stomp
            enemy.alive = false;
            player.value.velocity.y = -6;
            score.value += 200;
            createParticles(enemy.x, enemy.y, 'explosion', 15);
            addScreenShake(0.5, 0.5);
          } else if (!player.value.invincible) {
            takeDamage(1, enemy);
          }
        }
      }
    });
  }

  function checkPlayerEnemyCollision(enemy: ExtendedEnemy): boolean {
    return (
      Math.abs(player.value.position.x - enemy.x) < 0.6 &&
      Math.abs(player.value.position.y - enemy.y) < 0.8
    );
  }

  // === Damage & Death ===
  function takeDamage(amount: number, enemy?: ExtendedEnemy): void {
    if (player.value.invincible) return;

    player.value.health -= amount;
    player.value.invincible = true;
    player.value.invincibleTime = 2;
    player.value.velocity.y = -5;
    player.value.velocity.x = player.value.facing === 'right' ? -5 : 5;

    addScreenShake(1.0, 0.3);
    createParticles(player.value.position.x, player.value.position.y, 'blood', 20);

    if (player.value.health <= 0) {
      die(enemy?.type || 'hit-by-enemy');
    }
  }

  function die(deathType?: string): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _deathType = deathType;
    player.value.dead = true;
    deathCount.value++;

    // Narrative for death
    const deathMessages = [
      "The temple... claims another...",
      "Death... awaits... below...",
      "Try... again...",
    ];
    const msg = deathMessages[Math.floor(Math.random() * deathMessages.length)];
    showNarrative(msg, 'desperate');
  }

  // === Level Events & Phases ===
  function checkPhaseTransitions(): void {
    const nextPhase = level.value.phaseTransitions.find(
      t => t.time === Math.floor(gameTime.value) && t.phase !== currentPhase.value
    );

    if (nextPhase) {
      // Trigger phase narrative
      showNarrative(nextPhase.message, nextPhase.urgency);

      // Visual feedback
      if (nextPhase.phase === 'awakening') {
        addScreenShake(2.0, 0.2);
        createParticles(player.value.position.x, player.value.position.y, 'explosion', 50);
      }
    }
  }

  function updateLevelEvents(): void {
    events.value.forEach(event => {
      if (!event.active && gameTime.value >= event.triggerTime) {
        event.active = true;

        // Trigger effects based on event type
        if (event.type === 'earthquake') {
          addScreenShake(event.intensity * 2, 0.2);
          narrativeMessage.value = "*The temple shakes...*";
        }
        if (event.type === 'bridge_collapse') {
          // Destroy blocks in affected area
          level.value.blocks = level.value.blocks.filter(block => {
            if (
              block.type === 'weak' || block.type === 'wood'
            ) {
              const inArea = event.affectedArea &&
                block.x >= event.affectedArea.minX &&
                block.x <= event.affectedArea.maxX;
              if (inArea) {
                createParticles(block.x, block.y, 'debris', 10);
                return false; // Remove block
              }
            }
            return true;
          });
        }
      }

      // Update duration
      if (event.active && gameTime.value > event.triggerTime + event.duration) {
        event.active = false;
      }
    });
  }

  // === AI Narrative ===
  async function checkStuck(): Promise<void> {
    const dx = player.value.position.x - lastPosition.value.x;
    const dy = player.value.position.y - lastPosition.value.y;
    const moved = Math.sqrt(dx * dx + dy * dy) < 0.1;

    if (moved) {
      stuckTimer.value += 1 / 60;
    } else {
      stuckTimer.value = 0;
    }

    lastPosition.value = { ...player.value.position };

    // Request hint if stuck for 10+ seconds
    if (stuckTimer.value > 10 && !narrativeMessage.value) {
      const context: NarratorContext = {
        phase: currentPhase.value,
        timeElapsed: gameTime.value,
        health: player.value.health,
        maxHealth: player.value.maxHealth,
        stuckTime: Math.floor(stuckTimer.value),
        deathCount: deathCount.value,
        currentSection: getCurrentSection(),
        playerPosition: player.value.position,
      };

      const hint = await aiNarrator.getHint(context);
      showNarrative(hint, 'calm');
    }
  }

  function getCurrentSection(): string {
    const x = player.value.position.x;
    if (x < 40) return 'entrance';
    if (x < 80) return 'puzzle_hall';
    if (x < 140) return 'collapse_zone';
    return 'final_ascent';
  }

  function showNarrative(message: string, urgency: 'calm' | 'urgent' | 'desperate'): void {
    narrativeMessage.value = message;
    narrativeUrgency.value = urgency;

    // Clear after 5 seconds
    setTimeout(() => {
      if (narrativeMessage.value === message) {
        narrativeMessage.value = "";
      }
    }, 5000);
  }

  // === Camera ===
  function updateCamera(): void {
    // Smooth camera follow (horizontal only for 2D side-scroller)
    const targetX = player.value.position.x - 6;

    cameraX.value += (targetX - cameraX.value) * 0.1;

    // Clamp horizontal
    cameraX.value = Math.max(0, Math.min(cameraX.value, level.value.width - 12));

    // Fixed vertical position
    cameraY.value = 0;
  }

  // === Win Condition ===
  function checkWinCondition(): void {
    if (
      Math.abs(player.value.position.x - level.value.flagX) < 1.5 &&
      Math.abs(player.value.position.y - level.value.flagY) < 1.5
    ) {
      winGame();
    }
  }

  function winGame(): void {
    player.value.win = true;
    narrativeMessage.value = "Freedom... you... live...";
    narrativeUrgency.value = 'calm';
  }

  return {
    // State
    level,
    player,
    enemies: computed(() => enemies.value),
    particles: computed(() => particles.value),
    cameraX,
    cameraY,
    gameTime,
    score,
    currentPhase,
    narrativeMessage,
    narrativeUrgency,
    screenShake,
    deathCount,

    // Actions
    initGame,
    resetPlayer,
    handleKeyDown,
    handleKeyUp,
    update,
    winGame,
    die,
    showNarrative,
    createParticles,
  };
});