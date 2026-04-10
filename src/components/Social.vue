<template>
  <div class="social-panel">
    <div class="panel-header">
      <h3>Social Game</h3>
      <div class="social-stats">
        <span>Scenario: {{ currentScenario?.title || 'None' }}</span>
        <span>Conversations: {{ conversationCount }}</span>
        <span>Skills: {{ skillCount }}</span>
        <span>Exp: {{ totalExperience }}</span>
      </div>
    </div>

    <div v-if="currentScenario" class="scenario-info">
      <h4>{{ currentScenario.title }}</h4>
      <p>{{ currentScenario.description }}</p>
      <div class="characters">
        <div
          v-for="character in activeCharacters"
          :key="character.id"
          class="character-card"
        >
          <div class="character-role">{{ character.role }}</div>
          <div class="character-name">{{ character.name }}</div>
          <div class="character-personality">{{ character.personality.join(', ') }}</div>
        </div>
      </div>
    </div>

    <div v-else class="scenario-select">
      <h4>Select Scenario</h4>
      <div class="scenarios">
        <div
          v-for="scenario in scenarios"
          :key="scenario.id"
          class="scenario-card"
          @click="startScenario(scenario.id)"
        >
          <div class="scenario-title">{{ scenario.title }}</div>
          <div class="scenario-difficulty">Difficulty: {{ scenario.difficulty }}</div>
        </div>
      </div>
    </div>

    <div v-if="activeCharacters.length > 0" class="interaction-area">
      <h4>Interact with Character</h4>
      <div class="character-select">
        <select v-model="selectedCharacterId">
          <option v-for="character in activeCharacters" :key="character.id" :value="character.id">
            {{ character.name }} ({{ character.role }})
          </option>
        </select>
      </div>

      <div class="question-display">
        <div v-if="currentQuestion" class="question">
          <strong>Question:</strong> {{ currentQuestion }}
        </div>
        <div v-else class="no-question">
          Select a character and wait for their question...
        </div>
      </div>

      <textarea
        v-model="userResponse"
        placeholder="Type your response..."
        @keyup.enter="sendResponse"
      />

      <button
        :disabled="!userResponse.trim() || isLoading"
        @click="sendResponse"
      >
        {{ isLoading ? 'Sending...' : 'Send Response' }}
      </button>

      <div v-if="lastResult" class="result-display">
        <div class="result-success" :class="lastResult.success ? 'success' : 'failed'">
          {{ lastResult.success ? '✓' : '✗' }} {{ lastResult.characterReaction }}
        </div>
        <div class="result-xp">
          Experience: +{{ lastResult.experience }}
        </div>
        <div v-if="lastResult.learnedTips.length > 0" class="result-tips">
          <strong>Learned tips:</strong>
          <ul>
            <li v-for="tip in lastResult.learnedTips" :key="tip">{{ tip }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="diary-section">
      <h4>Your Diary</h4>
      <button @click="generateDiary">Generate Diary</button>
      <div v-if="diaryText" class="diary-content">
        <pre>{{ diaryText }}</pre>
      </div>
    </div>

    <div class="learned-skills">
      <h4>Learned Skills ({{ skillCount }})</h4>
      <div class="skills-list">
        <span
          v-for="skill in learnedSkills"
          :key="skill"
          class="skill-tag"
        >
          {{ skill }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useSocialStore } from '../store/social';
import type { SocialScenario } from '../types/social';

const socialStore = useSocialStore();

const currentScenario = computed(() => socialStore.currentScenario || null);
const activeCharacters = computed(() => socialStore.activeCharacters || []);
const currentQuestions = computed(() => socialStore.currentQuestions || []);
const conversationCount = computed(() => socialStore.conversationCount || 0);
const skillCount = computed(() => socialStore.skillCount || 0);
const learnedSkills = computed(() => socialStore.learnedSkills || []);
const totalExperience = computed(() => socialStore.totalExperience || 0);
const isLoading = computed(() => socialStore.isLoading || false);

const selectedCharacterId = ref<string>('');
const userResponse = ref('');
const lastResult = ref<unknown | null>(null);
const diaryText = ref('');

const scenarios: SocialScenario[] = [
  {
    id: 'scenario_1',
    title: 'First Encounter',
    description: 'Simple interactions for beginners',
    characters: [],
    difficulty: 1,
    maxLevel: 3,
    experienceBase: 10,
  },
  {
    id: 'scenario_2',
    title: 'Social Gathering',
    description: 'Multiple characters to interact with',
    characters: [],
    difficulty: 3,
    maxLevel: 7,
    experienceBase: 20,
  },
  {
    id: 'scenario_3',
    title: 'Business Negotiation',
    description: 'Complex interactions with high stakes',
    characters: [],
    difficulty: 5,
    maxLevel: 10,
    experienceBase: 30,
  },
];

const currentQuestion = computed(() => {
  if (currentQuestions.value.length > 0) {
    return currentQuestions.value[0];
  }
  return null;
});

async function startScenario(scenarioId: string): Promise<void> {
  await socialStore.startScenario(scenarioId, 1); // Assuming level 1 for now
  if (activeCharacters.value.length > 0) {
    selectedCharacterId.value = activeCharacters.value[0].id;
  }
}

async function sendResponse(): Promise<void> {
  if (!selectedCharacterId.value || !userResponse.value.trim()) return;

  lastResult.value = null;

  try {
    const result = await socialStore.interact(selectedCharacterId.value, userResponse.value);
    lastResult.value = result;
    userResponse.value = '';
  } catch (err) {
    console.error('Interaction failed:', err);
    alert('Failed to send response. Check console for details.');
  }
}

function generateDiary(): void {
  const diary = socialStore.getDiary('daily');
  diaryText.value = diary;
}
</script>

<style scoped>
.social-panel {
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

.social-stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #666;
}

.scenario-select, .scenario-info {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.scenario-select h4, .scenario-info h4 {
  margin: 0 0 8px 0;
}

.scenario-info p {
  margin: 0;
  color: #666;
}

.scenarios, .characters {
  display: flex;
  gap: 12px;
}

.scenario-card, .character-card {
  padding: 16px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s;
}

.scenario-card:hover, .character-card:hover {
  border-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.scenario-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.scenario-difficulty {
  font-size: 0.85rem;
  color: #1976D2;
}

.character-role {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #666;
}

.character-name {
  font-weight: 600;
  margin: 4px 0;
}

.character-personality {
  font-size: 0.85rem;
  color: #888;
  font-style: italic;
}

.interaction-area {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.interaction-area h4 {
  margin-bottom: 12px;
}

.character-select select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 12px;
}

.question-display {
  margin-bottom: 12px;
  padding: 8px;
  background: #fff3e0;
  border-radius: 6px;
}

.question {
  font-style: italic;
  color: #333;
}

.no-question {
  color: #999;
  font-style: italic;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 8px;
}

button {
  padding: 10px 20px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover:not(:disabled) {
  background: #1565C0;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-display {
  margin-top: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.result-success {
  font-weight: 600;
  margin-bottom: 8px;
}

.result-success.success {
  color: #4caf50;
}

.result-success.failed {
  color: #f44336;
}

.result-xp {
  color: #ff9800;
  font-weight: 500;
}

.result-tips {
  margin-top: 8px;
  font-size: 0.85rem;
}

.result-tips ul {
  margin: 4px 0 0 20px;
  padding: 0;
}

.result-tips li {
  color: #666;
}

.diary-section, .learned-skills {
  margin-top: 16px;
}

.diary-section h4, .learned-skills h4 {
  margin-bottom: 8px;
}

.diary-content {
  margin-top: 8px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
}

.skills-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.skill-tag {
  padding: 6px 12px;
  background: #e3f2fd;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #1976D2;
}
</style>
