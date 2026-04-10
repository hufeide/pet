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

        <!-- Accessories (outfit) -->
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

        <!-- Eyes -->
        <g :class="['eyes', 'eyes-' + emotionalState]">
          <circle cx="38" cy="42" r="3" fill="#333" />
          <circle cx="62" cy="42" r="3" fill="#333" />
        </g>

        <!-- Eyebrows (expression) -->
        <g
          v-if="emotionalState === 'sad' || emotionalState === 'angry'"
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
            :width="(pet.stats.happiness / 100) * 90"
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
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">❤️</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.stats.happiness + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">🍗</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.stats.hunger + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">❤️</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.stats.health + '%' }"
            />
          </div>
        </div>
        <div class="stat-item">
          <span class="stat-label">⚡</span>
          <div class="stat-bar">
            <div
              class="stat-fill"
              :style="{ width: pet.stats.energy + '%' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePetStore } from '../store/pet';
import { PetForm, PersonalityTrait } from '../types';

const props = defineProps<{
  showStats?: boolean;
}>();

const emit = defineEmits<{
  (e: 'start-chat'): void;
}>();

const petStore = usePetStore();

const pet = computed(() => petStore.pet);
const currentForm = computed(() => pet.value.form);
const emotionalState = computed(() => {
  if (pet.value.stats.happiness < 30) return 'sad';
  if (pet.value.stats.hunger < 30) return 'hungry';
  if (pet.value.stats.energy < 30) return 'tired';
  if (pet.value.stats.happiness > 80) return 'happy';
  return 'neutral';
});

const colorTheme = computed(() => ({
  body: getColorForLevel(pet.value.level),
  glow: getGlowColor(pet.value.level),
  accessory: '#ffffff',
}));

const currentOutfit = computed(() => {
  return pet.value.inventory.filter((item) => item.type === 'outfit');
});

const levelName = computed(() => `Level ${pet.value.level}`);

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

function getAccessoryPath(item: any): string {
  // Default accessory shape
  switch (item.metadata.shape) {
    case 'bow':
      return 'M40 20 Q50 10 60 20 Q60 30 50 30 Q40 30 40 20';
    case 'hat':
      return 'M30 20 L70 20 L60 5 L40 5 Z';
    default:
      return 'M35 45 L65 45 L65 55 L35 55 Z';
  }
}

function handlePetClick() {
  emit('start-chat');
}

function startChat() {
  emit('start-chat');
}

const timer = ref<number | null>(null);

onMounted(() => {
  // Auto-save pet state periodically
  timer.value = window.setInterval(() => {
    petStore.saveToDB();
  }, 30000);
});

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
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
