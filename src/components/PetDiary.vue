<template>
  <div class="pet-diary">
    <div class="diary-header">
      <h3>宠物日记</h3>
      <div class="diary-controls">
        <select v-model="selectedFilter" @change="filterDiaries">
          <option value="all">全部</option>
          <option value="today">今天</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索日记内容..."
          class="search-input"
        />
      </div>
    </div>

    <!-- Daily Diary Display -->
    <div v-if="showDiary" class="diary-content">
      <div class="diary-date">{{ diaryDate }}</div>
      <div v-html="formattedDiaryContent" class="diary-body"></div>
    </div>

    <!-- Memory Archive -->
    <div class="memory-archive">
      <div class="archive-header">
        <h4>记忆档案 ({{ totalMemories }})</h4>
        <div class="archive-filters">
          <select v-model="memoryTypeFilter" @change="filterMemories">
            <option value="all">全部类型</option>
            <option value="interaction">互动</option>
            <option value="need_satisfied">需求满足</option>
            <option value="conversation">对话</option>
            <option value="user_interest">兴趣</option>
            <option value="pet_state">状态</option>
            <option value="evolution">进化</option>
            <option value="knowledge_shared">知识分享</option>
            <option value="daily_diary">日记</option>
          </select>
        </div>
      </div>

      <div v-if="memories.length === 0" class="no-memories">
        暂无记忆记录
      </div>

      <div class="memories-list">
        <div
          v-for="memory in memories"
          :key="memory.id"
          class="memory-item"
          :class="`type-${memory.type}`"
        >
          <div class="memory-header">
            <span class="memory-type">{{ memoryTypeLabel(memory.type) }}</span>
            <span class="memory-date">{{ formatDate(memory.timestamp) }}</span>
          </div>
          <div class="memory-title">{{ memory.title }}</div>
          <div class="memory-content">{{ memory.content }}</div>
          <div class="memory-tags">
            <span
              v-for="tag in memory.tags"
              :key="tag"
              class="tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="prev-btn"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="next-btn"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMemoryStore } from '../store/memory';
import type { PetMemoryType } from '../store/memory';

const memoryStore = useMemoryStore();

const showDiary = ref(true);
const selectedFilter = ref('all');
const searchQuery = ref('');
const memoryTypeFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 20;

// Type alias for memory records
interface MemoryRecord {
  id: string;
  petId: string;
  type: PetMemoryType;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  usefulness: number;
  tags: string[];
}

// Computed
const totalMemories = computed(() => memoryStore.memories.length);

const currentDiary = computed(() => {
  const diaries = memoryStore.memories.filter(m => m.type === 'daily_diary');
  return diaries.length > 0 ? diaries[0] : null;
});

const diaryDate = computed(() => {
  if (!currentDiary.value) return '今天';
  try {
    const date = new Date(currentDiary.value.timestamp);
    return date.toLocaleDateString('zh-CN');
  } catch {
    return '今天';
  }
});

const formattedDiaryContent = computed(() => {
  if (!currentDiary.value) return '';
  return currentDiary.value.content
    .replace(/#\s+(.*)/g, '<h4>$1</h4>')
    .replace(/##\s+(.*)/g, '<h5>$1</h5>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/-/g, '<br>&bull;');
});

const filteredDiaries = computed(() => {
  let diaries = memoryStore.memories.filter(m => m.type === 'daily_diary');

  if (selectedFilter.value === 'today') {
    const today = new Date().toISOString().split('T')[0];
    diaries = diaries.filter(m => m.timestamp.startsWith(today));
  } else if (selectedFilter.value === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    diaries = diaries.filter(m => new Date(m.timestamp) >= weekAgo);
  } else if (selectedFilter.value === 'month') {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    diaries = diaries.filter(m => new Date(m.timestamp) >= monthAgo);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    diaries = diaries.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    );
  }

  return diaries;
});

const memories = computed(() => {
  let items = memoryStore.memories;

  if (memoryTypeFilter.value !== 'all') {
    items = items.filter(m => m.type === memoryTypeFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    );
  }

  return items;
});

const totalPages = computed(() => Math.ceil(memories.value.length / itemsPerPage));

const paginatedMemories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return memories.value.slice(start, end);
});

// Actions
function filterDiaries() {
  // Filter diaries based on selected date range
}

function filterMemories() {
  // Filter memories based on selected type
}

function memoryTypeLabel(type: PetMemoryType | string): string {
  const labels: Record<string, string> = {
    interaction: '互动',
    need_satisfied: '需求满足',
    conversation: '对话',
    user_interest: '兴趣',
    pet_state: '状态',
    evolution: '进化',
    knowledge_shared: '知识分享',
    daily_diary: '日记',
    failure: '失败',
    skill: '技能',
    tip: '提示',
    event: '事件',
    quest: '任务',
  };
  return labels[type] || type;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(() => {
  memoryStore.loadFromDB('default');
});
</script>

<style scoped>
.pet-diary {
  padding: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.diary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.diary-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.diary-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.diary-controls select,
.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.search-input {
  min-width: 200px;
}

/* Diary Content */
.diary-content {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.diary-date {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1976D2;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e3f2fd;
}

.diary-body {
  line-height: 1.6;
  color: #333;
}

.diary-body h4 {
  margin: 16px 0 8px 0;
  font-size: 1.1rem;
  color: #1976D2;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.diary-body h5 {
  margin: 12px 0 6px 0;
  font-size: 1rem;
  color: #333;
}

.diary-body strong {
  color: #1976D2;
}

.diary-body br {
  margin-bottom: 8px;
}

/* Memory Archive */
.memory-archive {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.archive-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.archive-filters select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
}

/* Memory Items */
.no-memories {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 0.9rem;
}

.memories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-item {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #1976D2;
  transition: all 0.2s;
}

.memory-item:hover {
  background: #f0f0f0;
  border-left-color: #1565c0;
}

.memory-item.type-daily_diary {
  border-left-color: #4caf50;
}

.memory-item.type-evolution {
  border-left-color: #ff9800;
}

.memory-item.type-knowledge_shared {
  border-left-color: #2196f3;
}

.memory-item.type-conversation {
  border-left-color: #9c27b0;
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.memory-type {
  display: inline-block;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976D2;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.memory-date {
  color: #999;
  font-size: 0.8rem;
}

.memory-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.memory-content {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 8px;
}

.memory-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f5f5f5;
  color: #666;
  border-radius: 3px;
  font-size: 0.7rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.pagination button {
  padding: 8px 16px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #1565c0;
}

.pagination button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.85rem;
}
</style>
