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
    reason: 'Happiness decreases when:\n• Neglect or loneliness\n• Lack of affection\n• No playtime for extended periods\n• Low energy levels\n\nThe pet needs regular interaction and affection to stay happy.',
    actions: 'Increase happiness by:\n• Petting your pet regularly\n• Playing games together\n• Showing affection\n• Taking photos together\n• Giving attention and love'
  },
  hunger: {
    label: 'Hunger (🍗)',
    reason: 'Hunger increases over time because:\n• Natural passage of time\n• Activity and movement\n• Growth and development\n\nIf hunger is too low for too long, health will start to decrease.',
    actions: 'Increase hunger (feed) by:\n• Feeding your pet regularly\n• Providing proper meals\n• Giving snacks in moderation\n• Ensuring meal times are not missed'
  },
  health: {
    label: 'Health (❤️)',
    reason: 'Health decreases when:\n• Poor care or neglect\n• Illness or disease\n• Low happiness for extended periods\n• Low energy with no rest\n• Missed feedings at meal times\n\nHealth is affected by all other stats - when they are low, health decreases faster.',
    actions: 'Increase health by:\n• Providing proper care regularly\n• Giving medicine when needed\n• Ensuring adequate rest\n• Keeping happiness high\n• Regular check-ups'
  },
  energy: {
    label: 'Energy (⚡)',
    reason: 'Energy decreases when:\n• Physical activity and play\n• Lack of sleep or rest\n• Extended periods of activity\n• Stress or anxiety\n\nLow energy affects happiness and health.',
    actions: 'Increase energy by:\n• Resting and taking breaks\n• Putting pet to sleep when tired\n• Providing energy-boosting snacks\n• Reducing excessive activity'
  },
  sleep: {
    label: 'Sleep (💤)',
    reason: 'Sleep need increases when:\n• Activity and play\n• Lack of sleep\n• Extended periods without rest\n• Staying up too late\n\nPets need regular sleep to function properly.',
    actions: 'Increase sleep by:\n• Putting pet to bed\n• Allowing adequate rest\n• Creating a comfortable sleep environment\n• Avoiding disturbances during sleep'
  },
  play: {
    label: 'Play (⚽)',
    reason: 'Play need increases when:\n• No playtime for extended periods\n• Boredom\n• Lack of stimulation\n• Confinement\n\nPlay is essential for happiness and mental health.',
    actions: 'Increase play by:\n• Playing games with your pet\n• Using toys and puzzles\n• Going for walks\n• Interactive play sessions'
  },
  love: {
    label: 'Love (💖)',
    reason: 'Love decreases when:\n• Neglect or lack of attention\n• Lack of affection\n• Long periods without interaction\n• Not showing care\n\nLove is built through consistent care and affection.',
    actions: 'Increase love by:\n• Petting and cuddling\n• Showing affection\n• Spending quality time\n• Verbal affection\n• Caregiving'
  },
  chat: {
    label: 'Chat (💬)',
    reason: 'Chat need increases when:\n• No conversation for extended periods\n• Lack of social interaction\n• Isolation\n• Not talking to your pet\n\nPets are social creatures that need interaction.',
    actions: 'Increase chat by:\n• Talking to your pet regularly\n• Having conversations\n• Explaining what you are doing\n• Reading to your pet'
  },
  knowledge: {
    label: 'Knowledge (📚)',
    reason: 'Knowledge decreases when:\n• No learning for extended periods\n• Lack of mental stimulation\n• Not reading or learning\n• Stagnation\n\nMental stimulation is important for pet development.',
    actions: 'Increase knowledge by:\n• Learning new topics together\n• Reading books\n• Exploring new concepts\n• Educational games\n• Asking questions'
  }
};

const needLabel = computed(() => {
  const key = props.needType as keyof typeof helpContent;
  return helpContent[key]?.label || props.needType;
});
const reason = computed(() => {
  const key = props.needType as keyof typeof helpContent;
  return helpContent[key]?.reason || '';
});
const actions = computed(() => {
  const key = props.needType as keyof typeof helpContent;
  return helpContent[key]?.actions || '';
});

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
