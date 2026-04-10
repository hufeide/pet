<template>
  <div class="memory-archive">
    <div class="archive-header">
      <h3>记忆档案</h3>
      <div class="archive-stats">
        <span class="stat-item">
          <span class="stat-value">{{ totalMemories }}</span>
          <span class="stat-label">总记录</span>
        </span>
        <span class="stat-item" v-if="diaryCount > 0">
          <span class="stat-value">{{ diaryCount }}</span>
          <span class="stat-label">日记</span>
        </span>
        <span class="stat-item">
          <span class="stat-value">{{ averageUsefulness.toFixed(1) }}</span>
          <span class="stat-label">平均价值</span>
        </span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>类型：</label>
        <select v-model="selectedType" @change="filterAndPaginate">
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

      <div class="filter-group">
        <label>标签：</label>
        <select v-model="selectedTag" @change="filterAndPaginate">
          <option value="all">全部标签</option>
          <option v-for="tag in allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>

      <div class="filter-group search-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索内容..."
        />
      </div>
    </div>

    <!-- Tags Cloud -->
    <div class="tags-cloud">
      <h4>热门标签</h4>
      <div class="tags-list">
        <span
          v-for="tag in mostCommonTags"
          :key="tag.tag"
          class="tag-item"
          :class="{ active: selectedTag === tag.tag }"
          @click="selectedTag = tag.tag; filterAndPaginate()"
        >
          {{ tag.tag }} ({{ tag.count }})
        </span>
      </div>
    </div>

    <!-- Memory List -->
    <div v-if="filteredMemories.length === 0" class="no-results">
      <div class="no-results-icon">🔍</div>
      <div class="no-results-text">没有找到匹配的记忆</div>
      <button @click="resetFilters" class="reset-btn">重置筛选</button>
    </div>

    <div class="memories-grid">
      <div
        v-for="memory in paginatedMemories"
        :key="memory.id"
        class="memory-card"
        :class="getCardClass(memory.type)"
        @click="showMemoryDetails(memory)"
      >
        <div class="memory-card-header">
          <span class="memory-type-badge">{{ memoryTypeLabel(memory.type) }}</span>
          <span class="memory-date">{{ formatDate(memory.timestamp) }}</span>
        </div>
        <div class="memory-title">{{ memory.title }}</div>
        <div class="memory-content-preview">{{ memory.content }}</div>
        <div class="memory-card-footer">
          <span class="memory-usefulness" title="自我评估价值">
            ⭐ {{ memory.usefulness }}/10
          </span>
          <div class="memory-tags">
            <span
              v-for="tag in memory.tags.slice(0, 3)"
              :key="tag"
              class="memory-tag"
            >
              {{ tag }}
            </span>
            <span
              v-if="memory.tags.length > 3"
              class="memory-tag more"
            >
              +{{ memory.tags.length - 3 }}
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
        ← 上一页
      </button>
      <div class="page-indicator">
        <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
        <span class="page-info">共 {{ filteredMemories.length }} 条记录</span>
      </div>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="next-btn"
      >
        下一页 →
      </button>
    </div>

    <!-- Memory Details Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ selectedMemory?.title }}</h4>
          <button class="close-btn" @click="showModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="modal-meta">
            <span class="modal-type">{{ memoryTypeLabel(selectedMemory?.type as string | undefined) }}</span>
            <span class="modal-date">{{ formatDate(selectedMemory?.timestamp as string | undefined) }}</span>
          </div>
          <div class="modal-content-full">{{ selectedMemory?.content }}</div>
          <div class="modal-tags">
            <span
              v-for="tag in selectedMemory?.tags as string[] | undefined"
              :key="tag"
              class="modal-tag"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="close-modal-btn">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMemoryStore } from '../store/memory';

const memoryStore = useMemoryStore();

// State
const selectedType = ref('all');
const selectedTag = ref('all');
const searchQuery = ref('');
const currentPage = ref(1);
const showModal = ref(false);
const selectedMemory = ref<Record<string, unknown> | null>(null);

// Type alias for convenience
type MemoryRecord = Record<string, unknown>;

// Constants
const itemsPerPage = 20;

// Computed
const totalMemories = computed(() => memoryStore.memories.length);

const diaryCount = computed(() =>
  memoryStore.memories.filter(m => m.type === 'daily_diary').length
);

const averageUsefulness = computed(() => {
  if (memoryStore.memories.length === 0) return 0;
  const total = memoryStore.memories.reduce((sum, m) => sum + m.usefulness, 0);
  return total / memoryStore.memories.length;
});

const allTags = computed(() => {
  const tags: Record<string, number> = {};
  memoryStore.memories.forEach(m => {
    m.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });
  return Object.keys(tags).sort((a, b) => b.localeCompare(a));
});

const mostCommonTags = computed(() => {
  const tags: Record<string, number> = {};
  memoryStore.memories.forEach(m => {
    m.tags.forEach(tag => {
      tags[tag] = (tags[tag] || 0) + 1;
    });
  });
  return Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
});

const filteredMemories = computed(() => {
  let result = memoryStore.memories;

  // Filter by type
  if (selectedType.value !== 'all') {
    result = result.filter(m => m.type === selectedType.value);
  }

  // Filter by tag
  if (selectedTag.value !== 'all') {
    result = result.filter(m => m.tags.includes(selectedTag.value));
  }

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(m =>
      m.title.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    );
  }

  return result;
});

const totalPages = computed(() =>
  Math.ceil(filteredMemories.value.length / itemsPerPage)
);

const paginatedMemories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredMemories.value.slice(start, end);
});

// Actions
function filterAndPaginate() {
  currentPage.value = 1;
}

function resetFilters() {
  selectedType.value = 'all';
  selectedTag.value = 'all';
  searchQuery.value = '';
  currentPage.value = 1;
}

function showMemoryDetails(memory: MemoryRecord) {
  selectedMemory.value = memory;
  showModal.value = true;
}

function memoryTypeLabel(type: string | undefined): string {
  if (!type) return '';
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

function getCardClass(type: string | undefined): string {
  if (!type) return 'default';
  const classes: Record<string, string> = {
    daily_diary: 'diary',
    evolution: 'evolution',
    knowledge_shared: 'knowledge',
    conversation: 'conversation',
    need_satisfied: 'need',
    interaction: 'interaction',
  };
  return classes[type] || 'default';
}

function formatDate(timestamp: string | undefined): string {
  if (!timestamp) return '';
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
.memory-archive {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #eee;
}

.archive-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

/* Stats */
.archive-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976D2;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

/* Filter Bar */
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
}

.filter-group select,
.search-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 150px;
}

.search-group input {
  min-width: 200px;
}

/* Tags Cloud */
.tags-cloud {
  margin-bottom: 24px;
  padding: 16px;
  background: #e3f2fd;
  border-radius: 8px;
}

.tags-cloud h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #1976D2;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  padding: 6px 12px;
  background: white;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #1976D2;
  color: #1976D2;
}

.tag-item:hover {
  background: #1976D2;
  color: white;
}

.tag-item.active {
  background: #1976D2;
  color: white;
}

/* Memory Grid */
.memories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.memory-card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.memory-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-color: #1976D2;
}

.memory-card.diary { border-left: 4px solid #4caf50; }
.memory-card.evolution { border-left: 4px solid #ff9800; }
.memory-card.knowledge { border-left: 4px solid #2196f3; }
.memory-card.conversation { border-left: 4px solid #9c27b0; }
.memory-card.need { border-left: 4px solid #ff5722; }
.memory-card.interaction { border-left: 4px solid #3f51b5; }

.memory-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.memory-type-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976D2;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.memory-date {
  font-size: 0.75rem;
  color: #999;
}

.memory-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95rem;
  line-height: 1.4;
}

.memory-content-preview {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.memory-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.memory-usefulness {
  font-size: 0.8rem;
  color: #ff9800;
}

.memory-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.memory-tag {
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
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
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

.page-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-info {
  font-size: 0.75rem;
  color: #666;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 60px 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.no-results-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #ccc;
}

.no-results-text {
  font-size: 1rem;
  color: #666;
  margin-bottom: 16px;
}

.reset-btn {
  padding: 10px 20px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 0.8rem;
}

.modal-type {
  padding: 2px 8px;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1976D2;
  font-weight: 500;
}

.modal-date {
  color: #999;
}

.modal-content-full {
  white-space: pre-wrap;
  line-height: 1.6;
  color: #333;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-tag {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #666;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

.close-modal-btn {
  padding: 8px 20px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>
