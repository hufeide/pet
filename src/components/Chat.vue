<template>
  <div class="chat-container">
    <!-- Pet Status Panel -->
    <div class="pet-status-panel" v-if="petStatus">
      <div class="status-header">
        <h3>{{ petStatus.name }}</h3>
        <span class="status-level">Level {{ level }}</span>
      </div>
      <div class="status-grid">
        <div class="status-item">
          <span class="status-label">❤️ Happiness</span>
          <div class="status-bar">
            <div class="status-fill" :style="{ width: petStatus.happiness + '%' }" :class="{ urgent: petStatus.happiness < 40 }" />
          </div>
        </div>
        <div class="status-item">
          <span class="status-label">🍗 Hunger</span>
          <div class="status-bar">
            <div class="status-fill" :style="{ width: petStatus.hunger + '%' }" :class="{ urgent: petStatus.hunger < 40 }" />
          </div>
        </div>
        <div class="status-item">
          <span class="status-label">❤️ Health</span>
          <div class="status-bar">
            <div class="status-fill" :style="{ width: petStatus.health + '%' }" :class="{ urgent: petStatus.health < 40 }" />
          </div>
        </div>
        <div class="status-item">
          <span class="status-label">⚡ Energy</span>
          <div class="status-bar">
            <div class="status-fill" :style="{ width: petStatus.energy + '%' }" :class="{ urgent: petStatus.energy < 40 }" />
          </div>
        </div>
      </div>
      <div class="needs-grid">
        <div class="need-item" v-for="need in needConfig" :key="need.key">
          <div class="need-header">
            <span class="need-label">{{ need.label }}</span>
            <span class="need-help" @click="openNeedHelp(need.key)">?</span>
          </div>
          <div class="need-bar">
            <div class="need-fill" :style="{ width: petStatus[need.key] + '%' }" :class="{ urgent: petStatus[need.key] < 40 }" />
          </div>
        </div>
      </div>
      <div v-if="petRequest" class="pet-request">
        <span class="request-icon">🐾</span>
        <span class="request-text">{{ petRequest }}</span>
        <button class="request-btn" @click="handleRequest">Help</button>
      </div>
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
        placeholder="Say something..."
        :disabled="loading"
      />
      <button
        @click="sendMessage"
        :disabled="loading || !input.trim()"
      >
        {{ loading ? '...' : 'Send' }}
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
import NeedHelpModal from './NeedHelpModal.vue';

const props = defineProps<{
  maxHistory?: number;
}>();

const emit = defineEmits<{
  (e: 'close-chat'): void;
}>();

const petStore = usePetStore();
const petKingdomStore = usePetKingdomStore();
const memoryStore = useMemoryStore();

const input = ref('');
const chatHistoryRef = ref<HTMLDivElement | null>(null);
const loading = computed(() => petStore.loading);
const errorMessage = ref<string | null>(null);

// Pet status from kingdom store
const petStatus = computed(() => petKingdomStore.petStatus);

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

// Knowledge sharing interval
const knowledgeShareInterval = ref<number | null>(null);

// Need configuration with help content
const needConfig = computed(() => [
  { key: 'happiness', label: '❤️ Happiness', reason: 'Neglect or loneliness causes happiness to decrease', actions: 'Petting your pet, playing games together' },
  { key: 'hunger', label: '🍗 Hunger', reason: 'Time passes and hunger naturally increases', actions: 'Feeding your pet regularly' },
  { key: 'health', label: '❤️ Health', reason: 'Poor care or illness causes health to decrease', actions: 'Providing proper care, giving medicine when needed' },
  { key: 'energy', label: '⚡ Energy', reason: 'Activity decreases energy, lack of sleep also affects it', actions: 'Resting, putting pet to sleep' },
  { key: 'sleep', label: '💤 Sleep', reason: 'Activity and lack of rest decreases sleep need', actions: 'Putting pet to bed, allowing rest' },
  { key: 'play', label: '⚽ Play', reason: 'No playtime causes play need to decrease', actions: 'Playing games, using toys' },
  { key: 'love', label: '💖 Love', reason: 'Neglect or lack of affection causes love to decrease', actions: 'Petting, showing affection' },
  { key: 'chat', label: '💬 Chat', reason: 'No conversation causes chat need to decrease', actions: 'Talking to your pet' },
  { key: 'knowledge', label: '📚 Knowledge', reason: 'No learning causes knowledge to decrease', actions: 'Learning new topics, reading' },
]);

// Help modal state
const helpModalNeed = ref<string | null>(null);
const isHelpModalOpen = ref(false);

const visibleMessages = computed(() => {
  const history = petStore.chatHistory;
  const max = props.maxHistory || 50;
  return history.slice(-max);
});

function sendMessage() {
  if (!input.value.trim() || loading.value) return;

  // Get input value before clearing
  const messageContent = input.value;

  // Add user message to chat history immediately
  petStore.addChatMessageImmediately(messageContent);

  // Clear input immediately
  input.value = '';

  // Call AI to get response
  const messages = [{ role: 'user' as const, content: messageContent }];
  petStore.chatWithAI(messages, (userContent, assistantContent) => {
    // Save conversation to memory system
    memoryStore.addMemory(
      'conversation' as const,
      `Chat: ${userContent.substring(0, 30)}${userContent.length > 30 ? '...' : ''}`,
      `User: ${userContent}\nPet: ${assistantContent}`,
      { userContent, assistantContent, timestamp: new Date().toISOString() },
      8,
      ['chat', 'conversation']
    );
  }).catch((err) => {
    console.error('Chat error:', err);
    // Show error toast to user
    errorMessage.value = err.message || 'Failed to get response';
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorMessage.value = null;
    }, 5000);
  });
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

// Start knowledge sharing check interval when chat is open
onMounted(() => {
  console.log('[Chat] onMounted - loading chat history');
  petStore.loadFromDB().then(() => {
    console.log('[Chat] Loaded history, messages count:', petStore.chatHistory.length);
  });

  // Start periodic knowledge sharing check (every 5 minutes while chat is open)
  knowledgeShareInterval.value = window.setInterval(() => {
    petKingdomStore.tryShareKnowledge();
  }, 5 * 60 * 1000); // Check every 5 minutes
});

// Cleanup interval when component is unloaded
onUnmounted(() => {
  if (knowledgeShareInterval.value) {
    clearInterval(knowledgeShareInterval.value);
  }
});

watch(
  () => petStore.chatHistory,
  (newHistory, oldHistory) => {
    console.log('[Chat] Chat history changed:', newHistory.length, 'messages');
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
  background: #1976D2;
  color: white;
  border-bottom-right-radius: 2px;
}

.message-assistant {
  align-self: flex-start;
  background: #E0E0E0;
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
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.chat-input button:hover:not(:disabled) {
  background: #1565C0;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Pet Status Panel */
.pet-status-panel {
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.status-level {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 0.85rem;
  color: #555;
}

.status-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  background: #4CAF50;
}

.status-fill.urgent {
  background: #F44336;
}

.needs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.need-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.need-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.need-label {
  flex: 1;
  font-size: 0.8rem;
  color: #666;
}

.need-help {
  width: 18px;
  height: 18px;
  background: #1976D2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}

.need-help:hover {
  background: #1565C0;
}

.need-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.need-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  background: #2196F3;
}

.need-fill.urgent {
  background: #FF9800;
}

.pet-request {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fff3e0;
  border-radius: 8px;
  border: 1px solid #ffe0b2;
}

.request-icon {
  font-size: 1.2rem;
}

.request-text {
  flex: 1;
  font-size: 0.9rem;
  color: #e65100;
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

/* Need Help Modal Styles */
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
