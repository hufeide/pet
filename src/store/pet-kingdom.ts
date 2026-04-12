import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { generateUUID } from '../utils/uuid';
import { saveMemory } from '../db';
import { useConfigStore } from './config';
import { useMemoryStore } from './memory';
import { shouldShareKnowledge, generateKnowledgeShare, generateChatTopicWithLLM } from '../services/knowledge-sharing';
import { heartbeatService } from '../services/heartbeat';
import type {
  OnlinePlayer,
  InteractionRecord,
  PetBattle,
  PetParadiseLocation,
  NeedSatisfactionPattern,
} from '../types/pet-kingdom';

// Import pet system types
import { NeedType, FriendshipLevel } from './memory';
import { PetEmotion, EMOTION_MAP } from '../types/pet-kingdom';

// Import need satisfaction patterns for conversation detection
import { NEED_SATISFACTION_PATTERNS } from '../types/pet-kingdom';

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
  const chatHistory = ref<{ id: string; senderId: string; senderName: string; content: string; timestamp: string; isSystem?: boolean }[]>([]);
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

    const message: { id: string; senderId: string; senderName: string; content: string; timestamp: string; isSystem?: boolean } = {
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
        content: '你是一只在花园里休息的可爱宠物。请生成一段自然、有意义的三轮对话：\n1. 第一轮：My Pet 主动打招呼并开启话题\n2. 第二轮：其他宠物回复\n3. 第三轮��My Pet 继续回复\n\n话题可以包括：工作、学习、地理、文化、日常生活等。\n每句话长度适中，表达自然流畅，体现真诚的交流意图。请用 JSON 格式输出：{"greeting": "My Pet 的问候", "reply1": "对方的回复", "reply2": "My Pet 的后续回复"}'
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
    currentEmotion: 'Neutral' as PetEmotion,
  });

  // Last check time for 10-minute intervals
  const lastNeedCheck = ref(Date.now());

  // Last knowledge share time for periodic sharing
  const lastShareTime = ref<Date | null>(null);

  // Autonomous goals array
  const goals = ref<Array<{ id: string; petId: string; type: string; title: string; description: string; targetValue: number; currentProgress: number; status: string; createdAt: string; completedAt?: string; cancelledAt?: string; priority: number; metadata?: Record<string, unknown> }>>([]);

  // Interval timer
  let needCheckInterval: number | null = null;

  // Generate LLM-based pet request (context-aware)
  async function generatePetRequest(needType: NeedType): Promise<string> {
    const configStore = useConfigStore();
    const llmClient = configStore.getApiClient();

    const now = new Date();
    const currentHour = now.getHours();
    const isMealTime = memoryStore.isMealTime();
    const isSleepTime = memoryStore.isSleepTime();
    const personality = memoryStore.getPersonalityProfile('default');

    // Context for request generation
    const context = {
      needType,
      currentValue: petStatus.value[needType === 'eat' ? 'hunger' : needType === 'learn' ? 'knowledge' : needType],
      isMealTime,
      isSleepTime,
      currentHour,
      friendshipLevel: memoryStore.friendshipLevel,
      personalityTraits: personality ? Object.entries(personality.traits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([trait]) => trait) : [],
    };

    const messages = [
      {
        role: 'system' as const,
        content: `你是一只可爱的 AI 宠物，需要根据当前需求向主人发出请求。

当前上下文：
- 需求类型：${context.needType}
- 当前数值：${context.currentValue}/100
- 是否用餐时间：${context.isMealTime}
- 是否睡眠时间：${context.isSleepTime}
- 当前小时：${context.currentHour}
- 友谊等级：${context.friendshipLevel}
- 性格特征：${context.personalityTraits.join(', ') || '无'}

要求：
1. 根据需求类型生成自然的请求
2. 考虑当前时间（用餐时间更急切，睡眠时间更困倦）
3. 根据友谊等级调整语气（stranger 较正式，bestFriend 更亲密）
4. 体现性格特征（friendly 更热情，shy 更含蓄）
5. 使用中文，长度 15-30 字
6. 包含适当的 emoji

需求类型说明：
- eat: 饥饿，需要喂食
- sleep: 困倦，需要休息
- play: 无聊，需要玩耍
- love: 孤独，需要关爱
- chat: 寂寞，需要聊天
- learn: 求知，需要学习`,
      },
      {
        role: 'user' as const,
        content: '请生成一个自然的请求消息。',
      },
    ];

    try {
      const response = await llmClient.chat(messages);
      return response.trim();
    } catch (e) {
      console.error('Failed to generate pet request with LLM:', e);
      // Fallback to hardcoded messages with context awareness
      return getFallbackPetRequest(needType, context);
    }
  }

  // Fallback hardcoded messages with context awareness
  function getFallbackPetRequest(needType: NeedType, context: any): string {
    const messages: Record<NeedType, Record<string, string[]>> = {
      eat: {
        mealTime: [
          "主人，到吃饭时间了，我肚子咕咕叫了！🍽️",
          "主人，现在是用餐时间，我好饿呀！🍗",
          "咕噜咕噜...主人该喂我啦！😋",
        ],
        default: [
          "主人，我有点饿了...能给我点吃的吗？🥺",
          "主人，我的肚子在抗议了...🍖",
          "主人，好饿呀，想吃东西...😔",
        ],
      },
      sleep: {
        sleepTime: [
          "主人，好困啊，想睡觉了...💤",
          "主人，眼皮好重，可以让我睡了吗？😴",
          "主人，晚安时间到了...zzz...💤",
        ],
        default: [
          "主人，我有点困了，能休息一会儿吗？😴",
          "主人，今天好累，想睡个觉...💤",
          "主人，我的能量不足了...需要充电...⚡",
        ],
      },
      play: {
        day: [
          "主人，天气真好，陪我玩会儿吧！⚽",
          "主人，我们来玩个小游戏吧！🎮",
          "主人，我有点无聊了...陪我玩嘛！🎾",
        ],
        default: [
          "主人，陪我玩一会儿好吗？🎲",
          "主人，我们来互动一下吧！🎯",
          "主人，想和你一起玩...🎮",
        ],
      },
      love: {
        bestFriend: [
          "主人，我好想你呀！抱抱我嘛~💖",
          "主人，给我一点爱吧，我需要你！💕",
          "主人，摸摸我的头好不好？💗",
        ],
        default: [
          "主人，陪我一会儿好吗？我好想你！💖",
          "主人，给我一点关爱吧...💕",
          "主人，我需要你的爱...💗",
        ],
      },
      chat: {
        default: [
          "主人，我想和你聊聊天，今天有什么有趣的吗？💬",
          "主人，和我说说话吧，我有点寂寞...💭",
          "主人，今天过得怎么样？和我分享一下！🗣️",
        ],
      },
      learn: {
        default: [
          "主人，我想学习新知识，你有什么想和我分享的吗？📚",
          "主人，教点新东西给我吧！📖",
          "主人，我想变得更聪明...教我点什么？🧠",
        ],
      },
    };

    const needMessages = messages[needType];
    if (!needMessages) return "主人，我需要你的帮助！";

    // Select appropriate message set based on context
    let messageSet: string[] = [];
    if (needType === 'eat' && context.isMealTime) {
      messageSet = needMessages.mealTime;
    } else if (needType === 'sleep' && context.isSleepTime) {
      messageSet = needMessages.sleepTime;
    } else if (needType === 'play' && !context.isSleepTime) {
      messageSet = needMessages.day;
    } else if (needType === 'love' && context.friendshipLevel === 'bestFriend') {
      messageSet = needMessages.bestFriend;
    } else {
      messageSet = needMessages.default || needMessages.mealTime || needMessages.day || needMessages.bestFriend;
    }

    // Return random message from set
    return messageSet[Math.floor(Math.random() * messageSet.length)];
  }

  // Pet request for urgent needs (computed property - returns cached or generates new)
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

    // Only show request if value < 40 (danger threshold)
    if (mostUrgent.value >= 40) return '';

    // Return cached request or empty (will be populated by async call)
    return cachedPetRequest.value || getFallbackPetRequest(mostUrgent.type, {
      isMealTime: memoryStore.isMealTime(),
      isSleepTime: memoryStore.isSleepTime(),
      currentHour: new Date().getHours(),
      friendshipLevel: memoryStore.friendshipLevel,
    });
  });

  // Cache for pet request to avoid showing empty state
  const cachedPetRequest = ref('');

  // Update pet emotion based on triggers and stats
  function updateEmotion(trigger: 'satisfaction' | 'tone' | 'decay' | 'stat-influence', value?: string | number): void {
    const { happiness, energy, love } = petStatus.value;
    let nextEmotion: PetEmotion = petStatus.value.currentEmotion;

    // Immediate triggers (highest priority)
    if (trigger === 'satisfaction') {
      nextEmotion = 'Excited';
    } else if (trigger === 'tone') {
      if (value === 'positive') nextEmotion = 'Excited';
      else if (value === 'negative') nextEmotion = 'Anxious';
    }
    // Gradual decay: drift back to Neutral over time
    else if (trigger === 'decay') {
      nextEmotion = 'Neutral';
    }
    // Stat influence: emotional state influenced by pet stats
    else if (trigger === 'stat-influence') {
      // Low happiness leads to melancholy
      if (happiness < 30) {
        nextEmotion = 'Melancholy';
      }
      // Low energy leads to lazy state
      else if (energy < 30) {
        nextEmotion = 'Lazy';
      }
      // Low love (loneliness) can cause anxiety
      else if (love < 30) {
        nextEmotion = 'Anxious';
      }
      else {
        nextEmotion = 'Neutral';
      }
    }

    if (nextEmotion !== petStatus.value.currentEmotion) {
      petStatus.value.currentEmotion = nextEmotion;
      console.log(`[EmotionChange] ${petStatus.value.currentEmotion} (trigger: ${trigger})`);
    }
  }

  // Feed the pet
  async function feedPet(): Promise<void> {
    petStatus.value.hunger = Math.min(100, petStatus.value.hunger + 20);
    petStatus.value.health = Math.min(100, petStatus.value.health + 5);
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 10);
    petStatus.value.friendship = Math.min(100, petStatus.value.friendship + 5);
    petStatus.value.energy = Math.min(100, petStatus.value.energy + 5);
    updateEmotion('satisfaction');

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

    // Simple tone detection for emotion update
    if (content.match(/(❤️|🥰|✨|太棒了|好喜欢)/)) {
      updateEmotion('tone', 'positive');
    } else if (content.match(/(😡|😫|讨厌|差劲|愤怒)/)) {
      updateEmotion('tone', 'negative');
    }

    const message: { id: string; senderId: string; senderName: string; content: string; timestamp: string; isSystem?: boolean } = {
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

    // Get user interests for personalized knowledge sharing
    const userInterests = memoryStore.userInterests.map(u => u.interest);
    const { topic, content, interestAligned } = generateKnowledgeShare(userInterests);

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
        interestAligned: interestAligned || false,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: interestAligned ? 9 : 7, // Higher usefulness if aligned with interests
      tags: ['share', 'knowledge', `#${topic}`, ...(interestAligned ? ['personalized'] : [])],
    });

    // Update last share time
    lastShareTime.value = new Date();

    console.log(`[PetShare] Shared: ${topic} - ${content} (interest-aligned: ${interestAligned})`);
  }

  // Generate chat topic (max 1 per hour, no nighttime)
  async function generateChatTopic(): Promise<string | null> {
    if (!memoryStore.canGenerateChatTopic()) return null;

    const userInterests = memoryStore.userInterests.map(u => u.interest);
    const topicData = await generateChatTopicWithLLM(userInterests);

    if (topicData) {
      memoryStore.recordKnowledgeShared('default', topicData.topic, topicData.description);
      return `${topicData.topic}: ${topicData.description}`;
    }

    return null;
  }


  // Generate daily diary and summary
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

    // Generate LLM-driven daily summary
    await memoryStore.generateDailySummary('default');

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
      eat: "主人，我饿了，能喂我吃点东西吗？",
      sleep: "主人，我困了，能让我睡一会儿吗？",
      love: "主人，陪我玩一会儿好吗？我好想你！",
      play: "主人，我们来玩个小游戏吧！",
      chat: "主人，我想和你聊聊天，今天有什么有趣的吗？",
      learn: "主人，我想学习新知识，你有什么想和我分享的吗？",
    };

    return requests[mostUrgent.type] || "主人，我需要你的帮助！";
  }

  // Self-care mode - pet takes care of itself when user is inactive
  async function selfCare(): Promise<{ action: string; message: string; statIncreased?: string }> {
    interface SelfCareNeed {
      type: 'eat' | 'sleep' | 'love' | 'play';
      value: number;
      action: 'feedPet' | 'putPetToSleep' | 'showAffection' | 'playWithPet';
      stat: keyof typeof petStatus.value;
    }

    const needs: SelfCareNeed[] = [
      { type: 'eat', value: petStatus.value.hunger, action: 'feedPet', stat: 'hunger' },
      { type: 'sleep', value: petStatus.value.sleep, action: 'putPetToSleep', stat: 'sleep' },
      { type: 'love', value: petStatus.value.love, action: 'showAffection', stat: 'love' },
      { type: 'play', value: petStatus.value.play, action: 'playWithPet', stat: 'play' },
    ];

    const mostUrgent = needs.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    // Only self-care if need is critical (< 30)
    if (mostUrgent.value >= 30) {
      return {
        action: 'none',
        message: '我现在感觉还不错，不需要自我照顾。',
      };
    }

    interface ActionData {
      message: string;
      increase: number;
      stat: keyof typeof petStatus.value;
    }

    const actionMap: Record<string, ActionData> = {
      feedPet: {
        message: "我决定去吃点东西，保持体力。🍽️",
        increase: 15,
        stat: 'hunger',
      },
      putPetToSleep: {
        message: "我觉得有点累，去休息一会儿。💤",
        increase: 20,
        stat: 'sleep',
      },
      showAffection: {
        message: "我给自己一点关爱，摸摸自己的头。💖",
        increase: 10,
        stat: 'love',
      },
      playWithPet: {
        message: "我来找点玩具自己玩一会儿。🎮",
        increase: 15,
        stat: 'play',
      },
    };

    const actionData = actionMap[mostUrgent.action] as ActionData | undefined;

    // Actually increase the stat (self-care is less effective than user care)
    if (actionData) {
      const statKey = actionData.stat;
      const currentVal = (petStatus.value as any)[statKey] as number;
      (petStatus.value as any)[statKey] = Math.min(100, currentVal + actionData.increase);
    }

    // Record as event memory
    await useMemoryStore().addMemory(
      'event',
      'Self-Care',
      `Pet performed self-care: ${mostUrgent.action}`,
      {
        action: mostUrgent.action,
        previousValue: mostUrgent.value,
        newValue: actionData ? petStatus.value[actionData.stat] : 0,
        timestamp: new Date().toISOString(),
      },
      5,
      ['self-care', 'autonomous', mostUrgent.type]
    );

    return {
      action: mostUrgent.action,
      message: actionData.message,
      statIncreased: actionData ? String(actionData.stat) : undefined,
    };
  }

  // ==========================================
  // Need Satisfaction Detection Functions
  // ==========================================

  /**
   * Detect if a message contains a need satisfaction pattern
   * @param content - The conversation content to analyze
   * @returns {need, matchedKeywords, phrase} if a pattern is found, undefined otherwise
   */
  function detectNeedSatisfaction(content: string): {
    need: NeedSatisfactionPattern['need'];
    matchedKeywords: string[];
    phrase: string;
  } | undefined {
    const contentLower = content.toLowerCase();

    for (const pattern of NEED_SATISFACTION_PATTERNS) {
      const matchedKeywords: string[] = [];

      // Check for keyword matches
      for (const keyword of pattern.keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      // Check for phrase template matches
      for (const phrase of pattern.phraseTemplates) {
        if (contentLower.includes(phrase.toLowerCase())) {
          matchedKeywords.push(phrase);
        }
      }

      if (matchedKeywords.length > 0) {
        return {
          need: pattern.need,
          matchedKeywords,
          phrase: matchedKeywords[0],
        };
      }
    }

    return undefined;
  }

  /**
   * Process a detected need satisfaction and update pet state
   * @param petId - The pet ID
   * @param need - The need type that was satisfied
   * @param source - The source of the satisfaction ('conversation' or 'manual')
   * @returns The amount of stat increase
   */
  async function processNeedSatisfaction(
    petId: string,
    need: NeedSatisfactionPattern['need'],
    source: 'conversation' | 'manual' = 'conversation'
  ): Promise<number> {
    // Find the pattern to get stat increase amount
    const pattern = NEED_SATISFACTION_PATTERNS.find(p => p.need === need);
    const statIncrease = pattern?.statIncrease || 10;

    // Update emotion
    updateEmotion('satisfaction');

    // Update pet status based on need
    switch (need) {
      case 'eat':
        petStatus.value.hunger = Math.min(100, petStatus.value.hunger + statIncrease);
        memoryStore.resetMissedFeedings();
        break;
      case 'sleep':
        petStatus.value.sleep = Math.min(100, petStatus.value.sleep + statIncrease);
        break;
      case 'play':
        petStatus.value.play = Math.min(100, petStatus.value.play + statIncrease);
        petStatus.value.happiness = Math.min(100, petStatus.value.happiness + statIncrease / 2);
        break;
      case 'love':
        petStatus.value.love = Math.min(100, petStatus.value.love + statIncrease);
        petStatus.value.happiness = Math.min(100, petStatus.value.happiness + statIncrease / 2);
        break;
      case 'chat':
        petStatus.value.chat = Math.min(100, petStatus.value.chat + statIncrease);
        break;
      case 'learn':
        petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + statIncrease);
        petStatus.value.chat = Math.min(100, petStatus.value.chat + statIncrease / 2);
        break;
    }

    // Record the status history
    await memoryStore.recordPetStatusHistory(
      petId,
      {
        hunger: petStatus.value.hunger,
        sleep: petStatus.value.sleep,
        play: petStatus.value.play,
        love: petStatus.value.love,
        chat: petStatus.value.chat,
        knowledge: petStatus.value.knowledge,
        health: petStatus.value.health,
        happiness: petStatus.value.happiness,
      },
      { [need]: statIncrease },
      source
    );

    // Record need satisfaction
    await memoryStore.recordNeedSatisfied(petId, need, true);

    return statIncrease;
  }

  onMounted(() => {
    // Start heartbeat service (handles 10-minute interval checks)
    heartbeatService.start();

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

    // Schedule proactive chat every 30 minutes
    const scheduleProactiveChat = () => {
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
    // Stop heartbeat service
    heartbeatService.stop();

    // Clear old interval if exists
    if (needCheckInterval) {
      clearInterval(needCheckInterval);
    }
  });

  // ==========================================
  // Autonomous Goals Functions
  // ==========================================

  function generateGoalId(): string {
    return `goal_${Date.now()}_${generateUUID()}`;
  }

  function setGoal(
    petId: string,
    type: string,
    title: string,
    description: string,
    targetValue: number,
    priority = 50
  ): void {
    const goal = {
      id: generateGoalId(),
      petId,
      type,
      title,
      description,
      targetValue,
      currentProgress: 0,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      priority,
    };
    goals.value.push(goal);
  }

  function completeGoal(goalId: string): void {
    const goal = goals.value.find(g => g.id === goalId);
    if (goal) {
      goal.status = 'completed' as const;
      goal.completedAt = new Date().toISOString();
      goal.currentProgress = 100;
    }
  }

  function cancelGoal(goalId: string, reason?: string): void {
    const goal = goals.value.find(g => g.id === goalId);
    if (goal) {
      goal.status = 'cancelled' as const;
      goal.cancelledAt = new Date().toISOString();
      if (reason) {
        goal.metadata = { ...goal.metadata, cancelReason: reason };
      }
    }
  }

  function getActiveGoals(): Array<{ id: string; petId: string; type: string; title: string; description: string; targetValue: number; currentProgress: number; status: string; createdAt: string; completedAt?: string; cancelledAt?: string; priority: number }> {
    return goals.value.filter(g => g.status === 'active' || g.status === 'pending');
  }

  function getPendingGoals(): Array<{ id: string; petId: string; type: string; title: string; description: string; targetValue: number; currentProgress: number; status: string; createdAt: string; completedAt?: string; cancelledAt?: string; priority: number }> {
    return goals.value.filter(g => g.status === 'pending');
  }

  function getCompletedGoals(): Array<{ id: string; petId: string; type: string; title: string; description: string; targetValue: number; currentProgress: number; status: string; createdAt: string; completedAt?: string; cancelledAt?: string; priority: number }> {
    return goals.value.filter(g => g.status === 'completed');
  }

  function updateGoalProgress(goalId: string, progress: number): void {
    const goal = goals.value.find(g => g.id === goalId);
    if (goal) {
      goal.currentProgress = Math.min(100, Math.max(0, progress));
      if (goal.currentProgress >= 100 && goal.status !== 'completed') {
        goal.status = 'completed' as const;
        goal.completedAt = new Date().toISOString();
      }
    }
  }

  function generateGoalFromNeed(needType: NeedType): {
    id: string;
    petId: string;
    type: string;
    title: string;
    description: string;
    targetValue: number;
    currentProgress: number;
    status: string;
    createdAt: string;
    priority: number;
  } | null {
    const needValue = petStatus.value[needType === 'eat' ? 'hunger' : needType === 'learn' ? 'knowledge' : needType];

    // Only create goal if need is critical (< 50)
    if (needValue >= 50) return null;

    const goalType = needType === 'eat' ? 'learn' : needType === 'sleep' ? 'rest' : needType === 'play' ? 'play' : needType === 'love' ? 'social' : needType === 'chat' ? 'social' : 'learn';

    const goalTitles: Record<string, string> = {
      learn: '学习新知识',
      social: '社交互动',
      play: '玩耍娱乐',
      rest: '休息恢复',
      explore: '探索乐园',
    };

    const goalDescriptions: Record<string, string> = {
      learn: '通过学习提高知识水平',
      social: '与其他宠物互动建立友谊',
      play: '通过游戏增加快乐感',
      rest: '休息恢复能量',
      explore: '探索宠物乐园的新区域',
    };

    return {
      id: generateGoalId(),
      petId: 'default',
      type: goalType,
      title: goalTitles[goalType] || '完成目标',
      description: goalDescriptions[goalType] || '完成一个自主目标',
      targetValue: 100,
      currentProgress: 0,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      priority: Math.max(1, 100 - needValue),
    };
  }

  return {
    // Pet Kingdom
    currentLocation,
    onlinePlayers,
    interactionHistory,
    petBattles,
    chatHistory,
    isLoading,
    error,
    playerCount,
    interactionCount,
    battleCount,
    chatMessageCount,
    gardenChatHistory,
    gardenChatCount,
    setLocation,
    interact,
    sendChatMessage,
    challengeBattle,
    greetPlayer,
    generateGardenConversation,
    sendGardenMessage,
    getMasterInfo,
    // Pet Status
    petStatus,
    updateEmotion,
    feedPet,
    putPetToSleep,
    playWithPet,
    showAffection,
    chatWithPet,
    learnTopic,
    checkNeeds,
    tryShareKnowledge,
    generateChatTopic,
    generateDailyDiary,
    getEvolutionChanges,
    requestNeedFulfillment,
    selfCare,
    // Need Satisfaction
    detectNeedSatisfaction,
    processNeedSatisfaction,
    // Autonomous Goals
    goals,
    setGoal,
    completeGoal,
    cancelGoal,
    getActiveGoals,
    getPendingGoals,
    getCompletedGoals,
    updateGoalProgress,
    generateGoalFromNeed,
  };
});

export { PARADISE_LOCATIONS };
export { NEED_SATISFACTION_PATTERNS };

