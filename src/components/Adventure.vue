<template>
  <div class="adventure-panel">
    <div class="panel-header" v-if="currentLevel">
      <h3>Adventure Game - 横版闯关</h3>
      <div class="game-stats">
        <span>关卡: {{ currentLevel.name }}</span>
        <span>时间: {{ Math.floor(gameTime) }}s</span>
        <span>分数: {{ score }}</span>
        <span>生命: {{ player.lives }}</span>
      </div>
    </div>

    <div class="game-container">
      <div
        class="game-world"
        :style="{ transform: currentLevel ? `translateX(-${cameraX * 32}px)` : 'translateX(0)' }"
      >
        <!-- 背景 -->
        <div
          class="background"
          :class="`bg-${currentLevel.background}`"
          :style="{ width: currentLevel ? currentLevel.width * 32 + 'px' : '100%' }"
        ></div>

        <!-- 方块层 -->
        <div class="blocks-layer">
          <div
            v-for="block in blocks"
            :key="`${block.x}-${block.y}`"
            class="block"
            :class="`block-${block.type}`"
            :style="{ left: block.x * 32 + 'px', top: block.y * 32 + 'px' }"
          ></div>
        </div>

        <!-- 敌人层 -->
        <div class="enemies-layer">
          <template v-for="enemy in enemies" :key="enemy.id">
            <div
              v-if="enemy.alive"
              class="enemy"
              :class="`enemy-${enemy.type}`"
              :style="{ left: enemy.x * 32 + 'px', top: enemy.y * 32 + 'px' }"
            ></div>
          </template>
        </div>

        <!-- 粒子效果层 -->
        <div class="particles-layer">
          <template v-for="particle in particles" :key="particle.id">
            <div
              class="particle"
              :style="{
                left: particle.x * 32 + 'px',
                top: particle.y * 32 + 'px',
                backgroundColor: particle.color,
                opacity: particle.life,
              }"
            ></div>
          </template>
        </div>

        <!-- 玩家 -->
        <div
          class="player"
          :class="[
            `facing-${player.facing}`,
            { 'player-invincible': player.invincible && Math.floor(gameTime * 10) % 2 === 0 },
          ]"
          :style="{
            left: player.position.x * 32 + 'px',
            top: player.position.y * 32 + 'px',
          }"
        >
          <div class="player-body"></div>
          <div class="player-head"></div>
        </div>

        <!-- 胜利/失败覆盖层 -->
        <div v-if="gameStatus === 'win' && currentLevel" class="overlay win-overlay">
          <div class="overlay-content">
            <h2>关卡完成!</h2>
            <p>分数: {{ score }}</p>
            <p>获得经验: +50</p>
            <button @click="nextLevel">下一关</button>
          </div>
        </div>

        <div v-if="gameStatus === 'dead'" class="overlay fail-overlay">
          <div class="overlay-content">
            <h2>游戏结束</h2>
            <p>原因: {{ failureReason }}</p>
            <p>最终分数: {{ score }}</p>
            <button @click="restartLevel">重新开始</button>
          </div>
        </div>
      </div>
    </div>

    <div class="controls-info">
      <h4>操作说明</h4>
      <div class="control-row">
        <span>← → 或 A/D: 移动</span>
        <span>↑ 或 空格: 跳跃</span>
      </div>
      <div class="control-row">
        <span>↓ 或 S: 快速下落</span>
      </div>
    </div>

    <div class="game-actions">
      <button @click="restartLevel">重置游戏</button>
      <button @click="skipLevel">跳过关卡</button>
    </div>

    <div class="level-info" v-if="currentLevel">
      <h4>当前关卡信息</h4>
      <p>{{ currentLevel.name }} - 难度: {{ currentLevel.difficulty }}</p>
      <p>目标: 抵达终点旗帜</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAdventureStore } from '../store/adventure';

const props = defineProps<{
  showStats?: boolean;
}>();

// LEVELS 常量
const LEVELS = [
  {
    id: 'level_1',
    name: '始之地',
    width: 200,
    height: 15,
    spawnX: 2.0,
    spawnY: 10,
    flagX: 180,
    background: 'day',
    difficulty: 1,
  },
  {
    id: 'level_2',
    name: '森林秘境',
    width: 250,
    height: 15,
    spawnX: 2.0,
    spawnY: 10,
    flagX: 230,
    background: 'cave',
    difficulty: 2,
  },
  {
    id: 'level_3',
    name: '火山地带',
    width: 300,
    height: 15,
    spawnX: 2.0,
    spawnY: 10,
    flagX: 280,
    background: 'night',
    difficulty: 3,
  },
];

const adventureStore = useAdventureStore();

const currentLevel = computed(() => adventureStore.currentLevel || null);
const player = computed(() => adventureStore.player || { position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, onGround: false, facing: 'right', invincible: false, invincibleTime: 0, dead: false, win: false, coins: 0, lives: 3 });
const enemiesList = computed(() => adventureStore.enemies ?? []);
const particlesList = computed(() => adventureStore.particles ?? []);
const blocksList = computed(() => adventureStore.blocks ?? []);
const cameraX = computed(() => adventureStore.cameraX ?? 0);
const gameTime = computed(() => adventureStore.gameTime ?? 0);
const score = computed(() => adventureStore.score ?? 0);
const gameStatus = computed(() => adventureStore.gameStatus ?? 'playing');

// 确保 enemies 是数组（防止 undefined）
const enemies = computed(() => {
  const list = enemiesList.value;
  return Array.isArray(list) ? list : [];
});
const particles = computed(() => {
  const list = particlesList.value;
  return Array.isArray(list) ? list : [];
});
const blocks = computed(() => {
  const list = blocksList.value;
  return Array.isArray(list) ? list : [];
});

const failureReason = ref('unknown');
const animationFrameId = ref<number | null>(null);

// 游戏循环
let lastTime = 0;
let isFirstFrame = true;

function gameLoop(timestamp: number): void {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  // 第一帧跳过更新，避免 dt 过大导致异常
  if (!isFirstFrame) {
    // 更新游戏逻辑
    adventureStore.update(dt);
  } else {
    isFirstFrame = false;
  }

  animationFrameId.value = requestAnimationFrame(gameLoop);
}

onMounted(() => {
  // 初始化第一关
  adventureStore.initLevel(0);
  lastTime = performance.now();
  animationFrameId.value = requestAnimationFrame(gameLoop);

  // 键盘事件监听
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

function handleKeyDown(e: KeyboardEvent): void {
  adventureStore.handleKeyDown(e.key);
}

function handleKeyUp(e: KeyboardEvent): void {
  adventureStore.handleKeyUp(e.key);
}

function nextLevel(): void {
  const currentLevelIndex = LEVELS.findIndex(l => l.id === currentLevel.value?.id);
  const nextIndex = (currentLevelIndex + 1) % LEVELS.length;
  adventureStore.initLevel(nextIndex);
}

function restartLevel(): void {
  adventureStore.initLevel(LEVELS.findIndex(l => l.id === currentLevel.value?.id));
}

function skipLevel(): void {
  // 强制胜利
  adventureStore.winLevel();
  nextLevel();
}

</script>

<style scoped>
.adventure-panel {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.game-stats {
  display: flex;
  gap: 16px;
  font-size: 0.85rem;
  color: #666;
}

.game-container {
  flex: 1;
  background: #87CEEB;
  border: 4px solid #555;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  min-height: 400px;
  max-height: 500px;
}

.game-world {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 背景 */
.background {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 0;
}

.bg-day {
  background: linear-gradient(to bottom, #87CEEB, #E0F7FA);
}

.bg-cave {
  background: linear-gradient(to bottom, #4A4A4A, #2B2B2B);
}

.bg-night {
  background: linear-gradient(to bottom, #191970, #000033);
}

/* 方块 */
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
}

.block-ground {
  background: #4CAF50;
  border-top: 4px solid #66BB6A;
}

.block-brick {
  background: #795548;
  border: 2px solid #5D4037;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 15px,
    #5D4037 15px,
    #5D4037 16px
  );
}

.block-question {
  background: #FFD700;
  border: 2px solid #FFA000;
  animation: bounce 1s infinite;
}

.block-block {
  background: #8D6E63;
  border: 2px solid #6D4C41;
}

.block-hard {
  background: #616161;
  border: 3px solid #212121;
}

.block-pipe {
  background: linear-gradient(to right, #2E7D32, #4CAF50, #2E7D32);
  border-radius: 4px;
}

.block-flag {
  background: transparent;
}

.block-flag::after {
  content: '🚩';
  position: absolute;
  top: -20px;
  left: 8px;
  font-size: 24px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* 敌人 */
.enemies-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.enemy {
  position: absolute;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.enemy-goomba {
  background: #8D6E63;
  border-radius: 50% 50% 0 0;
}

.enemy-goomba::before {
  content: '🍄';
  font-size: 24px;
}

.enemy-turtle {
  background: #4CAF50;
  border-radius: 4px;
}

.enemy-turtle::before {
  content: '🐢';
  font-size: 24px;
}

.enemy-plant {
  background: #2E7D32;
  border-radius: 0 0 50% 50%;
}

.enemy-plant::before {
  content: '🌿';
  font-size: 24px;
}

/* 粒子 */
.particles-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 玩家 */
.player {
  position: absolute;
  width: 24px;
  height: 32px;
  z-index: 4;
}

.player-body {
  position: absolute;
  bottom: 0;
  left: 4px;
  width: 16px;
  height: 20px;
  background: #1976D2;
  border-radius: 4px;
}

.player-head {
  position: absolute;
  bottom: 20px;
  left: 4px;
  width: 16px;
  height: 12px;
  background: #FFCC80;
  border-radius: 4px;
}

.facing-right .player-body {
  transform-origin: center;
}

.facing-left .player-body {
  transform: scaleX(-1);
}

.player-invincible {
  animation: invincible 0.5s infinite;
}

@keyframes invincible {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 覆盖层 */
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.overlay-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.overlay-content h2 {
  margin: 0 0 16px 0;
  font-size: 2rem;
}

.overlay-content p {
  margin: 8px 0;
  font-size: 1.1rem;
}

.win-overlay .overlay-content h2 {
  color: #4CAF50;
}

.fail-overlay .overlay-content h2 {
  color: #F44336;
}

.overlay-content button {
  margin-top: 20px;
  padding: 10px 24px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.overlay-content button:hover {
  background: #1565C0;
}

.controls-info {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
}

.controls-info h4 {
  margin: 0 0 8px 0;
  font-size: 0.9rem;
  color: #333;
}

.control-row {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.game-actions {
  display: flex;
  gap: 8px;
}

.game-actions button {
  flex: 1;
  padding: 10px;
  background: #757575;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.game-actions button:hover {
  background: #616161;
}

.level-info {
  background: #fff3e0;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.level-info h4 {
  margin: 0 0 8px 0;
  color: #E65100;
}

.level-info p {
  margin: 4px 0;
  color: #666;
}
</style>
