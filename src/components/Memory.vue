<template>
  <div class="memory-panel">
    <div class="panel-header">
      <h3>Memory System</h3>
      <div class="memory-stats">
        <span>Total: {{ totalMemories }}</span>
        <span>By Type: {{ JSON.stringify(memoriesByType) }}</span>
        <span>Avg Usefulness: {{ averageUsefulness.toFixed(1) }}</span>
      </div>
    </div>

    <div class="memories-list">
      <h4>All Memories ({{ totalMemories }})</h4>
      <div class="memories-grid">
        <div
          v-for="memory in memories.slice(-20).reverse()"
          :key="memory.id"
          class="memory-card"
          :class="'type-' + memory.type"
        >
          <div class="memory-type">{{ memory.type }}</div>
          <div class="memory-title">{{ memory.title }}</div>
          <div class="memory-content">{{ memory.content }}</div>
          <div class="memory-meta">
            <span class="memory-usefulness">Usefulness: {{ memory.usefulness }}/10</span>
            <span class="memory-date">{{ formatDate(memory.timestamp) }}</span>
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

const memoryStore = useMemoryStore();

const totalMemories = computed(() => memoryStore.totalMemories || 0);
const memoriesByType = computed(() => memoryStore.memoriesByType || {});
const averageUsefulness = computed(() => memoryStore.averageUsefulness || 0);
const memories = computed(() => memoryStore.memories || []);

const summary = computed(() => ({
  failureCount: memories.value.filter(m => m.type === 'failure').length,
  conversationCount: memories.value.filter(m => m.type === 'conversation').length,
  skillCount: memories.value.filter(m => m.type === 'skill').length,
  tipCount: memories.value.filter(m => m.type === 'tip').length,
}));

onMounted(() => {
  // Load memories from DB
  memoryStore.loadFromDB('default');
});

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}
</script>

<style scoped>
.memory-panel {
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.memory-stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.actions button {
  padding: 10px 16px;
  background: #9c27b0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.actions button:hover {
  background: #7b1fa2;
}

.diary-section, .experience-library {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.diary-section h4, .experience-library h4 {
  margin-bottom: 12px;
}

.diary-content {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  max-height: 300px;
  overflow-y: auto;
}

.library-content {
  display: flex;
  gap: 16px;
}

.library-section {
  flex: 1;
  min-width: 200px;
}

.library-section h5 {
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #666;
}

.library-section ul {
  margin: 0;
  padding-left: 20px;
  font-size: 0.85rem;
}

.library-section li {
  margin-bottom: 4px;
  color: #333;
}

.memories-list {
  margin-bottom: 24px;
}

.memories-list h4 {
  margin-bottom: 12px;
}

.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.memory-card {
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.type-failure { border-left: 3px solid #f44336; }
.type-conversation { border-left: 3px solid #2196f3; }
.type-skill { border-left: 3px solid #4caf50; }
.type-tip { border-left: 3px solid #ffeb3b; }

.memory-type {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 4px;
}

.memory-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.memory-content {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
}

.memory-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #999;
}

.summary-section {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
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
