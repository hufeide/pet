<template>
  <div class="adventure-ultimate-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="title-section">
        <h3>The Last Guardian</h3>
        <span
          class="phase-badge"
          :class="currentPhase"
        >
          {{ phaseDisplay }}
        </span>
      </div>
      <div class="game-stats">
        <span class="stat health">❤️ {{ player.health }}/{{ player.maxHealth }}</span>
        <span class="stat time">⏱️ {{ Math.floor(gameTime) }}s</span>
        <span class="stat score">⭐ {{ score }}</span>
        <span class="stat deaths">💀 {{ deathCount }}</span>
      </div>
    </div>

    <!-- Game Container -->
    <div class="game-container">
      <!-- Background with phase-based gradient -->
      <div
        class="background"
        :class="backgroundClass"
        :style="backgroundStyle"
      >
        <!-- Floating particles for atmosphere -->
        <div
          v-for="i in 20"
          :key="i"
          class="ambient-particle"
          :style="{
            left: (i * 17) % 100 + '%',
            top: (i * 23) % 100 + '%',
            animationDelay: -(i * 2) + 's',
            opacity: 0.1 + (i % 5) * 0.1,
          }"
        />
      </div>

      <!-- Game World (with screen shake) -->
      <div
        class="game-world"
        :style="{
          transform: `translate(${
            -cameraX * 32 + (screenShake?.intensity || 0) * (Math.random() - 0.5) * 10
          }px) translate(${
            -cameraY * 32 + (screenShake?.intensity || 0) * (Math.random() - 0.5) * 10
          }px)`,
        }"
      >
        <!-- Blocks -->
        <div class="blocks-layer">
          <div
            v-for="block in levelBlocks"
            v-show="block.type !== 'air'"
            :key="block.id || `${block.x}-${block.y}`"
            class="block"
            :class="[
              `block-${block.type}`,
              { 'block-pressed': block.isPressed },
            ]"
            :style="{
              left: block.x * 32 + 'px',
              top: block.y * 32 + 'px',
              opacity: block.hp !== undefined && block.hp < (block.maxHp || 1) ? 0.5 : 1,
            }"
          >
            <!-- Health indicator for destructible blocks -->
            <div
              v-if="block.hp !== undefined && block.hp < (block.maxHp || 1)"
              class="block-hp"
            >
              {{ block.hp }}/{{ block.maxHp }}
            </div>
          </div>
        </div>

        <!-- Enemies -->
        <div class="enemies-layer">
          <div
            v-for="enemy in enemies"
            v-show="enemy.alive"
            :key="enemy.id"
            class="enemy"
            :class="`enemy-${enemy.type}`"
            :style="{
              left: enemy.x * 32 + 'px',
              top: enemy.y * 32 + 'px',
              width: enemy.type === 'falling_statue' ? '64px' : '32px',
              height: enemy.type === 'falling_statue' ? '64px' : '32px',
            }"
          >
            <span v-if="enemy.type === 'falling_statue'">🗿</span>
            <span v-else-if="enemy.type === 'goomba'">🍄</span>
            <span v-else-if="enemy.type === 'turtle'">🐢</span>
          </div>
        </div>

        <!-- Particles -->
        <div class="particles-layer">
          <div
            v-for="particle in particles"
            :key="particle.id"
            class="particle"
            :style="{
              left: particle.x * 32 + 'px',
              top: particle.y * 32 + 'px',
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
              width: (particle.size || 0.5) * 8 + 'px',
              height: (particle.size || 0.5) * 8 + 'px',
            }"
          />
        </div>

        <!-- Player -->
        <div
          class="player"
          :class="[
            `facing-${player.facing}`,
            {
              'player-invincible': player.invincible && Math.floor(gameTime * 10) % 2 === 0,
              'player-sliding': player.isSliding,
              'player-wall-slide': player.wallSliding,
            },
          ]"
          :style="{
            left: player.position.x * 32 + 'px',
            top: player.position.y * 32 + 'px',
          }"
        >
          <!-- Player body -->
          <div class="player-body">
            <div class="player-torso" />
            <div class="player-legs" />
          </div>
          <div class="player-head">
            <div class="player-face">
              <div class="eye left" />
              <div class="eye right" />
            </div>
          </div>
          <!-- Cape for momentum visualization -->
          <div class="player-cape" />
        </div>

        <!-- AI Narrative Overlay -->
        <div
          v-if="narrativeMessage"
          class="narrative-overlay"
          :class="narrativeUrgency"
        >
          <div class="narrator-avatar">
            👑
          </div>
          <div class="narrative-bubble">
            <span class="narrator-name">Aethel:</span>
            <span class="narrator-text">{{ narrativeMessage }}</span>
          </div>
        </div>

        <!-- Game Over Overlay -->
        <div
          v-if="player.dead"
          class="overlay overlay-dead"
        >
          <div class="overlay-content">
            <h2>💀 You Fell</h2>
            <p>Time: {{ Math.floor(gameTime) }}s</p>
            <p>Score: {{ score }}</p>
            <p>Deaths: {{ deathCount }}</p>
            <button @click="restartGame">
              Try Again
            </button>
          </div>
        </div>

        <!-- Victory Overlay -->
        <div
          v-if="player.win"
          class="overlay overlay-win"
        >
          <div class="overlay-content">
            <h2>🚀 Freedom!</h2>
            <p>You escaped the collapsing temple</p>
            <p>Time: {{ Math.floor(gameTime) }}s</p>
            <p>Score: {{ score }}</p>
            <p>Deaths: {{ deathCount }}</p>
            <button @click="restartGame">
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls & Info -->
    <div class="controls-panel">
      <div class="controls-info">
        <h4>Controls</h4>
        <div class="control-grid">
          <div class="control-item">
            <kbd>←→</kbd> Move
          </div>
          <div class="control-item">
            <kbd>↑/Space</kbd> Jump (hold = higher)
          </div>
          <div class="control-item">
            <kbd>↓</kbd> Slide (→ wall kick)
          </div>
          <div class="control-item">
            <kbd>Jump + Dir</kbd> Air Dash
          </div>
          <div class="control-item">
            <kbd>Wall + Jump</kbd> Wall Jump
          </div>
        </div>
      </div>

      <div class="phase-info">
        <h4>{{ phaseDisplay }}</h4>
        <p class="phase-desc">
          {{ phaseDescriptions[currentPhase] }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAdventureUltimateStore } from '../store/adventure-ultimate';
import { aiNarrator } from '../services/ai-narrator';

const adventureStore = useAdventureUltimateStore();

// Computed refs for safe access
const level = computed(() => adventureStore.level);
const levelBlocks = computed(() => level.value?.blocks || []);
const player = computed(() => adventureStore.player || {
  position: { x: 0, y: 0 },
  velocity: { x: 0, y: 0 },
  onGround: false,
  wallSliding: false,
  airDashesRemaining: 1,
  isSliding: false,
  facing: 'right',
  invincible: false,
  invincibleTime: 0,
  dead: false,
  win: false,
  health: 3,
  maxHealth: 3,
});
const enemies = computed(() => adventureStore.enemies || []);
const particles = computed(() => adventureStore.particles || []);
const cameraX = computed(() => adventureStore.cameraX || 0);
const cameraY = computed(() => adventureStore.cameraY || 0);
const gameTime = computed(() => adventureStore.gameTime || 0);
const score = computed(() => adventureStore.score || 0);
const currentPhase = computed(() => adventureStore.currentPhase || 'exploration');
const narrativeMessage = computed(() => adventureStore.narrativeMessage || '');
const narrativeUrgency = computed(() => adventureStore.narrativeUrgency || 'calm');
const screenShake = computed(() => adventureStore.screenShake);
const deathCount = computed(() => adventureStore.deathCount || 0);

// Phase display names
const phaseDisplay = computed(() => {
  const names: Record<string, string> = {
    exploration: 'Phase 1: The Temple',
    awakening: 'Phase 2: Awakening',
    collapse: 'Phase 3: Collapse',
    escape: 'Phase 4: Escape',
  };
  return names[currentPhase.value] || 'Unknown';
});

const phaseDescriptions = {
  exploration: 'The temple is calm. Learn the ways of the guardian.',
  awakening: 'The temple awakens. The foundations tremble...',
  collapse: 'The temple collapses! Bridges fall! Hurry!',
  escape: 'Final stretch! The exit is near!',
};

// Dynamic background based on phase
const backgroundClass = computed(() => {
  return {
    exploration: 'bg-temple',
    awakening: 'bg-temple-shake',
    collapse: 'bg-temple-collapse',
    escape: 'bg-temple-escape',
  }[currentPhase.value];
});

const backgroundStyle = computed(() => {
  const gradients = {
    exploration: 'linear-gradient(to bottom, #2c1810, #5d4037, #3e2723)',
    awakening: 'linear-gradient(to bottom, #3e2723, #5d4037, #8d6e63, #3e2723)',
    collapse: 'linear-gradient(to bottom, #b71c1c, #d32f2f, #ff5722, #b71c1c)',
    escape: 'linear-gradient(to bottom, #1a237e, #283593, #5c6bc0, #1a237e)',
  };
  return {
    background: gradients[currentPhase.value],
  };
});

// Animation frame
const animationFrameId = ref<number | null>(null);
let lastTime = 0;
let isFirstFrame = true;
let hasStarted = false;

function gameLoop(timestamp: number): void {
  // Initialize lastTime on first frame to avoid huge dt
  if (!hasStarted) {
    lastTime = timestamp;
    hasStarted = true;
  }

  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // Cap at 100ms
  lastTime = timestamp;

  adventureStore.update(dt);

  animationFrameId.value = requestAnimationFrame(gameLoop);
}

// Input handlers
function handleKeyDown(e: KeyboardEvent): void {
  adventureStore.handleKeyDown(e.key);
}

function handleKeyUp(e: KeyboardEvent): void {
  adventureStore.handleKeyUp(e.key);
}

// Lifecycle
onMounted(async () => {
  // Initialize AI narrator after Pinia is set up
  await aiNarrator.initialize().catch(err => {
    console.error('AI Narrator init error:', err);
  });

  // Initialize game
  adventureStore.initGame();

  lastTime = performance.now();
  animationFrameId.value = requestAnimationFrame(gameLoop);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
  }
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

function restartGame(): void {
  adventureStore.initGame();
  hasStarted = false;
  lastTime = 0;
}
</script>

<style scoped>
/* Container */
.adventure-ultimate-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 8px;
  background: #1a1a2e;
  border-radius: 8px;
}

/* Header */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: linear-gradient(135deg, #16213e, #1a1a2e);
  border-radius: 8px;
  border: 1px solid #0f3460;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #e94560;
  font-weight: 600;
}

.phase-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #0f3460;
  color: #e94560;
  font-weight: 600;
}

.phase-badge.exploration { background: #2e7d32; color: white; }
.phase-badge.awakening { background: #f57f17; color: white; }
.phase-badge.collapse { background: #d32f2f; color: white; }
.phase-badge.escape { background: #1976d2; color: white; }

.game-stats {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
}

.stat {
  color: #90a4ae;
  font-family: monospace;
}

.stat.health { color: #ef5350; font-weight: bold; }
.stat.time { color: #64b5f6; }
.stat.score { color: #ffb74d; }
.stat.deaths { color: #607d8b; }

/* Game Container */
.game-container {
  flex: 1;
  background: #000;
  border: 3px solid #0f3460;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 400px;
}

.background {
  position: absolute;
  inset: 0;
  z-index: 0;
  transition: background 1s ease;
}

.ambient-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: float 4s infinite ease-in-out;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); opacity: 0.1; }
  50% { transform: translate(10px, -20px); opacity: 0.3; }
}

/* Game World */
.game-world {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  will-change: transform;
}

/* Blocks */
.blocks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.block {
  position: absolute;
  width: 32px;
  height: 32px;
  box-sizing: border-box;
}

.block-ground {
  background: #3e2723;
  border-top: 4px solid #5d4037;
}

.block-hard {
  background: #424242;
  border: 3px solid #212121;
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(0,0,0,0.2) 10px,
    rgba(0,0,0,0.2) 20px
  );
}

.block-weak {
  background: #8d6e63;
  border: 2px dashed #5d4037;
  animation: crackle 2s infinite;
}

.block-wood {
  background: #6d4c41;
  border: 2px solid #3e2723;
  background-image: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 15px,
    rgba(0,0,0,0.3) 15px,
    rgba(0,0,0,0.3) 16px
  );
}

.block-pressure_plate {
  background: #ffd54f;
  height: 8px;
  border: none;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.5);
}

.block-pressure_plate.block-pressed {
  background: #ff6f00;
  box-shadow: 0 0 20px rgba(255, 111, 0, 0.8);
}

.block-moving_platform {
  background: #78909c;
  border: 2px solid #455a64;
}

.block-flag {
  background: transparent;
}

.block-flag::after {
  content: '🚩';
  position: absolute;
  top: -24px;
  left: 6px;
  font-size: 28px;
  animation: wave 1s infinite ease-in-out;
}

@keyframes wave {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

@keyframes crackle {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
}

.block-hp {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #ff5252;
  background: rgba(0,0,0,0.7);
  padding: 1px 3px;
  border-radius: 3px;
}

/* Enemies */
.enemies-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.enemy {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  z-index: 2;
}

.enemy-falling_statue {
  font-size: 32px;
  animation: descend 2s linear;
}

@keyframes descend {
  0% { transform: translateY(-50px); }
  100% { transform: translateY(0); }
}

/* Particles */
.particles-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.particle {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

/* Player */
.player {
  position: absolute;
  width: 24px;
  height: 32px;
  z-index: 4;
  transform-origin: center center;
}

.player-body {
  position: absolute;
  bottom: 0;
  left: 4px;
  width: 16px;
  height: 20px;
}

.player-torso {
  width: 16px;
  height: 12px;
  background: #1565c0;
  border-radius: 2px;
  position: absolute;
  top: 0;
}

.player-legs {
  width: 16px;
  height: 8px;
  background: #0d47a1;
  border-radius: 0 0 4px 4px;
  position: absolute;
  bottom: 0;
}

.player-head {
  position: absolute;
  bottom: 20px;
  left: 4px;
  width: 16px;
  height: 14px;
  background: #ffcc80;
  border-radius: 4px;
  overflow: hidden;
}

.player-face {
  position: absolute;
  top: 5px;
  left: 3px;
  width: 10px;
  height: 6px;
}

.eye {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #3e2723;
  border-radius: 50%;
}

.eye.left { left: 1px; }
.eye.right { right: 1px; }

.player-cape {
  position: absolute;
  top: 2px;
  left: -4px;
  width: 20px;
  height: 12px;
  background: linear-gradient(135deg, #e91e63, #880e4f);
  border-radius: 2px;
  transform-origin: right center;
  animation: capeFlow 0.5s infinite ease-in-out;
}

.player.facing-left .player-cape {
  left: auto;
  right: -4px;
  transform: scaleX(-1);
}

@keyframes capeFlow {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
}

.player.facing-left .player-body,
.player.facing-left .player-head {
  transform: scaleX(-1);
}

.player-invincible {
  animation: flash 0.2s infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.player-sliding .player-body {
  height: 12px;
}

.player-sliding .player-head {
  bottom: 12px;
}

.player-wall-slide {
  filter: drop-shadow(-2px 0 2px rgba(255,255,255,0.3));
}

/* Narrative */
.narrative-overlay {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  pointer-events: none;
  animation: fadeIn 0.3s ease-out;
}

.narrator-avatar {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

.narrative-bubble {
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border-radius: 16px;
  border: 2px solid #ffd700;
  max-width: 300px;
}

.narrator-name {
  color: #ffd700;
  font-size: 0.75rem;
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}

.narrator-text {
  color: #fff;
  font-size: 0.95rem;
  line-height: 1.4;
  font-style: italic;
}

.narrative-overlay.urgent .narrator-name { color: #ff6f00; }
.narrative-overlay.urgent .narrative-bubble { border-color: #ff6f00; }

.narrative-overlay.desperate .narrator-name { color: #f44336; }
.narrative-overlay.desperate .narrative-bubble { border-color: #f44336; }
.narrative-overlay.desperate .narrator-text {
  animation: shakeText 0.5s infinite;
}

@keyframes shakeText {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* Overlays */
.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.overlay-content {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  border: 2px solid #0f3460;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  min-width: 300px;
}

.overlay-content h2 {
  margin: 0 0 16px 0;
  font-size: 2rem;
  color: #e94560;
}

.overlay-content p {
  margin: 8px 0;
  color: #90a4ae;
  font-size: 1rem;
}

.overlay-content button {
  margin-top: 20px;
  padding: 12px 32px;
  background: #e94560;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.overlay-content button:hover {
  background: #c62828;
}

.overlay-win .overlay-content h2 { color: #4caf50; }
.overlay-dead .overlay-content h2 { color: #f44336; }

/* Controls */
.controls-panel {
  display: flex;
  gap: 16px;
  padding: 0;
}

.controls-info, .phase-info {
  flex: 1;
  background: rgba(15, 52, 96, 0.3);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 52, 96, 0.5);
}

.controls-info h4, .phase-info h4 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #e94560;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.control-item {
  font-size: 0.75rem;
  color: #b0bec5;
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-item kbd {
  background: #0f3460;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  border: 1px solid #546e7a;
}

.phase-info h4 {
  color: #ffd54f;
}

.phase-desc {
  font-size: 0.8rem;
  color: #b0bec5;
  margin: 0;
  line-height: 1.4;
}
</style>
