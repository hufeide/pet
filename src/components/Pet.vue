<template>
  <div class="pet-container">
    <div class="pet-wrapper" @click="handlePetClick">
      <svg
        class="pet"
        :class="['form-' + currentForm, 'mood-' + emotionalState]"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Background glow -->
        <circle
          class="glow"
          cx="50"
          cy="50"
          r="45"
          :fill="colorTheme.glow"
          opacity="0.3"
        />

        <!-- Pet body -->
        <g class="body">
          <circle
            cx="50"
            cy="50"
            r="30"
            :fill="colorTheme.body"
            stroke="rgba(0,0,0,0.1)"
            stroke-width="2"
          />
        </g>

        <!-- Accessories (outfit) - disabled until inventory system is implemented -->
        <!--
        <g
          v-for="item in currentOutfit"
          :key="item.id"
          class="accessory"
        >
          <path
            v-if="item.type === 'outfit'"
            :d="getAccessoryPath(item)"
            :fill="item.metadata.color || colorTheme.accessory"
            stroke="rgba(0,0,0,0.1)"
            stroke-width="1"
          />
        </g>
        -->

        <!-- Eyes -->
        <g :class="['eyes', 'eyes-' + emotionalState]">
          <circle cx="38" cy="42" r="3" fill="#333" />
          <circle cx="62" cy="42" r="3" fill="#333" />
        </g>

        <!-- Eyebrows (expression) -->
        <g
          v-if="emotionalState === 'sad'"
          :class="['eyebrows', 'eyebrows-' + emotionalState]"
        >
          <path d="M30 35 L46 40" stroke="#333" stroke-width="2" />
          <path d="M70 35 L54 40" stroke="#333" stroke-width="2" />
        </g>

        <!-- Mouth -->
        <g :class="['mouth', 'mouth-' + emotionalState]">
          <path
            d="M40 60 Q50 70 60 60"
            stroke="#333"
            stroke-width="2"
            fill="none"
            v-if="emotionalState === 'happy' || emotionalState === 'neutral'"
          />
          <path
            d="M40 70 Q50 60 60 70"
            stroke="#333"
            stroke-width="2"
            fill="none"
            v-else
          />
        </g>

        <!-- Cheeks (blush) -->
        <g
          v-if="emotionalState === 'happy'"
          class="cheeks"
        >
          <circle cx="30" cy="50" r="4" fill="#ff9999" opacity="0.5" />
          <circle cx="70" cy="50" r="4" fill="#ff9999" opacity="0.5" />
        </g>

        <!-- Stats overlay -->
        <g v-if="showStats" class="stats-overlay">
          <rect x="5" y="5" width="90" height="8" fill="#ddd" rx="4" />
          <rect
            x="5"
            y="5"
            :width="(pet.happiness / 100) * 90"
            height="8"
            fill="#4CAF50"
            rx="4"
          />
        </g>
      </svg>
    </div>

    <button
      class="chat-btn"
      @click="startChat"
    >
      💬 Chat with Pet
    </button>

    <div class="pet-info">
      <h3>{{ pet.name }}</h3>
      <p class="level">{{ levelName }}</p>
      <!-- Unified 4 Needs: Energy, Play, Love, Knowledge -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">⚡ 能量</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.energy + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">🎾 玩耍</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.play + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">❤️ 爱意</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.love + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">📚 知识</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.knowledge + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePetKingdomStore } from '../store/pet-kingdom';
import { PetForm, PersonalityTrait } from '../types';

const props = defineProps<{
  showStats?: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-chat'): void;
}>();

const petKingdomStore = usePetKingdomStore();

// Use petStatus from pet-kingdom store as the single source of truth
const pet = computed(() => petKingdomStore.petStatus);
const levelName = computed(() => `Level ${pet.value.level}`);

// Color theme based on pet level
const colorTheme = computed(() => ({
  body: getColorForLevel(pet.value.level),
  glow: getGlowColor(pet.value.level),
  accessory: '#ffffff',
}));

// No inventory system in petStatus, return empty array
const currentOutfit = computed(() => []);

// Pet form based on level
const currentForm = computed(() => {
  const level = pet.value.level;
  if (level >= 5) return 'legendary';
  if (level >= 3) return 'evolved';
  return 'basic';
});

const emotionalState = computed(() => {
  if (pet.value.happiness < 30) return 'sad';
  if (pet.value.hunger < 30) return 'hungry';
  if (pet.value.sleep < 30) return 'tired';
  if (pet.value.energy < 30) return 'tired';
  if (pet.value.happiness > 80) return 'happy';
  return 'neutral';
});

function getColorForLevel(level: number): string {
  const colors: Record<number, string> = {
    1: '#ff9999',
    2: '#99ff99',
    3: '#9999ff',
    4: '#ffff99',
    5: '#ff99ff',
  };
  return colors[level % 5] || '#ffffff';
}

function getGlowColor(level: number): string {
  const colors: Record<number, string> = {
    1: '#ffcccc',
    2: '#ccffcc',
    3: '#ccccff',
    4: '#ffffcc',
    5: '#ffccff',
  };
  return colors[level % 5] || '#ffffff';
}

function handlePetClick() {
  emit('start-chat');
}

function startChat() {
  emit('start-chat');
}

const timer = ref<number | null>(null);

onMounted(() => {
  // Auto-save pet status periodically
  timer.value = window.setInterval(() => {
    petKingdomStore.checkNeeds();
  }, 30000);
});

onUnmounted(() => {
  clearInterval(timer.value);
});
</script>

<style scoped>
.pet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.pet-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
}

.pet {
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  animation: float 3s ease-in-out infinite;
}

/* Form-based styling */
.pet.form-evolved {
  animation: float 2.5s ease-in-out infinite;
}

.pet.form-final {
  animation: float 2s ease-in-out infinite;
}

.pet.form-legendary {
  animation: float 1.5s ease-in-out infinite;
}

/* Mood-based styling */
.pet.mood-happy .glow {
  animation: pulse 1s ease-in-out infinite;
}

.pet.mood-sad {
  filter: brightness(0.8);
}

/* Pet parts animations */
.eyes-happy circle {
  animation: blink 3s infinite;
}

.eyes-sad circle {
  animation: none;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

@keyframes blink {
  0%, 96%, 100% { transform: scaleY(1); }
  98% { transform: scaleY(0.1); }
}

.pet-info {
  text-align: center;
}

.pet-info h3 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
  color: #333;
}

.level {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
  max-width: 300px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 1.2rem;
}

.stat-bar {
  width: 100%;
  height: 10px;
  background: #eee;
  border-radius: 5px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.stat-fill:first-child {
  background: #4CAF50;
}

.stat-fill:nth-child(2) {
  background: #FF9800;
}

.stat-fill:nth-child(3) {
  background: #F44336;
}

.stat-fill:nth-child(4) {
  background: #2196F3;
}

.chat-btn {
  padding: 10px 20px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-btn:hover {
  background: #1565C0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(25, 118, 210, 0.3);
}

.chat-btn:active {
  transform: translateY(0);
}
</style>
