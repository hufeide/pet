<template>
  <div class="pet-paradise">
    <!-- Section 1: Pet Status Panel (Collapsible) -->
    <div class="section pet-status-section">
      <div class="section-header" @click="togglePetStatus">
        <div class="section-title">
          <span class="pet-avatar-small">{{ getAvatar(petStatus.name) }}</span>
          <span>{{ petStatus.name }} - Lv.{{ petStatus.level }}</span>
        </div>
        <div class="section-actions">
          <span class="friendship-badge" :class="getFriendshipLevel()">
            {{ getFriendshipLabel() }}
          </span>
          <span class="toggle-icon">{{ showPetStatus ? '▼' : '▶' }}</span>
        </div>
      </div>

      <div v-if="showPetStatus" class="section-content">
        <!-- Four Core Needs (Unified 4 Needs) -->
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

        <!-- Action Buttons -->
        <div class="needs-actions">
          <button @click="restoreEnergy" class="action-btn energy-btn">⚡ 能量</button>
          <button @click="playWithPet" class="action-btn play-btn">🎾 玩耍</button>
          <button @click="showAffection" class="action-btn love-btn">❤️ 爱意</button>
          <button @click="learnTopic" class="action-btn learn-btn">📚 学习</button>
          <button @click="chatWithPet" class="action-btn chat-btn">💬 聊天</button>
        </div>

        <!-- Pet Request -->
        <div v-if="petRequest" class="pet-request">
          <span class="request-icon">🐾</span>
          <span class="request-text">{{ petRequest }}</span>
        </div>
      </div>
    </div>

    <!-- Section 2: Paradise Header & Quick Stats -->
    <div class="section paradise-header-section">
      <div class="paradise-header">
        <h3>🌸 宠物乐园</h3>
        <div class="paradise-stats">
          <span class="stat-chip">🌐 {{ playerCount }} 在线</span>
          <span class="stat-chip">💬 {{ interactionCount }} 互动</span>
          <span class="stat-chip">⚔️ {{ battleCount }} 战斗</span>
        </div>
      </div>
    </div>

    <!-- Section 3: Garden Scene (when in garden) -->
    <div v-if="currentLocation?.type === 'rest'" class="section garden-section">
      <div class="section-header">
        <h4>🌳 花园 - 休息和聊天</h4>
        <button @click="leaveGarden" class="leave-btn">离开</button>
      </div>

      <div class="garden-chat-area">
        <div class="garden-messages">
          <div
            v-for="msg in gardenChatHistory"
            :key="msg.id"
            class="chat-message"
            :class="msg.senderId === 'default' ? 'my-message' : 'other-message'"
          >
            <span class="sender">{{ msg.senderName }}:</span>
            <span class="text">{{ msg.content }}</span>
          </div>
          <div v-if="gardenChatHistory.length === 0" class="no-messages">
            🌿 花园里很安静，去打招呼开始聊天吧！
          </div>
        </div>
        <div class="garden-input">
          <input
            v-model="gardenMessage"
            @keyup.enter="sendGardenMessage"
            placeholder="输入消息..."
          />
          <button @click="sendGardenMessage">发送</button>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
      </div>

      <!-- Garden Players -->
      <div class="garden-players">
        <h4>花园里的宠物</h4>
        <div class="players-grid">
          <div
            v-for="player in gardenPlayers"
            :key="player.playerId"
            class="garden-player"
            :class="{ selected: selectedPlayerId === player.playerId }"
            @click="selectPlayer(player)"
          >
            <div class="player-avatar">{{ getAvatar(player.name) }}</div>
            <div class="player-name">{{ player.name }}</div>
            <div class="player-level">Lv.{{ player.level }}</div>
            <div class="player-actions" v-if="player.playerId !== 'default' && player.playerId === selectedPlayerId">
              <button @click.stop="greetPlayer(player.playerId)" class="action-small greet">打招呼</button>
              <button @click.stop="challengeBattle(player.playerId)" class="action-small battle">挑战</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Paradise Map -->
    <div class="section map-section">
      <div class="section-header">
        <h4>🗺️ 乐园地图</h4>
      </div>
      <div class="paradise-map">
        <div class="map-grid">
          <div
            v-for="location in locations"
            :key="location.id"
            class="map-location"
            :class="['location-' + location.type, { active: currentLocation?.id === location.id }]"
            :style="{ left: location.x + '%', top: location.y + '%', transform: 'translate(-50%, -50%)' }"
            @click="setLocation(location.id)"
          >
            <div class="location-icon">
              <span v-if="location.type === 'meeting'">🏛️</span>
              <span v-else-if="location.type === 'battle'">⚔️</span>
              <span v-else-if="location.type === 'trade'">🏪</span>
              <span v-else>🌳</span>
            </div>
            <div class="location-name">{{ location.name }}</div>
          </div>

          <!-- Online Players -->
          <div
            v-for="player in onlinePlayers"
            :key="player.playerId"
            class="online-player"
            :class="{ 'selected-player': player.playerId === selectedPlayerId, 'my-pet': player.playerId === 'default' }"
            :style="{ left: player.position.x + '%', top: player.position.y + '%', transform: 'translate(-50%, -50%)' }"
            @click="selectPlayer(player)"
          >
            <div class="player-avatar">{{ getAvatar(player.name) }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.name }}</div>
              <div class="player-level">Lv.{{ player.level }}</div>
            </div>
            <div class="player-actions" v-if="player.playerId !== 'default' && player.playerId === selectedPlayerId">
              <button @click.stop="greetPlayer(player.playerId)" class="action-small greet">打招呼</button>
              <button @click.stop="challengeBattle(player.playerId)" class="action-small battle">挑战</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 5: Location Cards -->
    <div class="section locations-section">
      <h4>📍 快速前往</h4>
      <div class="locations-list">
        <div
          v-for="location in locations"
          :key="location.id"
          class="location-card"
          :class="currentLocation?.id === location.id ? 'active' : ''"
          @click="setLocation(location.id)"
        >
          <div class="location-icon">{{ getIcon(location.type) }}</div>
          <div class="location-info">
            <div class="location-title">{{ location.name }}</div>
            <div class="location-desc">{{ location.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 6: Chat Area -->
    <div class="section chat-section">
      <h4>💬 聊天室</h4>
      <div class="chat-messages">
        <div
          v-for="msg in chatHistory"
          :key="msg.id"
          class="chat-message"
          :class="msg.isSystem ? 'system' : 'user'"
        >
          <div v-if="msg.isSystem" class="system-msg">{{ msg.content }}</div>
          <div v-else class="user-msg">
            <span class="sender">{{ msg.senderName }}:</span>
            <span class="text">{{ msg.content }}</span>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="chatMessage"
          @keyup.enter="sendMessage"
          placeholder="输入消息..."
        />
        <button @click="sendMessage">发送</button>
      </div>
    </div>

    <!-- Section 7: Interaction History -->
    <div class="section history-section">
      <h4>📜 互动记录 ({{ interactionCount }})</h4>
      <div class="history-list">
        <div
          v-for="interaction in interactionHistory.slice(-10).reverse()"
          :key="interaction.id"
          class="history-item"
        >
          <span class="interaction-type">{{ interaction.type }}</span>
          <span class="interaction-with">与 {{ interaction.withPlayerName }}</span>
          <span class="interaction-exp">+{{ interaction.experience }} XP</span>
        </div>
        <div v-if="interactionHistory.length === 0" class="no-history">
          还没有互动记录，快去和其他宠物打招呼吧！
        </div>
      </div>
    </div>

    <!-- Debug Info (Collapsible) -->
    <div class="debug-info">
      <details>
        <summary>🔧 调试信息</summary>
        <p>在线玩家数量: {{ onlinePlayers.length }}</p>
        <p>当前玩家列表:</p>
        <ul>
          <li v-for="player in onlinePlayers" :key="player.playerId">
            {{ player.name }} (Lv.{{ player.level }}) - 位置: ({{ player.position.x.toFixed(1) }}, {{ player.position.y.toFixed(1) }})
          </li>
        </ul>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { usePetKingdomStore } from '../store/pet-kingdom';
import { PARADISE_LOCATIONS } from '../store/pet-kingdom';
import { useMemoryStore } from '../store/memory';

const petKingdomStore = usePetKingdomStore();
const memoryStore = useMemoryStore();

const locations = computed(() => PARADISE_LOCATIONS);

const currentLocation = computed(() => petKingdomStore.currentLocation);
const onlinePlayers = computed(() => {
  const players = petKingdomStore.onlinePlayers;
  console.log('[PetParadise Component] onlinePlayers computed, count:', players.length);
  if (players.length > 0) {
    console.log('[PetParadise Component] Players:', players.map(p => ({ name: p.name, level: p.level, pos: p.position })));
  }
  return players;
});
const interactionHistory = computed(() => petKingdomStore.interactionHistory);
const chatHistory = computed(() => petKingdomStore.chatHistory);
const playerCount = computed(() => petKingdomStore.playerCount);
const interactionCount = computed(() => petKingdomStore.interactionCount);
const battleCount = computed(() => petKingdomStore.battleCount);
const error = computed(() => petKingdomStore.error);

const chatMessage = ref('');
const gardenMessage = ref('');

// Pet Status from store
const petStatus = computed(() => petKingdomStore.petStatus);
const petRequest = computed(() => petKingdomStore.petRequest);
const showPetStatus = ref(true);

// Toggle pet status panel
function togglePetStatus(): void {
  showPetStatus.value = !showPetStatus.value;
}

// Get friendship level class
function getFriendshipLevel(): string {
  const friendship = petStatus.value.friendship;
  if (friendship >= 90) return 'bestfriend';
  if (friendship >= 70) return 'friend';
  if (friendship >= 30) return 'acquaintance';
  return 'stranger';
}

// Get friendship level label
function getFriendshipLabel(): string {
  const friendship = petStatus.value.friendship;
  if (friendship >= 90) return '最佳好友';
  if (friendship >= 70) return '好友';
  if (friendship >= 30) return '熟人';
  return '陌生人';
}

// 花园相关计算属性
const gardenChatHistory = computed(() => petKingdomStore.gardenChatHistory);
const gardenPlayers = computed(() => {
  if (petKingdomStore.currentLocation?.type === 'rest') {
    return petKingdomStore.onlinePlayers;
  }
  return [];
});

const selectedPlayerId = ref<string | null>(null);

onMounted(() => {
  console.log('[PetParadise] Component mounted, calling loadPetKingdom');
  petKingdomStore.loadPetKingdom();
  memoryStore.loadFromDB('default');
  // Start the 10-minute interval checks
  petKingdomStore.startNeedChecks();
});

// Pet care actions
function restoreEnergy(): void {
  petKingdomStore.restoreEnergy();
  memoryStore.recordNeedSatisfied('default', 'energy', true);
}

function playWithPet(): void {
  petKingdomStore.playWithPet();
  memoryStore.recordNeedSatisfied('default', 'play', true);
}

function showAffection(): void {
  petKingdomStore.showAffection();
  memoryStore.recordNeedSatisfied('default', 'love', true);
}

function learnTopic(): void {
  petKingdomStore.learnTopic('General knowledge');
  memoryStore.recordNeedSatisfied('default', 'learn', true);
}

function chatWithPet(): void {
  petKingdomStore.chatWithPet('Hello!');
  memoryStore.recordNeedSatisfied('default', 'love', true);
}

function setLocation(locationId: string): void {
  petKingdomStore.setLocation(locationId);
  selectedPlayerId.value = null;
}

function leaveGarden(): void {
  // 离开花园时回到中心广场
  petKingdomStore.setLocation('center_square');
  gardenMessage.value = '';
}

function selectPlayer(player: { playerId: string; position: { x: number; y: number } }): void {
  if (selectedPlayerId.value === player.playerId) {
    selectedPlayerId.value = null;
  } else {
    selectedPlayerId.value = player.playerId;
  }
}

async function greetPlayer(playerId: string): Promise<void> {
  try {
    await petKingdomStore.greetPlayer(playerId);
  } catch (err) {
    console.error('[PetParadise] Greet failed:', err);
  }
  // 清除错误以便下次可以重试
  setTimeout(() => {
    petKingdomStore.error = null;
  }, 3000);
}

function interact(playerId: string, type: 'greet' | 'trade' | 'battle' | 'chat' | 'showoff'): void {
  petKingdomStore.interact(playerId, type);
}

function challengeBattle(playerId: string): void {
  petKingdomStore.challengeBattle(playerId);
}

function sendMessage(): void {
  if (chatMessage.value.trim()) {
    petKingdomStore.sendChatMessage(chatMessage.value);
    chatMessage.value = '';
  }
}

function sendGardenMessage(): void {
  if (gardenMessage.value.trim()) {
    petKingdomStore.sendGardenMessage(gardenMessage.value);
    gardenMessage.value = '';
  }
}

function getAvatar(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    meeting: '🏛️',
    battle: '⚔️',
    trade: '🏪',
    rest: '🌳',
  };
  return icons[type] || '📍';
}
</script>

<style scoped>
.pet-paradise {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

/* Section Base Styles */
.section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #333;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  font-size: 0.8rem;
  color: #666;
}

/* Pet Status Section */
.pet-status-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pet-status-section .section-header {
  border-bottom-color: rgba(255,255,255,0.2);
}

.pet-status-section .section-title {
  color: white;
}

.pet-avatar-small {
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.friendship-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.friendship-badge.stranger { background: rgba(255,255,255,0.2); }
.friendship-badge.acquaintance { background: #bbdefb; color: #1565c0; }
.friendship-badge.friend { background: #c8e6c9; color: #2e7d32; }
.friendship-badge.bestfriend { background: #f8bbd0; color: #c2185b; }

/* Quick Stats */
.quick-stats {
  display: flex;
  justify-content: space-around;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.quick-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.quick-stat.urgent .stat-icon {
  animation: pulse 1s infinite;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
}

/* Needs Grid */
.needs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.need-item {
  padding: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  transition: all 0.2s;
}

.need-item.urgent {
  background: rgba(255, 82, 82, 0.3);
  animation: urgentPulse 2s infinite;
}

.need-label {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.progress-bg {
  height: 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4caf50;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Action Buttons */
.needs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.action-btn.energy-btn { background: #ff9800; color: white; }
.action-btn.play-btn { background: #2196f3; color: white; }
.action-btn.love-btn { background: #f44336; color: white; }
.action-btn.learn-btn { background: #4caf50; color: white; }
.action-btn.chat-btn { background: #9c27b0; color: white; }

/* Pet Request */
.pet-request {
  padding: 10px 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.request-icon {
  font-size: 1.2rem;
}

.request-text {
  font-size: 0.9rem;
}

/* Paradise Header Section */
.paradise-header-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.paradise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.paradise-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.paradise-stats {
  display: flex;
  gap: 8px;
}

.stat-chip {
  padding: 4px 10px;
  background: white;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Garden Section */
.garden-section {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 2px solid #4caf50;
}

.garden-section .section-header {
  border-bottom-color: #a5d6a7;
}

.garden-section h4 {
  color: #2e7d32;
  margin: 0;
}

.leave-btn {
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.leave-btn:hover {
  background: #d32f2f;
}

.garden-chat-area {
  margin: 12px 0;
}

.garden-messages {
  height: 150px;
  overflow-y: auto;
  padding: 12px;
  background: white;
  border-radius: 8px;
  margin-bottom: 10px;
}

.no-messages {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px;
}

.garden-input {
  display: flex;
  gap: 8px;
}

.garden-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #a5d6a7;
  border-radius: 6px;
  font-size: 0.9rem;
}

.garden-input button {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.garden-players h4 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: #2e7d32;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.garden-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: white;
  border: 2px solid #a5d6a7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.garden-player:hover {
  border-color: #4caf50;
  background: #e8f5e9;
}

.garden-player.selected {
  border-color: #4caf50;
  background: #c8e6c9;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* Map Section */
.map-section h4 {
  margin: 0 0 12px 0;
}

.paradise-map {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.map-grid {
  position: relative;
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #e8f5e9 0%, #e3f2fd 50%, #fce4ec 100%);
  border-radius: 8px;
  overflow: visible;
}

.map-location {
  position: absolute;
  width: 56px;
  height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border: 3px solid #1976D2;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.map-location:hover {
  transform: translate(-50%, -50%) scale(1.15);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.map-location.active {
  background: #1976D2;
  color: white;
}

.location-icon {
  font-size: 1.3rem;
}

.location-name {
  font-size: 0.65rem;
  margin-top: 2px;
  text-align: center;
}

.location-meeting { border-color: #2196f3; }
.location-battle { border-color: #f44336; }
.location-trade { border-color: #ff9800; }
.location-rest { border-color: #4caf50; }

.online-player {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
  z-index: 10;
}

.online-player:hover {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 20;
}

.online-player.selected-player {
  background: #e3f2fd;
  border: 2px solid #1976D2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.online-player.my-pet {
  border: 3px solid #4caf50;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.online-player.my-pet .player-avatar {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
}

.player-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.player-info {
  text-align: center;
  margin-top: 4px;
}

.player-name {
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.player-level {
  font-size: 0.65rem;
  color: #666;
}

.player-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.action-small {
  padding: 3px 8px;
  font-size: 0.7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.action-small.greet {
  background: #2196f3;
  color: white;
}

.action-small.battle {
  background: #f44336;
  color: white;
}

/* Locations Section */
.locations-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.locations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.location-card {
  padding: 14px;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.location-card:hover {
  border-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.location-card.active {
  border-color: #1976D2;
  background: #e3f2fd;
}

.location-card .location-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.location-info {
  font-size: 0.85rem;
}

.location-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}

.location-desc {
  color: #666;
  font-size: 0.75rem;
}

/* Chat Section */
.chat-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.chat-messages {
  height: 150px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.chat-message {
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.chat-message.system {
  color: #1976D2;
  font-style: italic;
}

.chat-message.user {
  color: #333;
}

.user-msg .sender {
  font-weight: 600;
  color: #1976D2;
}

.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.chat-input button {
  padding: 10px 18px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.chat-input button:hover {
  background: #1565C0;
}

/* History Section */
.history-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 10px 12px;
  background: #f9f9f9;
  border-radius: 6px;
  font-size: 0.85rem;
  display: flex;
  gap: 10px;
  align-items: center;
}

.interaction-type {
  font-weight: 600;
  color: #1976D2;
  background: #e3f2fd;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.interaction-with {
  color: #666;
  flex: 1;
}

.interaction-exp {
  color: #4caf50;
  font-weight: 600;
}

.no-history {
  text-align: center;
  color: #999;
  padding: 20px;
  font-style: italic;
}

/* Debug Info */
.debug-info {
  margin-top: 8px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  font-size: 0.8rem;
}

.debug-info summary {
  cursor: pointer;
  font-weight: bold;
  color: #666;
}

.debug-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

/* Error Message */
.error-message {
  margin-top: 10px;
  padding: 10px 14px;
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c62828;
  font-size: 0.85rem;
}

.error-icon {
  font-size: 1.1rem;
}

.error-text {
  flex: 1;
}

/* Chat Messages in Garden */
.chat-message.my-message {
  background: #e8f5e9;
  border-left: 3px solid #4caf50;
  padding: 6px 10px;
  border-radius: 4px;
}

.chat-message.other-message {
  background: #f5f5f5;
  border-left: 3px solid #9e9e9e;
  padding: 6px 10px;
  border-radius: 4px;
}

.chat-message .sender {
  font-weight: 600;
  margin-right: 4px;
}

.chat-message.my-message .sender {
  color: #2e7d32;
}

.chat-message .text {
  color: #333;
}

/* Animations */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes urgentPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
