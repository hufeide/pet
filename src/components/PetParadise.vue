<template>
  <div class="pet-paradise">
    <!-- Pet Status Panel (Integrated from pet-kingdom store) -->
    <div v-if="showPetStatus" class="pet-status-panel">
      <div class="status-header">
        <h3>我的宠物 - Lv.{{ petStatus.level }}</h3>
        <button class="close-status-btn" @click="showPetStatus = false">×</button>
      </div>

      <!-- Friendship & Health -->
      <div class="status-top">
        <div class="friendship-bar">
          <span> Friendship: </span>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.friendship + '%' }"></div>
          </div>
          <span>{{ petStatus.friendship }}/100</span>
        </div>
        <div class="health-bar">
          <span> Health: </span>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.health + '%' }" style="background: #4caf50"></div>
          </div>
          <span>{{ petStatus.health }}/100</span>
        </div>
        <div class="happiness-bar">
          <span> Happiness: </span>
          <div class="progress-bg">
            <div class="progress-fill" :style="{ width: petStatus.happiness + '%' }" style="background: #ff9800"></div>
          </div>
          <span>{{ petStatus.happiness }}/100</span>
        </div>
      </div>

      <!-- Six Needs -->
      <div class="needs-section">
        <h4>当前需求</h4>
        <div class="needs-grid">
          <div class="need-item" :class="{ urgent: petStatus.hunger < 40 }">
            <div class="need-label">🍎 饥饿度</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.hunger + '%' }"></div>
            </div>
            <span>{{ petStatus.hunger }}%</span>
          </div>
          <div class="need-item" :class="{ urgent: petStatus.sleep < 40 }">
            <div class="need-label">💤 睡意</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.sleep + '%' }"></div>
            </div>
            <span>{{ petStatus.sleep }}%</span>
          </div>
          <div class="need-item" :class="{ urgent: petStatus.play < 40 }">
            <div class="need-label">🎾 玩耍</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.play + '%' }"></div>
            </div>
            <span>{{ petStatus.play }}%</span>
          </div>
          <div class="need-item" :class="{ urgent: petStatus.love < 40 }">
            <div class="need-label">❤️ 爱意</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.love + '%' }"></div>
            </div>
            <span>{{ petStatus.love }}%</span>
          </div>
          <div class="need-item" :class="{ urgent: petStatus.chat < 40 }">
            <div class="need-label">💬 聊天</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.chat + '%' }"></div>
            </div>
            <span>{{ petStatus.chat }}%</span>
          </div>
          <div class="need-item" :class="{ urgent: petStatus.knowledge < 40 }">
            <div class="need-label">📚 知识</div>
            <div class="progress-bg">
              <div class="progress-fill" :style="{ width: petStatus.knowledge + '%' }"></div>
            </div>
            <span>{{ petStatus.knowledge }}%</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="needs-actions">
        <button @click="feedPet" class="action-btn feed-btn">Feed 🍖</button>
        <button @click="putPetToSleep" class="action-btn sleep-btn">Sleep 🌙</button>
        <button @click="playWithPet" class="action-btn play-btn">Play 🎾</button>
        <button @click="showAffection" class="action-btn love-btn">Love ❤️</button>
        <button @click="learnTopic" class="action-btn learn-btn">Learn 📚</button>
        <button @click="selfCare" class="action-btn selfcare-btn">Self Care 🛠️</button>
      </div>

      <!-- Pet Request -->
      <div v-if="petRequest" class="pet-request">
        <span class="request-icon">🐾</span>
        <span class="request-text">{{ petRequest }}</span>
      </div>
    </div>

    <!-- Pet Icon Trigger (only show when status panel is closed) -->
    <div v-if="!showPetStatus" class="pet-icon-trigger" @click="showPetStatus = true">
      <div class="pet-avatar-large">{{ getAvatar(petStatus.name) }}</div>
      <div class="pet-name-large">{{ petStatus.name }}</div>
      <div class="pet-level-large">Lv.{{ petStatus.level }}</div>
    </div>

    <div class="paradise-header">
      <h3>宠物乐园</h3>
      <div class="paradise-stats">
        <span>在线宠物: {{ playerCount }}</span>
        <span>互动: {{ interactionCount }}</span>
        <span>战斗: {{ battleCount }}</span>
      </div>
    </div>

    <!-- 花园场景 -->
    <div v-if="currentLocation?.type === 'rest'" class="garden-scene">
      <div class="garden-header">
        <h4>花园 - 休息和聊天</h4>
        <button @click="leaveGarden" class="leave-btn">离开花园</button>
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
            花园里很安静，去打招呼开始聊天吧！
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

      <!-- 错误提示 -->
      <div v-if="error" class="error-message">
        <span class="error-icon">⚠️</span>
        <span class="error-text">{{ error }}</span>
      </div>

      <div class="garden-players">
        <h4>花园里的宠物</h4>
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
            <button @click.stop="greetPlayer(player.playerId)">打招呼</button>
            <button @click.stop="challengeBattle(player.playerId)">挑战</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 非花园场景 -->
    <div v-else>
      <div class="paradise-map">
        <h4>乐园地图</h4>
        <div class="map-grid">
          <div
            v-for="location in locations"
            :key="location.id"
            class="map-location"
            :class="['location-' + location.type]"
            :style="{ left: location.x + '%', top: location.y + '%', transform: 'translate(-50%, -50%)' }"
            @click="setLocation(location.id)"
          >
            <div class="location-icon">
              <span v-if="location.type === 'meeting'">广场</span>
              <span v-else-if="location.type === 'battle'">竞技场</span>
              <span v-else-if="location.type === 'trade'">市场</span>
              <span v-else>花园</span>
            </div>
            <div class="location-name">{{ location.name }}</div>
          </div>

          <!-- 在线玩家 -->
          <div
            v-for="player in onlinePlayers"
            :key="player.playerId"
            class="online-player"
            :class="{ 'selected-player': player.playerId === selectedPlayerId }"
            :style="{ left: player.position.x + '%', top: player.position.y + '%', transform: 'translate(-50%, -50%)' }"
            @click="selectPlayer(player)"
          >
            <div class="player-avatar">{{ getAvatar(player.name) }}</div>
            <div class="player-info">
              <div class="player-name">{{ player.name }}</div>
              <div class="player-level">Lv.{{ player.level }}</div>
            </div>
            <div class="player-actions" v-if="player.playerId !== 'default' && player.playerId === selectedPlayerId">
              <button @click.stop="interact(player.playerId, 'greet')">打招呼</button>
              <button @click.stop="challengeBattle(player.playerId)">挑战</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="paradise-locations">
      <h4>可选地点</h4>
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

    <div class="chat-area">
      <h4>聊天室</h4>
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

    <div class="interaction-history">
      <h4>互动记录 ({{ interactionCount }})</h4>
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
      </div>
    </div>

    <div class="pet-info">
      <h4>我的宠物信息</h4>
      <p>{{ masterInfo }}</p>
      <p>当前地点: {{ currentLocation?.name || '无' }}</p>
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
const onlinePlayers = computed(() => petKingdomStore.onlinePlayers);
const interactionHistory = computed(() => petKingdomStore.interactionHistory);
const chatHistory = computed(() => petKingdomStore.chatHistory);
const playerCount = computed(() => petKingdomStore.playerCount);
const interactionCount = computed(() => petKingdomStore.interactionCount);
const battleCount = computed(() => petKingdomStore.battleCount);
const error = computed(() => petKingdomStore.error);

const chatMessage = ref('');
const gardenMessage = ref('');
const masterInfo = computed(() => petKingdomStore.getMasterInfo());

// Pet Status from store
const petStatus = computed(() => petKingdomStore.petStatus);
const petRequest = computed(() => petKingdomStore.petRequest);
const showPetStatus = ref(false);

// 花园相关计算属性
const gardenChatHistory = computed(() => petKingdomStore.gardenChatHistory);
const gardenPlayers = computed(() => {
  if (petKingdomStore.currentLocation?.type === 'rest') {
    return petKingdomStore.onlinePlayers;
  }
  return [];
});
// Garden conversation topics ( kept for reference but not used )
const GARDEN_TOPICS = [
  '今天天气真好啊，适合出来散步！',
  '大家最近都玩些什么呀？',
  '我刚刚学会了一个新动作，大家想看吗？',
  '这里的花园真漂亮，推荐大家来这里休息。',
  '有没有人想一起组队去冒险？',
  '最近吃到什么好吃的了吗？',
  '大家有什么开心的事情要分享吗？',
  '这里的风景让我想起了家。',
];

const selectedPlayerId = ref<string | null>(null);

onMounted(() => {
  petKingdomStore.loadPetKingdom();
  memoryStore.loadFromDB('default');
  // Start the 10-minute interval checks
  petKingdomStore.startNeedChecks();
});

// Pet care actions
function feedPet(): void {
  petKingdomStore.feedPet();
  // Record the need satisfaction
  memoryStore.recordNeedSatisfied('default', 'eat', true);
  // Update last meal time
  memoryStore.lastMealTime = new Date();
}

function putPetToSleep(): void {
  petKingdomStore.putPetToSleep();
  memoryStore.recordNeedSatisfied('default', 'sleep', true);
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

function selfCare(): void {
  petKingdomStore.selfCare();
}

function chatWithPet(): void {
  petKingdomStore.chatWithPet('Hello!');
  memoryStore.recordNeedSatisfied('default', 'chat', true);
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

function greetPlayer(playerId: string): void {
  petKingdomStore.greetPlayer(playerId);
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
    meeting: '广场',
    battle: '⚔️',
    trade: ' Marketplace',
    rest: '花园',
  };
  return icons[type] || '📍';
}
</script>

<style scoped>
.pet-paradise {
  padding: 16px;
}

.paradise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.paradise-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.paradise-stats {
  display: flex;
  gap: 12px;
  font-size: 0.85rem;
  color: #666;
}

.paradise-map {
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.map-grid {
  position: relative;
  width: 100%;
  height: 300px;
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.map-location {
  position: absolute;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #1976D2;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.map-location:hover {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.location-icon {
  font-size: 1.5rem;
}

.location-name {
  font-size: 0.75rem;
  margin-top: 4px;
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
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.2s;
}

.online-player:hover {
  transform: translate(-50%, -100%);
}

.player-avatar {
  width: 32px;
  height: 32px;
  background: #1976D2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.player-info {
  text-align: center;
}

.player-name {
  font-size: 0.75rem;
  font-weight: 500;
}

.player-level {
  font-size: 0.7rem;
  color: #666;
}

.player-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.player-actions button {
  padding: 4px 8px;
  font-size: 0.65rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.player-actions button:first-child {
  background: #2196f3;
  color: white;
}

.player-actions button:last-child {
  background: #f44336;
  color: white;
}

.paradise-locations {
  margin-bottom: 24px;
}

.paradise-locations h4 {
  margin-bottom: 8px;
  font-size: 1rem;
  color: #333;
}

.locations-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.location-card {
  padding: 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
  transition: all 0.2s;
}

.location-card:hover {
  border-color: #1976D2;
  transform: translateY(-2px);
}

.location-card.active {
  border-color: #1976D2;
  background: #e3f2fd;
}

.location-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.location-info {
  font-size: 0.85rem;
}

.location-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.location-desc {
  color: #666;
  font-size: 0.75rem;
}

.chat-area {
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.chat-area h4 {
  margin-bottom: 8px;
  font-size: 1rem;
  color: #333;
}

.chat-messages {
  height: 150px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.chat-message {
  margin-bottom: 4px;
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
  font-weight: 500;
  color: #1976D2;
}

.chat-input {
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.85rem;
}

.chat-input button {
  padding: 8px 16px;
  background: #1976D2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.interaction-history {
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
}

.interaction-history h4 {
  margin-bottom: 8px;
  font-size: 1rem;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  padding: 8px;
  background: white;
  border-radius: 6px;
  font-size: 0.85rem;
  display: flex;
  gap: 8px;
}

.interaction-type {
  font-weight: 500;
  color: #1976D2;
}

.interaction-with {
  color: #666;
}

.interaction-exp {
  color: #4caf50;
  font-weight: 500;
}

.pet-info {
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.pet-info h4 {
  margin-bottom: 8px;
  font-size: 1rem;
  color: #333;
}

.pet-info p {
  margin: 4px 0;
  font-size: 0.85rem;
  color: #666;
}

/* 错误消息 */
.error-message {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c62828;
  font-size: 0.9rem;
}

.error-icon {
  font-size: 1.2rem;
}

.error-text {
  flex: 1;
}

/* ==========================================
   Pet Status Panel (Integrated Pet-Chat)
   ========================================== */
.pet-status-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  border: 2px solid #1976D2;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e3f2fd;
}

.status-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #1976D2;
}

.close-status-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0 8px;
}

.close-status-btn:hover {
  color: #333;
}

/* Status Top: Friendship, Health, Happiness */
.status-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.friendship-bar,
.health-bar,
.happiness-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}

.friendship-bar span:first-child,
.health-bar span:first-child,
.happiness-bar span:first-child {
  font-weight: 600;
  color: #333;
  min-width: 80px;
}

.progress-bg {
  flex: 1;
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.health-bar .progress-fill { background: #4caf50; }
.happiness-bar .progress-fill { background: #ff9800; }

/* Needs Section */
.needs-section {
  margin-bottom: 24px;
}

.needs-section h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #333;
}

.needs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.need-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.need-item.urgent {
  border-color: #f44336;
  background: #ffebee;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.1);
}

.need-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Pet Icon Trigger */
.pet-icon-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #1976D2;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 24px;
}

.pet-icon-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.pet-avatar-large {
  width: 48px;
  height: 48px;
  background: #1976D2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
}

.pet-name-large {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.pet-level-large {
  font-size: 0.9rem;
  color: #666;
}

/* Pet Request */
.pet-request {
  padding: 12px 16px;
  background: #fff3e0;
  border: 1px solid #ffe0b2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.request-icon {
  font-size: 1.3rem;
}

.request-text {
  font-size: 0.9rem;
  color: #e65100;
  font-weight: 500;
}

/* Needs Actions */
.needs-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.action-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.action-btn.feed-btn { background: #ff9800; color: white; }
.action-btn.sleep-btn { background: #9c27b0; color: white; }
.action-btn.play-btn { background: #2196f3; color: white; }
.action-btn.love-btn { background: #f44336; color: white; }
.action-btn.learn-btn { background: #4caf50; color: white; }
.action-btn.selfcare-btn { background: #607d8b; color: white; }

.action-btn:active {
  transform: translateY(0);
}
</style>
