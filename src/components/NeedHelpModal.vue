<template>
  <div v-if="showModal" class="need-help-modal-overlay">
    <div class="need-help-modal-content">
      <div class="need-help-modal-header">
        <h3>{{ needLabel }}</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>
      <div class="need-help-modal-body">
        <div class="help-section">
          <h4>Why it decreases</h4>
          <p>{{ reason }}</p>
        </div>
        <div class="help-section">
          <h4>How to increase</h4>
          <p>{{ actions }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  show: boolean;
  needType: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const showModal = ref(false);

const helpContent = {
  happiness: {
    label: 'Happiness (❤️)',
    reason: 'Neglect or loneliness causes happiness to decrease',
    actions: 'Petting your pet, playing games together'
  },
  hunger: {
    label: 'Hunger (🍗)',
    reason: 'Time passes and hunger naturally increases',
    actions: 'Feeding your pet regularly'
  },
  health: {
    label: 'Health (❤️)',
    reason: 'Poor care or illness causes health to decrease',
    actions: 'Providing proper care, giving medicine when needed'
  },
  energy: {
    label: 'Energy (⚡)',
    reason: 'Activity decreases energy, lack of sleep also affects it',
    actions: 'Resting, putting pet to sleep'
  },
  sleep: {
    label: 'Sleep (💤)',
    reason: 'Activity and lack of rest decreases sleep need',
    actions: 'Putting pet to bed, allowing rest'
  },
  play: {
    label: 'Play (⚽)',
    reason: 'No playtime causes play need to decrease',
    actions: 'Playing games, using toys'
  },
  love: {
    label: 'Love (💖)',
    reason: 'Neglect or lack of affection causes love to decrease',
    actions: 'Petting, showing affection'
  },
  chat: {
    label: 'Chat (💬)',
    reason: 'No conversation causes chat need to decrease',
    actions: 'Talking to your pet'
  },
  knowledge: {
    label: 'Knowledge (📚)',
    reason: 'No learning causes knowledge to decrease',
    actions: 'Learning new topics, reading'
  }
};

const needLabel = computed(() => helpContent[props.needType as keyof typeof helpContent]?.label || props.needType);
const reason = computed(() => helpContent[props.needType as keyof typeof helpContent]?.reason || '');
const actions = computed(() => helpContent[props.needType as keyof typeof helpContent]?.actions || '');

watch(
  () => props.show,
  (newVal) => {
    showModal.value = newVal;
  },
  { immediate: true }
);

function closeModal() {
  showModal.value = false;
  emit('close');
}
</script>

<style scoped>
.need-help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.need-help-modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.need-help-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.need-help-modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.help-section {
  margin-bottom: 20px;
}

.help-section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.help-section p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}
</style>
