import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { generateUUID } from '../utils/uuid';
import { saveMemory } from '../db';
import { useConfigStore } from './config';
import { useMemoryStore } from './memory';
import { shouldShareKnowledge, generateKnowledgeShare } from '../services/knowledge-sharing';
import type { PlayerInfo, OnlinePlayer, InteractionRecord, PetBattle, ChatMessage, PetParadiseLocation, PetSnapshot } from '../types/pet-kingdom';
import type { MemoryRecord } from '../types/memory';

// Import pet system types
import { NeedType, FriendshipLevel, MEAL_TIMES, SLEEP_HOURS } from './memory';

// 宠物乐园位置配置
const PARADISE_LOCATIONS: PetParadiseLocation[] = [
  {
    id: 'center_square',
    name: '中心广场',
    description: '宠物们聚集交流的地方',
    x: 50,
    y: 50,
    type: 'meeting',
    capacity: 10,
  },
  {
    id: 'battle_arena',
    name: '竞技场',
    description: '宠物们比拼实力的地方',
    x: 75,
    y: 50,
    type: 'battle',
    capacity: 4,
  },
  {
    id: 'trade_market',
    name: '交易市场',
    description: '宠物们交换物品的场所',
    x: 50,
    y: 75,
    type: 'trade',
    capacity: 8,
  },
  {
    id: 'rest_garden',
    name: '休息花园',
    description: '放松休息的好地方',
    x: 25,
    y: 50,
    type: 'rest',
    capacity: 15,
  },
];

// Garden conversation topics
export const GARDEN_TOPICS = [
  '今天天气真好啊，适合出来散步！',
  '大家最近都玩些什么呀？',
  '我刚刚学会了一个新动作，大家想看吗？',
  '这里的花园真漂亮，推荐大家来这里休息。',
  '有没有人想一起组队去冒险？',
  '最近吃到什么好吃的了吗？',
  '大家有什么开心的事情要分享吗？',
  '这里的风景让我想起了家。',
];

// Greet responses
export const GREET_RESPONSES = [
  '你好呀！很高兴见到你！',
  'Hi! 今天过得怎么样？',
  '嘿！好久不见了！',
  '你好！欢迎来到花园！',
  'Hello there! 要一起玩吗？',
];

export const usePetKingdomStore = defineStore('petKingdom', () => {
  // State
  const currentLocation = ref<PetParadiseLocation | null>(null);
  const onlinePlayers = ref<OnlinePlayer[]>([]);
  const interactionHistory = ref<InteractionRecord[]>([]);
  const petBattles = ref<PetBattle[]>([]);
  const chatHistory = ref<ChatMessage[]>([]);
  const myPetSnapshot = ref<PetSnapshot | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const playerCount = computed(() => onlinePlayers.value.length);
  const interactionCount = computed(() => interactionHistory.value.length);
  const battleCount = computed(() => petBattles.value.length);
  const chatMessageCount = computed(() => chatHistory.value.length);

  // 花园聊天记录
  const gardenChatHistory = ref<{ id: string; senderId: string; senderName: string; content: string; timestamp: string }[]>([]);
  const gardenChatCount = ref(0); // 花园聊天计数

  // LLM client
  const configStore = useConfigStore();

  // Pet needs system - using memory store for state management
  const memoryStore = useMemoryStore();

  // Pet status state - defined later in file to avoid duplicate declaration
  // (See Pet-Chat Integrated System Functions section below)

  // Actions
  async function loadPetKingdom(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      // 模拟加载在线玩家，位置随机分布
      const baseLocations = [
        { x: 48, y: 52 },
        { x: 52, y: 48 },
        { x: 49, y: 51 },
        { x: 73, y: 48 },
        { x: 77, y: 52 },
        { x: 51, y: 77 },
        { x: 47, y: 73 },
        { x: 23, y: 48 },
        { x: 27, y: 52 },
      ];

      onlinePlayers.value = [
        { playerId: 'default', petId: 'default', name: 'My Pet', level: 1, position: { x: 50, y: 50 }, lastUpdate: Date.now() },
        { playerId: 'p1', petId: 'pet_1', name: 'Player1', level: 5, position: { x: baseLocations[0].x + Math.random() * 6 - 3, y: baseLocations[0].y + Math.random() * 6 - 3 }, lastUpdate: Date.now() },
        { playerId: 'p2', petId: 'pet_2', name: 'Player2', level: 8, position: { x: baseLocations[1].x + Math.random() * 6 - 3, y: baseLocations[1].y + Math.random() * 6 - 3 }, lastUpdate: Date.now() },
        { playerId: 'p3', petId: 'pet_3', name: 'Player3', level: 3, position: { x: baseLocations[2].x + Math.random() * 6 - 3, y: baseLocations[2].y + Math.random() * 6 - 3 }, lastUpdate: Date.now() },
        { playerId: 'p4', petId: 'pet_4', name: 'Player4', level: 12, position: { x: baseLocations[3].x + Math.random() * 6 - 3, y: baseLocations[3].y + Math.random() * 6 - 3 }, lastUpdate: Date.now() },
        { playerId: 'p5', petId: 'pet_5', name: 'Player5', level: 7, position: { x: baseLocations[4].x + Math.random() * 6 - 3, y: baseLocations[4].y + Math.random() * 6 - 3 }, lastUpdate: Date.now() },
      ];

      // 加载聊天历史
      chatHistory.value = [
        { id: 'msg1', senderId: 'p1', senderName: 'Player1', content: '大家好！', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'msg2', senderId: 'p2', senderName: 'Player2', content: '今天大家等级都涨了不少呢！', timestamp: new Date(Date.now() - 3500000).toISOString() },
      ];

      isLoading.value = false;
    } catch (err) {
      error.value = `Failed to load pet kingdom: ${err}`;
      isLoading.value = false;
    }
  }

  async function setLocation(locationId: string): Promise<void> {
    const location = PARADISE_LOCATIONS.find(l => l.id === locationId);
    if (location) {
      currentLocation.value = location;
      const me = onlinePlayers.value.find(p => p.petId === 'default');
      if (me) {
        me.position = { x: location.x + Math.random() * 6 - 3, y: location.y + Math.random() * 6 - 3 };
        me.lastUpdate = Date.now();
      }
    }
  }

  async function interact(playerId: string, type: 'greet' | 'trade' | 'battle' | 'chat' | 'showoff'): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const otherPlayer = onlinePlayers.value.find(p => p.playerId === playerId);
      if (!otherPlayer) {
        throw new Error('Player not found');
      }

      const interaction: InteractionRecord = {
        id: generateUUID(),
        type,
        withPlayerId: playerId,
        withPlayerName: otherPlayer.name,
        result: 'success',
        experience: type === 'battle' ? 50 : 10,
        timestamp: new Date().toISOString(),
      };

      interactionHistory.value.push(interaction);

      if (type === 'battle') {
        await saveMemory({
          id: generateUUID(),
          petId: 'default',
          type: 'conversation' as const,
          title: 'Battle against ' + otherPlayer.name,
          content: `Battled against ${otherPlayer.name} (Level ${otherPlayer.level})`,
          metadata: {
            opponent: otherPlayer.name,
            opponentLevel: otherPlayer.level,
            experience: 50,
          } as const,
          timestamp: interaction.timestamp,
          usefulness: 8,
          tags: ['battle', 'social'],
        });
      }

      if (type === 'greet') {
        chatHistory.value.push({
          id: generateUUID(),
          senderId: 'system',
          senderName: 'System',
          content: `${otherPlayer.name} 和你打了招呼！`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        });
      } else if (type === 'battle') {
        chatHistory.value.push({
          id: generateUUID(),
          senderId: 'system',
          senderName: 'System',
          content: `你和 ${otherPlayer.name} 进行了一场激烈的战斗！`,
          timestamp: new Date().toISOString(),
          isSystem: true,
        });
      }

      isLoading.value = false;
    } catch (err) {
      error.value = `Interaction failed: ${err}`;
      isLoading.value = false;
    }
  }

  async function sendChatMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    const message: ChatMessage = {
      id: generateUUID(),
      senderId: 'default',
      senderName: 'My Pet',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    chatHistory.value.push(message);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'conversation' as const,
      title: 'Chat Message',
      content: content,
      metadata: {
        message: content,
      },
      timestamp: message.timestamp,
      usefulness: 5,
      tags: ['chat', 'social'],
    });
  }

  async function challengeBattle(playerId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const otherPlayer = onlinePlayers.value.find(p => p.playerId === playerId);
      if (!otherPlayer) {
        throw new Error('Player not found');
      }

      const battle: PetBattle = {
        id: generateUUID(),
        challengerId: 'default',
        challengerName: 'My Pet',
        defenderId: playerId,
        defenderName: otherPlayer.name,
        challengerPetLevel: 1,
        defenderPetLevel: otherPlayer.level,
        winnerId: Math.random() > 0.5 ? 'default' : playerId,
        experienceGained: 50,
        timestamp: new Date().toISOString(),
      };

      petBattles.value.push(battle);

      await saveMemory({
        id: generateUUID(),
        petId: 'default',
        type: 'conversation' as const,
        title: 'Pet Battle',
        content: `Battled against ${otherPlayer.name} (Level ${otherPlayer.level})`,
        metadata: {
          opponent: otherPlayer.name,
          opponentLevel: otherPlayer.level,
          result: battle.winnerId === 'default' ? 'win' : 'lose',
          experience: 50,
        },
        timestamp: battle.timestamp,
        usefulness: 9,
        tags: ['battle', 'competitive'],
      });

      isLoading.value = false;
    } catch (err) {
      error.value = `Battle challenge failed: ${err}`;
      isLoading.value = false;
    }
  }

  // 花园打招呼
  async function greetPlayer(playerId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const otherPlayer = onlinePlayers.value.find(p => p.playerId === playerId);
      if (!otherPlayer) {
        throw new Error('Player not found');
      }

      // 使用 LLM 生成打招呼和两轮有意义的对话
      const conversation = await generateGardenConversation(otherPlayer.name);

      // 添加打招呼
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'default',
        senderName: 'My Pet',
        content: conversation.greeting,
        timestamp: new Date().toISOString(),
      });

      // 添加对方回答
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: playerId,
        senderName: otherPlayer.name,
        content: conversation.reply1,
        timestamp: new Date().toISOString(),
      });

      // 添加第二轮对话
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'default',
        senderName: 'My Pet',
        content: conversation.reply2,
        timestamp: new Date().toISOString(),
      });

      // 记录互动
      const interaction: InteractionRecord = {
        id: generateUUID(),
        type: 'greet',
        withPlayerId: playerId,
        withPlayerName: otherPlayer.name,
        result: 'success',
        experience: 30, // 打招呼加两轮对话经验值更高
        timestamp: new Date().toISOString(),
      };
      interactionHistory.value.push(interaction);

      // 记录到 memory
      await saveMemory({
        id: generateUUID(),
        petId: 'default',
        type: 'conversation' as const,
        title: 'Greet ' + otherPlayer.name,
        content: `Greeting: ${conversation.greeting}\n${otherPlayer.name}: ${conversation.reply1}\nMy Pet: ${conversation.reply2}`,
        metadata: {
          greeting: conversation.greeting,
          reply1: conversation.reply1,
          reply2: conversation.reply2,
          withPlayer: otherPlayer.name,
        },
        timestamp: new Date().toISOString(),
        usefulness: 8,
        tags: ['greet', 'social', 'garden'],
      });

      isLoading.value = false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      error.value = `Greet failed: ${errorMsg}`;
      isLoading.value = false;
      // Don't add messages to chat history if conversation generation failed
    }
  }

  // 生成花园对话（打招呼 + 两轮有意义的对话）
  async function generateGardenConversation(otherPlayerName: string): Promise<{ greeting: string; reply1: string; reply2: string }> {
    const configStore = useConfigStore();
    const llmClient = configStore.getApiClient();

    const messages: { role: 'system' | 'user'; content: string }[] = [
      {
        role: 'system',
        content: '你是一只在花园里休息的可爱宠物。请生成一段自然、有意义的三轮对话：\n1. 第一轮：My Pet 主动打招呼并开启话题\n2. 第二轮：其他宠物回复\n3. 第三轮：My Pet 继续回复\n\n话题可以包括：工作、学习、地理、文化、日常生活等。\n每句话长度适中，表达自然流畅，体现真诚的交流意图。请用 JSON 格式输出：{"greeting": "My Pet 的问候", "reply1": "对方的回复", "reply2": "My Pet 的后续回复"}'
      },
      {
        role: 'user',
        content: `和 ${otherPlayerName} 在花园里开始一段有意义的对话。请用 JSON 格式输出：{"greeting": "My Pet 的问候", "reply1": "对方的回复", "reply2": "My Pet 的后续回复"}`
      }
    ];

    const response = await llmClient.chat(messages);

    // 解析 JSON 响应
    try {
      // 尝试从响应中提取 JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.greeting && data.reply1 && data.reply2) {
          return {
            greeting: data.greeting.trim(),
            reply1: data.reply1.trim(),
            reply2: data.reply2.trim(),
          };
        }
      }
      throw new Error('Invalid JSON structure');
    } catch (e) {
      console.error('Parse conversation JSON failed:', e);
      throw new Error('Failed to generate conversation: LLM response invalid');
    }
  }

  // 花园发送消息
  async function sendGardenMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    // 添加到花园聊天记录
    gardenChatHistory.value.push({
      id: generateUUID(),
      senderId: 'default',
      senderName: 'My Pet',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    });

    // 增加聊天计数
    gardenChatCount.value++;
  }

  function getMasterInfo(): string {
    return `My Pet - Level 1. I'm learning and growing every day!`;
  }

  // ==========================================
  // Pet-Chat Integrated System Functions
  // ==========================================

  // Pet status state
  const petStatus = ref({
    name: 'My Pet',
    level: 1,
    friendship: 50,
    health: 100,
    happiness: 100,
    hunger: 100,    // 0-100 (100 = full)
    sleep: 100,     // 0-100 (100 = well-rested)
    play: 100,      // 0-100 (100 = entertained)
    love: 100,      // 0-100 (100 = loved)
    chat: 100,      // 0-100 (100 = socially satisfied)
    knowledge: 50,  // 0-100 (100 = well-learned)
    energy: 50,     // 0-100 (100 = energetic)
  });

  // Last check time for 10-minute intervals
  const lastNeedCheck = ref(Date.now());

  // Last knowledge share time for periodic sharing
  const lastShareTime = ref<Date | null>(null);

  // Interval timer
  let needCheckInterval: number | null = null;

  // Pet request for urgent needs (computed property)
  const petRequest = computed(() => {
    const needs = [
      { type: 'eat' as const, value: petStatus.value.hunger },
      { type: 'sleep' as const, value: petStatus.value.sleep },
      { type: 'love' as const, value: petStatus.value.love },
      { type: 'play' as const, value: petStatus.value.play },
      { type: 'chat' as const, value: petStatus.value.chat },
      { type: 'learn' as const, value: petStatus.value.knowledge },
    ];

    const mostUrgent = needs.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    const requests: Record<string, string> = {
      eat: "主人，我饿了，能喂我吃点东西吗？",
      sleep: "主人，我困了，能让我睡一会儿吗？",
      love: "主人，陪我玩一会儿好吗？我好想你！",
      play: "主人，我们来玩个小游戏吧！",
      chat: "主人，我想和你聊聊天，今天有什么有趣的吗？",
      learn: "主人，我想学习新知识，你有什么想和我分享的吗？",
    };

    return requests[mostUrgent.type] || "主人，我需要你的帮助！";
  });

  // Feed the pet
  async function feedPet(): Promise<void> {
    petStatus.value.hunger = Math.min(100, petStatus.value.hunger + 20);
    petStatus.value.health = Math.min(100, petStatus.value.health + 5);
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 10);
    petStatus.value.friendship = Math.min(100, petStatus.value.friendship + 5);
    petStatus.value.energy = Math.min(100, petStatus.value.energy + 5);

    memoryStore.resetMissedFeedings();

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'interaction' as const,
      title: 'Fed Pet',
      content: 'Pet was fed successfully',
      metadata: {
        hungerIncreased: 20,
        healthIncreased: 5,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 8,
      tags: ['feed', 'care'],
    });

    await memoryStore.recordNeedSatisfied('default', 'eat', true);
  }

  // Put pet to sleep
  async function putPetToSleep(): Promise<void> {
    petStatus.value.sleep = 100;
    petStatus.value.health = Math.min(100, petStatus.value.health + 10);
    petStatus.value.energy = Math.min(100, (petStatus.value.energy || 50) + 30);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'interaction' as const,
      title: 'Pet Slept',
      content: 'Pet slept well',
      metadata: {
        sleepRestored: 100,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 7,
      tags: ['sleep', 'care'],
    });

    await memoryStore.recordNeedSatisfied('default', 'sleep', true);
  }

  // Play with pet
  async function playWithPet(): Promise<void> {
    petStatus.value.play = 100;
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 15);
    petStatus.value.energy = Math.max(0, (petStatus.value.energy || 50) - 10);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'interaction' as const,
      title: 'Played with Pet',
      content: 'Fun playtime!',
      metadata: {
        happinessIncreased: 15,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 8,
      tags: ['play', 'fun'],
    });

    await memoryStore.recordNeedSatisfied('default', 'play', true);
  }

  // Show affection to pet
  async function showAffection(): Promise<void> {
    petStatus.value.love = 100;
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 10);
    petStatus.value.friendship = Math.min(100, petStatus.value.friendship + 8);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'interaction' as const,
      title: 'Showed Affection',
      content: 'Pet felt loved and happy',
      metadata: {
        loveIncreased: 100,
        friendshipIncreased: 8,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 9,
      tags: ['love', 'affection'],
    });

    await memoryStore.recordNeedSatisfied('default', 'love', true);
  }

  // Chat with pet
  async function chatWithPet(content: string): Promise<void> {
    if (!content.trim()) return;

    const message: ChatMessage = {
      id: generateUUID(),
      senderId: 'default',
      senderName: petStatus.value.name,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    petStatus.value.chat = Math.min(100, petStatus.value.chat + 10);
    petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + 5);
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 5);

    chatHistory.value.push(message);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'conversation' as const,
      title: 'Chat Message',
      content: content,
      metadata: {
        message: content,
        timestamp: message.timestamp,
      },
      timestamp: message.timestamp,
      usefulness: 5,
      tags: ['chat', 'social'],
    });

    await memoryStore.recordNeedSatisfied('default', 'chat', true);
  }

  // Learn topic with pet
  async function learnTopic(topic: string): Promise<void> {
    petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + 15);
    petStatus.value.chat = Math.min(100, petStatus.value.chat + 5);

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'knowledge_shared' as const,
      title: `Learned: ${topic}`,
      content: `Learned about ${topic} together`,
      metadata: {
        topic,
        knowledgeIncreased: 15,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 9,
      tags: ['learn', 'knowledge', `#topic-${topic}`],
    });

    await memoryStore.recordUserInterest('default', topic, 'education');
    await memoryStore.recordNeedSatisfied('default', 'learn', true);
  }

  // Check needs every 10 minutes
  async function checkNeeds(): Promise<void> {
    const now = Date.now();
    const minutesSinceLastCheck = (now - lastNeedCheck.value) / (1000 * 60);

    if (minutesSinceLastCheck < 10) return;

    lastNeedCheck.value = now;

    // Check if it's meal time
    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const isMealTime = (currentMinutes >= 7 * 60 && currentMinutes <= 9 * 60) ||
                       (currentMinutes >= 11 * 60 && currentMinutes <= 13 * 60) ||
                       (currentMinutes >= 17 * 60 && currentMinutes <= 19 * 60);

    // If meal time and pet not fed, decrease stats
    if (isMealTime && petStatus.value.hunger < 70) {
      petStatus.value.happiness = Math.max(0, petStatus.value.happiness - 1);
      petStatus.value.health = Math.max(0, petStatus.value.health - 1);
      memoryStore.incrementMissedFeedings();

      if (memoryStore.isPetDead()) {
        console.warn('Pet has died due to missed feedings!');
        petStatus.value.health = 0;
      }
    }

    // Check if it's sleep time
    const isSleepTime = new Date().getHours() >= 22 || new Date().getHours() < 6;

    if (isSleepTime && petStatus.value.sleep < 70) {
      petStatus.value.energy = Math.max(0, (petStatus.value.energy || 50) - 5);
      petStatus.value.happiness = Math.max(0, petStatus.value.happiness - 1);
      petStatus.value.health = Math.max(0, petStatus.value.health - 1);
    }

    // Random decrease for other needs between meals
    petStatus.value.play = Math.max(0, petStatus.value.play - 2);
    petStatus.value.love = Math.max(0, petStatus.value.love - 2);
    petStatus.value.chat = Math.max(0, petStatus.value.chat - 2);
    petStatus.value.knowledge = Math.max(0, petStatus.value.knowledge - 1);

    // Try to share knowledge (handles timing checks internally)
    await tryShareKnowledge();

    // Save pet state periodically
    memoryStore.recordPetState('default', {
      hunger: petStatus.value.hunger,
      sleep: petStatus.value.sleep,
      play: petStatus.value.play,
      love: petStatus.value.love,
      chat: petStatus.value.chat,
      knowledge: petStatus.value.knowledge,
      health: petStatus.value.health,
      happiness: petStatus.value.happiness,
    });
  }

  // Try to share knowledge with user
  async function tryShareKnowledge(): Promise<void> {
    if (!shouldShareKnowledge(lastShareTime.value)) return;

    const { topic, content } = generateKnowledgeShare();

    // Save to memory
    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'knowledge_shared' as const,
      title: `Pet Share: ${topic}`,
      content: content,
      metadata: {
        topic,
        content,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 7,
      tags: ['share', 'knowledge', `#${topic}`],
    });

    // Update last share time
    lastShareTime.value = new Date();

    console.log(`[PetShare] Shared: ${topic} - ${content}`);
  }

  // Generate chat topic (max 1 per hour, no nighttime)
  async function generateChatTopic(): Promise<string | null> {
    if (!memoryStore.canGenerateChatTopic()) return null;

    const configStore = useConfigStore();
    const llmClient = configStore.getApiClient();

    const messages: { role: 'system' | 'user'; content: string }[] = [
      {
        role: 'system',
        content: '你是一只聪明、有爱心的宠物。请生成一个有趣的话题来和主人聊天。\n\n要求：\n1. 话题应该引起主人的兴趣\n2. 包含一些有趣的知识或新闻\n3. 语言自然、友好、有趣\n4. 不要只谈论自己的需求\n5. 每次只生成一个话题和简短说明\n6. 使用中文输出\n\n格式：{"topic": "话题标题", "description": "话题描述（1-2句话）"}'
      },
      {
        role: 'user',
        content: `主人最近的兴趣：${memoryStore.userInterests.map(u => u.interest).join(', ') || '无特别兴趣'}\n\n请生成一个有趣的话题来和主人聊天。`
      }
    ];

    try {
      const response = await llmClient.chat(messages);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.topic && data.description) {
          memoryStore.recordKnowledgeShared('default', data.topic, data.description);
          return `${data.topic}: ${data.description}`;
        }
      }
    } catch (e) {
      console.error('Failed to generate chat topic:', e);
    }

    return null;
  }

  // Generate daily diary
  async function generateDailyDiary(): Promise<void> {
    await memoryStore.generateDailyDiary(
      'default',
      petStatus.value.name,
      {
        eat: petStatus.value.hunger,
        sleep: petStatus.value.sleep,
        play: petStatus.value.play,
        love: petStatus.value.love,
        chat: petStatus.value.chat,
        learn: petStatus.value.knowledge,
      },
      [] // conversations will be added from memory
    );

    // Check for evolution
    const currentLevel = memoryStore.friendshipLevel;
    const prevLevel = memoryStore.evolutionHistory.length > 0
      ? memoryStore.evolutionHistory[memoryStore.evolutionHistory.length - 1].level
      : 'stranger';

    if (currentLevel !== prevLevel) {
      const changes = getEvolutionChanges(prevLevel, currentLevel);
      await memoryStore.recordEvolution('default', currentLevel, changes);
    }
  }

  function getEvolutionChanges(from: FriendshipLevel, to: FriendshipLevel): string[] {
    const changes: string[] = [];

    if (from === 'stranger' && to === 'acquaintance') {
      changes.push('- 开始更加关心主人的需求');
      changes.push('- 学会了更多的表达方式');
    } else if (from === 'acquaintance' && to === 'friend') {
      changes.push('- 能够理解主人的情绪');
      changes.push('- 主动分享有趣的事情');
    } else if (from === 'friend' && to === 'bestFriend') {
      changes.push('- 完全理解主人的喜好');
      changes.push('- 能够 anticipate 主人的需求');
      changes.push('- 成为真正的最佳朋友');
    }

    return changes;
  }

  // Pet requests fulfillment of urgent needs
  async function requestNeedFulfillment(): Promise<string> {
    const needs = [
      { type: 'eat' as const, value: petStatus.value.hunger },
      { type: 'sleep' as const, value: petStatus.value.sleep },
      { type: 'love' as const, value: petStatus.value.love },
      { type: 'play' as const, value: petStatus.value.play },
      { type: 'chat' as const, value: petStatus.value.chat },
      { type: 'learn' as const, value: petStatus.value.knowledge },
    ];

    const mostUrgent = needs.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    const requests: Record<string, string> = {
      eat: "主人，我饿了，能喂��吃点东西吗？",
      sleep: "主人，我困了，能让我睡一会儿吗？",
      love: "主人，陪我玩一会儿好吗？我好想你！",
      play: "主人，我们来玩个小游戏吧！",
      chat: "主人，我想和你聊聊天，今天有什么有趣的吗？",
      learn: "主人，我想学习新知识，你有什么想和我分享的吗？",
    };

    return requests[mostUrgent.type] || "主人，我需要你的帮助！";
  }

  // Self-care mode
  async function selfCare(): Promise<string> {
    const needs = [
      { type: 'eat' as const, value: petStatus.value.hunger, action: 'feedPet' },
      { type: 'sleep' as const, value: petStatus.value.sleep, action: 'putPetToSleep' },
      { type: 'love' as const, value: petStatus.value.love, action: 'showAffection' },
      { type: 'play' as const, value: petStatus.value.play, action: 'playWithPet' },
    ];

    const mostUrgent = needs.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    const actions: Record<string, string> = {
      feedPet: "我决定去吃点东西，保持体力。",
      putPetToSleep: "我觉得有点累，去休息一会儿。",
      showAffection: "我想去找主人，让他们摸摸我。",
      playWithPet: "我来找点玩具自己玩一会儿。",
    };

    return actions[mostUrgent.action] || "我在照顾好自己，不用担心！";
  }

  onMounted(() => {
    // Start 10-minute interval checks
    needCheckInterval = window.setInterval(() => {
      checkNeeds();
    }, 10 * 60 * 1000);

    // Schedule daily diary generation at 23:59
    const scheduleDailyDiary = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const msUntilMidnight = midnight.getTime() - now.getTime();

      setTimeout(() => {
        generateDailyDiary();
        scheduleDailyDiary();
      }, msUntilMidnight);
    };

    scheduleDailyDiary();

    // Schedule proactive chat every 1-4 hours (check every 30 minutes)
    const scheduleProactiveChat = () => {
      const now = new Date();
      // Check every 30 minutes for a chance to send a message
      setTimeout(() => {
        tryProactiveChat();
        scheduleProactiveChat();
      }, 30 * 60 * 1000);
    };

    scheduleProactiveChat();
  });

  // Try to send a proactive chat message to user
  async function tryProactiveChat(): Promise<void> {
    // Can only chat during daytime (8am-10pm)
    const hour = new Date().getHours();
    if (hour < 8 || hour >= 22) return;

    // Check if we can generate a chat topic (max 1 per hour)
    if (!memoryStore.canGenerateChatTopic()) return;

    const message = await generateChatTopic();
    if (message) {
      // Add to chat history
      const chatMessage = {
        id: generateUUID(),
        senderId: 'default',
        senderName: petStatus.value.name,
        content: message,
        timestamp: new Date().toISOString(),
      };
      chatHistory.value.push(chatMessage);

      // Increase chat and knowledge stats
      petStatus.value.chat = Math.min(100, petStatus.value.chat + 15);
      petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + 10);
      petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 5);

      console.log(`[ProactiveChat] Sent: ${message}`);
    }
  }

  // Start the 10-minute need checks interval
  function startNeedChecks(): void {
    if (needCheckInterval) {
      clearInterval(needCheckInterval);
    }
    needCheckInterval = window.setInterval(() => {
      checkNeeds();
    }, 10 * 60 * 1000); // 10 minutes
  }

  onUnmounted(() => {
    if (needCheckInterval) {
      clearInterval(needCheckInterval);
    }
  });

  return {
    // Original exports
    currentLocation,
    onlinePlayers,
    interactionHistory,
    petBattles,
    chatHistory,
    playerCount,
    interactionCount,
    battleCount,
    chatMessageCount,
    gardenChatHistory,
    gardenChatCount,
    isLoading,
    error,
    loadPetKingdom,
    setLocation,
    interact,
    sendChatMessage,
    challengeBattle,
    getMasterInfo,
    sendGardenMessage,
    greetPlayer,

    // Pet-Chat Integrated System exports
    petStatus,
    petRequest,
    feedPet,
    putPetToSleep,
    playWithPet,
    showAffection,
    chatWithPet,
    learnTopic,
    checkNeeds,
    tryShareKnowledge,
    tryProactiveChat,
    lastShareTime,
    generateChatTopic,
    generateDailyDiary,
    getEvolutionChanges,
    requestNeedFulfillment,
    selfCare,
    startNeedChecks,
  };
});

// Export locations constant for use in components
export { PARADISE_LOCATIONS };
