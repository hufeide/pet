<template>
  <div class="chat-container">
    <!-- Pet Status Panel - only show when isChattingWithPet is true -->
    <div class="pet-status-panel" v-if="showPetStatus && petStatus">
      <div class="status-header">
        <div class="pet-identity">
          <div class="pet-avatar">{{ getAvatar(petStatus.name) }}</div>
          <div class="pet-info">
            <h3>{{ petStatus.name }}</h3>
            <span class="status-level">Level {{ level }}</span>
          </div>
        </div>
        <div class="status-meta">
          <!-- Current Emotion Display -->
          <span class="emotion-badge" :class="emotionClass" :title="'Emotion: ' + currentEmotionLabel">
            {{ currentEmotionEmoji }}
          </span>
          <span class="friendship-badge" :class="friendshipLevel">
            {{ friendshipLevelLabel }}
          </span>
        </div>
      </div>

      <!-- Quick Stats Row - Unified 4 Needs -->
      <div class="quick-stats-row">
        <div class="quick-stat" :class="{ urgent: petStatus.energy < 40 }">
          <span class="stat-icon">⚡</span>
          <span class="stat-value">{{ petStatus.energy }}%</span>
        </div>
        <div class="quick-stat" :class="{ urgent: petStatus.play < 40 }">
          <span class="stat-icon">🎾</span>
          <span class="stat-value">{{ petStatus.play }}%</span>
        </div>
        <div class="quick-stat" :class="{ urgent: petStatus.love < 40 }">
          <span class="stat-icon">❤️</span>
          <span class="stat-value">{{ petStatus.love }}%</span>
        </div>
        <div class="quick-stat" :class="{ urgent: petStatus.knowledge < 40 }">
          <span class="stat-icon">📚</span>
          <span class="stat-value">{{ petStatus.knowledge }}%</span>
        </div>
      </div>

      <!-- Friendship Progress Bar -->
      <div class="friendship-progress" v-if="friendshipProgress < 100">
        <span class="progress-label">To {{ nextFriendshipLevel }}:</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: friendshipProgress + '%' }" />
        </div>
      </div>

      <!-- Top Personality Traits -->
      <div class="personality-traits" v-if="topTraits.length > 0">
        <span class="trait-label">性格:</span>
        <span class="trait-tag" v-for="trait in topTraits" :key="trait">{{ trait }}</span>
      </div>

      <!-- Pet Request -->
      <div v-if="petRequest" class="pet-request">
        <span class="request-icon">🐾</span>
        <span class="request-text">{{ petRequest }}</span>
        <button class="request-btn" @click="handleRequest">帮助</button>
      </div>

      <!-- Interactive Action Tags -->
      <div class="action-tags">
        <button class="action-tag" @click="handleAction('energy')" title="Energy - Restore energy">
          <span class="tag-icon">⚡</span>
          <span class="tag-text">能量</span>
        </button>
        <button class="action-tag" @click="handleAction('play')" title="Play - Play with pet">
          <span class="tag-icon">🎾</span>
          <span class="tag-text">玩耍</span>
        </button>
        <button class="action-tag" @click="handleAction('love')" title="Love - Show affection">
          <span class="tag-icon">❤️</span>
          <span class="tag-text">爱意</span>
        </button>
        <button class="action-tag" @click="handleAction('learn')" title="Learn - Learn new topic">
          <span class="tag-icon">📚</span>
          <span class="tag-text">知识</span>
        </button>
      </div>
    </div>

    <!-- Need Satisfaction Notification -->
    <div v-if="needSatisfactionNotification" class="need-satisfaction-notification">
      <span class="notification-icon">✨</span>
      <div class="notification-content">
        <span class="notification-text">{{ needSatisfactionNotification.text }}</span>
        <span class="notification-subtext">+{{ needSatisfactionNotification.increase }}% {{ needSatisfactionNotification.needLabel }}</span>
      </div>
      <button class="notification-close" @click="closeNeedSatisfactionNotification">×</button>
    </div>

    <div class="chat-history" ref="chatHistoryRef">
      <div
        v-for="message in visibleMessages"
        :key="message.id"
        :class="['message', 'message-' + message.role]"
      >
        <div class="message-content">{{ message.content }}</div>
        <div class="message-time">{{ formatDate(message.timestamp) }}</div>
      </div>

      <div v-if="loading" class="message message-loading">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>

    <div class="chat-input">
      <textarea
        v-model="input"
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        :disabled="loading"
      />
      <button
        @click="sendMessage"
        :disabled="loading || !input.trim()"
      >
        {{ loading ? '...' : '发送' }}
      </button>
    </div>

    <!-- Error Toast Notification -->
    <div v-if="errorMessage" class="error-toast">
      <span class="error-icon">⚠️</span>
      <span class="error-text">{{ errorMessage }}</span>
      <button class="error-close" @click="closeErrorToast">×</button>
    </div>
  </div>

  <NeedHelpModal
    v-if="isHelpModalOpen"
    :show="isHelpModalOpen"
    :need-type="helpModalNeed || ''"
    @close="closeNeedHelp"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePetStore } from '../store/pet';
import { usePetKingdomStore } from '../store/pet-kingdom';
import { useMemoryStore } from '../store/memory';
import { useUserStore } from '../store/user';
import NeedHelpModal from './NeedHelpModal.vue';
import { EMOTION_MAP } from '../types/pet-kingdom';

const props = defineProps<{
  maxHistory?: number;
  showPetStatus?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close-chat'): void;
}>();

const petStore = usePetStore();
const petKingdomStore = usePetKingdomStore();
const memoryStore = useMemoryStore();
const userStore = useUserStore();

const input = ref('');
const chatHistoryRef = ref<HTMLDivElement | null>(null);
const loading = computed(() => petStore.loading);
const errorMessage = ref<string | null>(null);

// Pet status from kingdom store
const petStatus = computed(() => petKingdomStore.petStatus);

// Floating change display
const floatChanges = ref<Record<string, number>>({});

// Show floating change animation
function showFloatChange(statKey: string, change: number) {
  floatChanges.value[statKey] = change;
  // Clear after animation (1.5s)
  setTimeout(() => {
    if (floatChanges.value[statKey] === change) {
      delete floatChanges.value[statKey];
    }
  }, 1500);
}

// Watch pet status changes and show floating numbers
const prevStatus = ref<typeof petStatus.value>({} as any);
watch(petStatus, (newStatus) => {
  if (!prevStatus.value || !newStatus) return;

  const stats = [
    'happiness', 'hunger', 'health', 'energy',
    'sleep', 'play', 'love', 'chat', 'knowledge'
  ] as const;

  stats.forEach(stat => {
    const oldValue = prevStatus.value[stat];
    const newValue = newStatus[stat];
    if (oldValue !== undefined && newValue !== undefined && oldValue !== newValue) {
      const change = newValue - oldValue;
      showFloatChange(stat, change);
    }
  });

  prevStatus.value = { ...newStatus };
}, { deep: true });

// Current emotion display
const currentEmotionEmoji = computed(() => {
  const emotion = petStatus.value?.currentEmotion;
  return emotion ? EMOTION_MAP[emotion as keyof typeof EMOTION_MAP]?.emoji || '🙂' : '🙂';
});
const currentEmotionLabel = computed(() => {
  const emotion = petStatus.value?.currentEmotion;
  return emotion || 'Neutral';
});
const emotionClass = computed(() => {
  const emotion = petStatus.value?.currentEmotion;
  return `emotion-${emotion?.toLowerCase() || 'neutral'}`;
});

// Current level computed from friendship
const level = computed(() => {
  const friendship = petStatus.value?.friendship || 50;
  if (friendship >= 90) return 5;
  if (friendship >= 70) return 4;
  if (friendship >= 50) return 3;
  if (friendship >= 30) return 2;
  return 1;
});

// Pet request for urgent needs
const petRequest = computed(() => petKingdomStore.petRequest);

// Friendship level from memory store
const friendshipLevel = computed(() => memoryStore.friendshipLevel);
const friendshipStats = computed(() => memoryStore.friendshipStats);
const friendshipLevelLabel = computed(() => {
  const labels: Record<string, string> = {
    stranger: '陌生人',
    acquaintance: '熟人',
    friend: '好友',
    bestFriend: '最佳好友',
  };
  return labels[friendshipLevel.value] || '陌生人';
});
const nextFriendshipLevel = computed(() => {
  const next = friendshipStats.value.nextLevel;
  const labels: Record<string, string> = {
    stranger: 'Stranger',
    acquaintance: 'Acquaintance',
    friend: 'Friend',
    bestFriend: 'Best Friend',
  };
  return next ? labels[next] : '';
});
const friendshipProgress = computed(() => friendshipStats.value.progress);

// Top personality traits
const topTraits = computed(() => {
  const profile = memoryStore.getPersonalityProfile('default');
  if (!profile || !profile.traits) return [];

  return Object.entries(profile.traits)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trait]) => trait.charAt(0).toUpperCase() + trait.slice(1));
});

// Periodic user profile update from chat history
async function updateUserProfileFromChat() {
  const chatHistory = petStore.chatHistory;
  if (chatHistory.length === 0) return;

  // Get recent messages for analysis (last 20 messages)
  const recentMessages = chatHistory.slice(-20);
  const combinedContent = recentMessages
    .map(msg => (msg as any).content)
    .join(' ');

  // Extract preferences from combined content
  const { preferences, dislikes } = userStore.extractPreferencesFromConversation(combinedContent);

  // Add extracted preferences to user profile
  for (const pref of preferences) {
    await userStore.addPreference(pref);
  }
  for (const dislike of dislikes) {
    await userStore.addDislike(dislike);
  }
}

// Knowledge sharing interval
const knowledgeShareInterval = ref<number | null>(null);

// Profile update interval (for periodic user preference extraction)
const profileUpdateInterval = ref<number | null>(null);

// Unified 4 needs configuration
const needConfig = computed(() => [
  { key: 'energy' as const, label: '⚡ 能量' },
  { key: 'play' as const, label: '🎾 玩耍' },
  { key: 'love' as const, label: '❤️ 爱意' },
  { key: 'knowledge' as const, label: '📚 知识' },
]);

// Help modal state
const helpModalNeed = ref<string | null>(null);
const isHelpModalOpen = ref(false);

// Need satisfaction notification
interface NeedSatisfaction {
  text: string;
  needLabel: string;
  increase: number;
  timestamp: number;
}

const needSatisfactionNotification = ref<NeedSatisfaction | null>(null);


// Action handler for interactive tags
function handleAction(action: 'energy' | 'play' | 'love' | 'learn') {
  let statKey: string = '';
  let increase: number = 0;

  switch (action) {
    case 'energy':
      petKingdomStore.restoreEnergy();
      statKey = 'energy';
      increase = 100;
      break;
    case 'play':
      petKingdomStore.playWithPet();
      statKey = 'play';
      increase = 100;
      break;
    case 'love':
      petKingdomStore.showAffection();
      statKey = 'love';
      increase = 100;
      break;
    case 'learn':
      petKingdomStore.learnTopic('General knowledge');
      statKey = 'knowledge';
      increase = 15;
      break;
  }

  // Show floating text
  if (statKey) {
    showFloatChange(statKey, increase);
  }

  // Record to memory
  memoryStore.recordNeedSatisfied('default', action as any, true);
}

// Process need satisfaction and update pet state
async function processNeedSatisfaction(detected: ReturnType<typeof petKingdomStore.detectNeedSatisfaction>) {
  if (!detected) return;

  const increase = await petKingdomStore.processNeedSatisfaction('default', detected.need, 'conversation');

  const needLabels: Record<string, string> = {
    energy: 'Energy',
    play: 'Play',
    love: 'Love',
    learn: 'Knowledge',
  };

  needSatisfactionNotification.value = {
    text: `You satisfied ${needLabels[detected.need]} need!`,
    needLabel: needLabels[detected.need],
    increase,
    timestamp: Date.now(),
  };

  // Auto-hide notification after 3 seconds
  setTimeout(() => {
    needSatisfactionNotification.value = null;
  }, 3000);
}

// Close need satisfaction notification
function closeNeedSatisfactionNotification() {
  needSatisfactionNotification.value = null;
}

const visibleMessages = computed(() => {
  const history = petStore.chatHistory;
  const max = props.maxHistory || 50;
  return history.slice(-max);
});

// Load conversation history when component mounts
onMounted(async () => {
  await petStore.loadFromDB();
  await userStore.loadFromDB('default');
});

// Send full conversation history with context to AI
async function sendMessage() {
  if (!input.value.trim() || loading.value) return;

  // Get input value before clearing
  const messageContent = input.value;

  // Add user message to chat history immediately
  petStore.addChatMessageImmediately(messageContent);

  // Clear input immediately
  input.value = '';

  // Build full conversation history for AI
  // Include last 20 messages for context (AI handles context window)
  const conversationHistory = petStore.chatHistory.slice(-20);

  // Build messages array with conversation history
  const messages = conversationHistory.map((msg: any) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Get context for system prompt
  // Combine pet stats from both stores for complete context
  const context = {
    petStatus: {
      name: petStatus.value.name,
      level: level.value,
      friendship: petStatus.value.friendship,
      love: petStatus.value.love,
      chat: petStatus.value.chat,
      knowledge: petStatus.value.knowledge,
    },
    petStats: {
      happiness: petStatus.value.happiness,
      hunger: petStatus.value.hunger,
      health: petStatus.value.health,
      energy: petStatus.value.energy,
      sleep: petStatus.value.sleep,
      play: petStatus.value.play,
    },
    personalityProfile: memoryStore.getPersonalityProfile('default'),
    userInterests: memoryStore.userInterests,
    userProfile: userStore.profile,
    // Emotion context for LLM
    currentEmotion: petStatus.value.currentEmotion,
    emotionPrompt: petStatus.value.currentEmotion ? EMOTION_MAP[petStatus.value.currentEmotion as keyof typeof EMOTION_MAP]?.prompt || '' : '',
  };

  // Call AI to get response with full context
  petStore.chatWithAI(messages, context, (userContent, assistantContent) => {
    // Save conversation to memory system
    memoryStore.addMemory(
      'conversation' as const,
      `Chat: ${userContent.substring(0, 30)}${userContent.length > 30 ? '...' : ''}`,
      `User: ${userContent}\nPet: ${assistantContent}`,
      { userContent, assistantContent, timestamp: new Date().toISOString() },
      8,
      ['chat', 'conversation']
    );
    // Extract personality from user's message
    memoryStore.extractPersonalityFromConversation('default', userContent, 'user');
    // Record user interests
    const interests = ['tech', 'science', 'art', 'music', 'sports', 'food'];
    interests.forEach(interest => {
      if (userContent.toLowerCase().includes(interest)) {
        memoryStore.recordUserInterest('default', interest, 'topic');
      }
    });
  }).catch((err) => {
    console.error('Chat error:', err);
    // Show error toast to user
    errorMessage.value = err.message || 'Failed to get response';
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorMessage.value = null;
    }, 5000);
  });

  // Check for need satisfaction patterns in user input using store's detection
  const detectedNeed = petKingdomStore.detectNeedSatisfaction(messageContent);
  if (detectedNeed) {
    processNeedSatisfaction(detectedNeed);
  }
}

function closeErrorToast() {
  errorMessage.value = null;
}

function openNeedHelp(needKey: string) {
  helpModalNeed.value = needKey;
  isHelpModalOpen.value = true;
}

function closeNeedHelp() {
  isHelpModalOpen.value = false;
  helpModalNeed.value = null;
}

function handleRequest() {
  petKingdomStore.requestNeedFulfillment();
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getAvatar(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

// Start knowledge sharing check interval when chat is open
onMounted(() => {
  // Start periodic knowledge sharing check (every 5 minutes while chat is open)
  knowledgeShareInterval.value = window.setInterval(() => {
    petKingdomStore.tryShareKnowledge();
  }, 5 * 60 * 1000); // Check every 5 minutes

  // Start periodic user profile update (every 10 minutes)
  profileUpdateInterval.value = window.setInterval(() => {
    updateUserProfileFromChat();
  }, 10 * 60 * 1000); // Check every 10 minutes
});

// Cleanup interval when component is unloaded
onUnmounted(() => {
  if (knowledgeShareInterval.value) {
    clearInterval(knowledgeShareInterval.value);
  }
  if (profileUpdateInterval.value) {
    clearInterval(profileUpdateInterval.value);
  }
});

watch(
  () => petStore.chatHistory,
  (newHistory, oldHistory) => {
    if (chatHistoryRef.value) {
      chatHistoryRef.value.scrollTop = chatHistoryRef.value.scrollHeight;
    }
  },
  { deep: true, immediate: true },
);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.chat-history {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-user {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 2px;
}

.message-assistant {
  align-self: flex-start;
  background: #f5f5f5;
  color: #333;
  border-bottom-left-radius: 2px;
}

.message-loading {
  align-self: center;
  background: transparent;
  color: #666;
}

.loading-dots {
  display: flex;
  gap: 4px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  background: #666;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.message-time {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #eee;
}

.chat-input textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: none;
  height: 40px;
  font-family: inherit;
}

.chat-input textarea:focus {
  outline: none;
  border-color: #1976D2;
}

.chat-input button {
  padding: 0 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.chat-input button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Pet Status Panel */
.pet-status-panel {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.pet-identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pet-avatar {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.pet-info h3 {
  margin: 0;
  font-size: 1.2rem;
  color: white;
}

.status-level {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.8);
}

.status-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Emotion Badge Styles */
.emotion-badge {
  font-size: 1.4rem;
  padding: 4px 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: all 0.3s ease;
}

.emotion-badge.excited {
  background: rgba(255, 193, 7, 0.3);
  animation: pulse 1s ease infinite;
}

.emotion-badge.melancholy {
  background: rgba(33, 150, 243, 0.3);
  animation: float 2s ease-in-out infinite;
}

.emotion-badge.anxious {
  background: rgba(244, 67, 54, 0.3);
  animation: shake 0.5s ease;
}

.emotion-badge.lazy {
  background: rgba(76, 175, 80, 0.3);
  opacity: 0.8;
}

.emotion-badge.neutral {
  background: rgba(255,255,255,0.2);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.friendship-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  background: rgba(255,255,255,0.2);
  color: white;
}

.friendship-badge.stranger {
  background: rgba(158, 158, 158, 0.5);
}

.friendship-badge.acquaintance {
  background: rgba(33, 150, 243, 0.6);
}

.friendship-badge.friend {
  background: rgba(76, 175, 80, 0.6);
}

.friendship-badge.bestfriend {
  background: rgba(233, 30, 99, 0.6);
}

/* Quick Stats Row */
.quick-stats-row {
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  margin-bottom: 12px;
  border-top: 1px solid rgba(255,255,255,0.2);
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.quick-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.quick-stat.urgent .stat-icon {
  animation: pulse 1s infinite;
}

.stat-icon {
  font-size: 1.3rem;
}

.stat-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
}

/* Friendship Progress Bar */
.friendship-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.9);
}

.progress-label {
  flex-shrink: 0;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Personality Traits */
.personality-traits {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 0.75rem;
  flex-wrap: wrap;
}

.trait-label {
  color: rgba(255,255,255,0.8);
}

.trait-tag {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

/* Pet Request */
.pet-request {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  margin-bottom: 12px;
}

.request-icon {
  font-size: 1.2rem;
}

.request-text {
  flex: 1;
  font-size: 0.9rem;
  color: white;
}

.request-btn {
  padding: 6px 12px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
}

.request-btn:hover {
  background: #f57c00;
}

/* Action Tags */
.action-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  color: white;
}

.action-tag:hover {
  background: rgba(255,255,255,0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.action-tag:active {
  transform: translateY(0);
  background: rgba(255,255,255,0.3);
}

.tag-icon {
  font-size: 1.1rem;
}

.tag-text {
  font-size: 0.8rem;
}

/* Error Toast Styles */
.error-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #f44336;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  animation: slideUp 0.3s ease-out;
}

.error-toast .error-icon {
  font-size: 18px;
}

.error-toast .error-text {
  flex: 1;
  font-size: 14px;
}

.error-toast .error-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: background 0.2s;
}

.error-toast .error-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Need Satisfaction Notification */
.need-satisfaction-notification {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #4caf50, #8bc34a);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  animation: slideDown 0.3s ease-out;
}

.need-satisfaction-notification .notification-icon {
  font-size: 20px;
}

.need-satisfaction-notification .notification-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.need-satisfaction-notification .notification-text {
  font-size: 14px;
  font-weight: 500;
}

.need-satisfaction-notification .notification-subtext {
  font-size: 12px;
  opacity: 0.9;
}

.need-satisfaction-notification .notification-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: background 0.2s;
}

.need-satisfaction-notification .notification-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>
