<template>
  <div class="memory-panel">
    <!-- Pet Status Panel - Unified 4 Need Stats -->
    <div class="pet-status-panel">
      <div class="status-header">
        <div class="pet-identity">
          <div class="pet-avatar-small">{{ getAvatar(petStatus.name) }}</div>
          <div class="pet-info">
            <h3>{{ petStatus.name }}</h3>
            <span class="status-level">Level {{ petStatus.level }}</span>
          </div>
        </div>
        <div class="status-meta">
          <span class="friendship-badge" :class="friendshipLevel">
            {{ friendshipLevelLabel }}
          </span>
        </div>
      </div>

      <!-- Four Core Needs -->
      <div class="needs-grid">
        <div class="need-item" :class="{ urgent: petStatus.energy < 40 }">
          <div class="need-label">⚡ 能量</div>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.energy + '%' }"></div>
          </div>
        </div>
        <div class="need-item" :class="{ urgent: petStatus.play < 40 }">
          <div class="need-label">🎾 玩耍</div>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.play + '%' }"></div>
          </div>
        </div>
        <div class="need-item" :class="{ urgent: petStatus.love < 40 }">
          <div class="need-label">❤️ 爱意</div>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.love + '%' }"></div>
          </div>
        </div>
        <div class="need-item" :class="{ urgent: petStatus.knowledge < 40 }">
          <div class="need-label">📚 知识</div>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.knowledge + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-header">
      <h3>Memory System</h3>
    </div>

    <div class="memories-container">
      <div
        v-for="date in dateGroups"
        :key="date"
        class="date-group"
        :class="{ expanded: !isCollapsed(date) }"
      >
        <div class="date-header" @click="toggleDate(date)">
          <span class="date-label">{{ formatDateLabel(date) }}</span>
          <span class="date-toggle">{{ isCollapsed(date) ? '展开' : '收起' }}</span>
        </div>

        <div v-if="!isCollapsed(date)" class="date-content">
          <!-- Daily Summary -->
          <div v-if="groupedMemories[date].summary" class="daily-summary-card">
            <div class="summary-badge">今日重点</div>
            <div class="summary-text">{{ groupedMemories[date].summary.content }}</div>
          </div>

          <!-- Tabs for Chat and Share -->
          <div class="tabs-container" v-if="groupedMemories[date].chat.length > 0 || groupedMemories[date].share.length > 0 || groupedMemories[date].others.length > 0">
            <div class="tabs-header">
              <button
                class="tab-button"
                :class="{ active: activeTab(date) === 'chat' }"
                @click="setActiveTab(date, 'chat')"
                :disabled="groupedMemories[date].chat.length === 0"
              >
                💬 互动记录 ({{ groupedMemories[date].chat.length }})
              </button>
              <button
                class="tab-button"
                :class="{ active: activeTab(date) === 'share' }"
                @click="setActiveTab(date, 'share')"
                :disabled="groupedMemories[date].share.length === 0"
              >
                🌟 知识分享 ({{ groupedMemories[date].share.length }})
              </button>
              <button
                class="tab-button"
                :class="{ active: activeTab(date) === 'others' }"
                @click="setActiveTab(date, 'others')"
                :disabled="groupedMemories[date].others.length === 0"
              >
                📦 其他 ({{ groupedMemories[date].others.length }})
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content" :class="{ collapsed: isCategoryCollapsed(date, activeTab(date)) }">
              <!-- Chat Tab -->
              <div v-if="activeTab(date) === 'chat' && groupedMemories[date].chat.length" class="memory-list">
                <div
                  v-for="memory in groupedMemories[date].chat"
                  :key="memory.id"
                  class="memory-card type-conversation"
                >
                  <div class="memory-title">{{ memory.title }}</div>
                  <div class="memory-content">{{ memory.content }}</div>
                  <div class="memory-meta">
                    <span>{{ formatDate(memory.timestamp) }}</span>
                  </div>
                </div>
              </div>

              <!-- Share Tab -->
              <div v-if="activeTab(date) === 'share' && groupedMemories[date].share.length" class="memory-list">
                <div
                  v-for="memory in groupedMemories[date].share"
                  :key="memory.id"
                  class="memory-card type-share"
                >
                  <div class="memory-title">{{ memory.title }}</div>
                  <div class="memory-content">{{ memory.content }}</div>
                  <div class="memory-meta">
                    <span>{{ formatDate(memory.timestamp) }}</span>
                  </div>
                </div>
              </div>

              <!-- Others Tab -->
              <div v-if="activeTab(date) === 'others' && groupedMemories[date].others.length" class="memory-list">
                <div
                  v-for="memory in groupedMemories[date].others"
                  :key="memory.id"
                  class="memory-card"
                >
                  <div class="memory-title">{{ memory.title }}</div>
                  <div class="memory-content">{{ memory.content }}</div>
                  <div class="memory-meta">
                    <span>{{ formatDate(memory.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Collapse button for content -->
            <button
              v-if="groupedMemories[date][activeTab(date)]?.length > 0"
              class="collapse-content-btn"
              @click.stop="toggleCategory(date, activeTab(date))"
            >
              {{ isCategoryCollapsed(date, activeTab(date)) ? '展开内容 ▸' : '收起内容 ▾' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <h4>Memory Summary</h4>
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">Failures</span>
          <span class="stat-value">{{ summary.failureCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Conversations</span>
          <span class="stat-value">{{ summary.conversationCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Skills</span>
          <span class="stat-value">{{ summary.skillCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Tips</span>
          <span class="stat-value">{{ summary.tipCount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMemoryStore } from '../store/memory';
import { usePetKingdomStore } from '../store/pet-kingdom';

const memoryStore = useMemoryStore();
const petKingdomStore = usePetKingdomStore();

// Pet status from pet-kingdom store (unified 4 needs)
const petStatus = computed(() => petKingdomStore.petStatus);

// Friendship level
const friendshipLevel = computed(() => memoryStore.friendshipLevel);
const friendshipLevelLabel = computed(() => {
  const labels: Record<string, string> = {
    stranger: '陌生人',
    acquaintance: '熟人',
    friend: '好友',
    bestFriend: '最佳好友',
  };
  return labels[friendshipLevel.value] || '陌生人';
});

// Memory data
const dateGroups = computed(() => memoryStore.dateGroups || []);
const groupedMemories = computed(() => memoryStore.groupedMemories || {});

const collapsedDates = ref<Set<string>>(new Set());
const activeTabs = ref<Map<string, 'chat' | 'share' | 'others'>>(new Map());
const collapsedCategories = ref<Set<string>>(new Set());

const initCollapsedStates = () => {
  const today = new Date().toISOString().split('T')[0];
  dateGroups.value.forEach(date => {
    if (date !== today) {
      collapsedDates.value.add(date);
    }
    // Default to chat tab
    activeTabs.value.set(date, 'chat');
  });
};

const isCollapsed = (date: string) => collapsedDates.value.has(date);
const toggleDate = (date: string) => {
  if (collapsedDates.value.has(date)) {
    collapsedDates.value.delete(date);
  } else {
    collapsedDates.value.add(date);
  }
};

const activeTab = (date: string) => {
  return activeTabs.value.get(date) || 'chat';
};

const setActiveTab = (date: string, tab: 'chat' | 'share' | 'others') => {
  activeTabs.value.set(date, tab);
};

const isCategoryCollapsed = (date: string, tab: string) => {
  return collapsedCategories.value.has(`${date}-${tab}`);
};

const toggleCategory = (date: string, tab: string) => {
  const key = `${date}-${tab}`;
  if (collapsedCategories.value.has(key)) {
    collapsedCategories.value.delete(key);
  } else {
    collapsedCategories.value.add(key);
  }
};

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return '今天';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨天';

  return date.toLocaleDateString();
}

const summary = computed(() => ({
  failureCount: memoryStore.memories.filter(m => m.type === 'failure').length,
  conversationCount: memoryStore.memories.filter(m => m.type === 'conversation').length,
  skillCount: memoryStore.memories.filter(m => m.type === 'skill').length,
  tipCount: memoryStore.memories.filter(m => m.type === 'tip').length,
}));

onMounted(() => {
  memoryStore.loadFromDB('default');
  // Wait for data to load before initializing collapsed states
  setTimeout(() => {
    initCollapsedStates();
  }, 100);
});

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getAvatar(name: string): string {
  return name.substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.memory-panel {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

/* Pet Status Panel - Unified 4 Needs */
.pet-status-panel {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 16px;
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

.pet-avatar-small {
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
}

.pet-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: white;
}

.status-level {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.8);
}

.status-meta {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* Four Core Needs Grid */
.needs-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.need-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.need-label {
  width: 70px;
  font-size: 0.85rem;
  color: white;
  font-weight: 500;
}

.progress-bg {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.need-item.urgent .progress-fill {
  background: linear-gradient(90deg, #f44336, #ff5722);
  animation: pulse-urgent 1s infinite;
}

@keyframes pulse-urgent {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.memories-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.date-group {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.date-group.expanded {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.date-header {
  padding: 10px 16px;
  background: #f8f9fa;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  user-select: none;
}

.date-header:hover {
  background: #f0f2f5;
}

.date-label {
  color: #333;
  font-size: 0.9rem;
}

.date-toggle {
  font-size: 0.75rem;
  color: #999;
}

.date-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.daily-summary-card {
  padding: 12px;
  background: #fff9c4;
  border-left: 4px solid #fbc02d;
  border-radius: 4px;
}

.summary-badge {
  font-size: 0.7rem;
  font-weight: bold;
  color: #f57f17;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.summary-text {
  font-size: 0.85rem;
  color: #444;
  line-height: 1.5;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Tabs Container */
.tabs-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  gap: 0;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  padding: 10px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover:not(:disabled) {
  background: #e8e8e8;
  color: #333;
}

.tab-button.active {
  color: #1976D2;
  border-bottom-color: #1976D2;
  background: white;
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tab-content {
  padding: 12px;
  background: white;
  transition: all 0.3s ease;
}

.tab-content.collapsed {
  display: none;
}

.collapse-content-btn {
  width: 100%;
  padding: 8px;
  background: #f5f5f5;
  border: none;
  border-top: 1px solid #e0e0e0;
  cursor: pointer;
  font-size: 0.8rem;
  color: #666;
  transition: background 0.2s;
}

.collapse-content-btn:hover {
  background: #e8e8e8;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-card {
  padding: 10px;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: transform 0.1s;
}

.memory-card:hover {
  background: #fafafa;
}

.type-conversation { border-left: 3px solid #2196f3; }
.type-share { border-left: 3px solid #4caf50; }

.memory-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.memory-content {
  color: #666;
  margin-bottom: 6px;
  line-height: 1.4;
}

.memory-meta {
  display: flex;
  justify-content: flex-end;
  font-size: 0.7rem;
  color: #bbb;
}

.summary-section {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-top: 16px;
}

.summary-section h4 {
  margin-bottom: 12px;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976D2;
}
</style>
