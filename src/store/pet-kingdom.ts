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
    console.log('[PetParadise] loadPetKingdom called');
    isLoading.value = true;
    error.value = null;

    try {
      // Get user's pet info - ensure we have valid data
      const petName = petStatus.value?.name || '我的宠物';
      const petLevel = petStatus.value?.level || 1;

      console.log('[PetParadise] My pet info:', petName, 'Lv.', petLevel);

      // Always add the player's own pet first
      const myPet: OnlinePlayer = {
        playerId: 'default',
        petId: 'default',
        name: petName,
        level: petLevel,
        position: { x: 50, y: 50 },
        lastUpdate: Date.now(),
      };

      // Try to generate AI-powered pets using LLM
      console.log('[PetParadise] Generating AI pets...');
      const aiPets = await generateAIPets();
      console.log('[PetParadise] AI pets generated:', aiPets.length, aiPets);

      // Set online players
      onlinePlayers.value = [myPet, ...aiPets];
      console.log('[PetParadise] onlinePlayers.value set:', onlinePlayers.value.length);
      console.log('[PetParadise] onlinePlayers.value:', JSON.stringify(onlinePlayers.value));

      // 加载聊天历史
      chatHistory.value = [
        { id: 'msg1', senderId: 'p1', senderName: '小熊贝贝', content: '大家好！今天天气真好！', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'msg2', senderId: 'p2', senderName: '小兔白白', content: '欢迎新朋友！', timestamp: new Date(Date.now() - 3500000).toISOString() },
      ];

      isLoading.value = false;
      console.log('[PetParadise] loadPetKingdom completed, playerCount:', onlinePlayers.value.length);
    } catch (err) {
      console.error('[PetParadise] loadPetKingdom error:', err);
      error.value = `Failed to load pet kingdom: ${err}`;
      isLoading.value = false;
    }
  }

  // Generate AI-powered pets using LLM when no real players are online
  async function generateAIPets(): Promise<OnlinePlayer[]> {
    const baseLocations = [
      { x: 48, y: 52 },
      { x: 52, y: 48 },
      { x: 49, y: 51 },
      { x: 45, y: 55 },
      { x: 55, y: 45 },
    ];

    // Fallback pets - always available
    const fallbackPets: OnlinePlayer[] = [
      { playerId: 'p1', petId: 'pet_1', name: '小熊贝贝', level: 5, position: { x: baseLocations[0].x + Math.random() * 6 - 3, y: baseLocations[0].y + Math.random() * 6 - 3 }, lastUpdate: Date.now(), personality: '热情开朗，喜欢交朋友' },
      { playerId: 'p2', petId: 'pet_2', name: '小兔白白', level: 8, position: { x: baseLocations[1].x + Math.random() * 6 - 3, y: baseLocations[1].y + Math.random() * 6 - 3 }, lastUpdate: Date.now(), personality: '温柔可爱，喜欢安静' },
      { playerId: 'p3', petId: 'pet_3', name: '小鸟飞飞', level: 3, position: { x: baseLocations[2].x + Math.random() * 6 - 3, y: baseLocations[2].y + Math.random() * 6 - 3 }, lastUpdate: Date.now(), personality: '活泼好动，充满好奇心' },
    ];

    try {
      const configStore = useConfigStore();
      const llmClient = configStore.getApiClient();

      const messages: { role: 'system' | 'user'; content: string }[] = [
        {
          role: 'system',
          content: `你是一个宠物角色生成器。请生成3-5个独特的AI宠物角色，每个宠物需要有：
1. 名字（可爱、有个性，中文名字）
2. 种类（如：小熊、小兔、小鸟、小猫、小狗等）
3. 等级（1-15之间的随机数）
4. 性格描述（1-2句话，体现宠物特点）

请用JSON数组格式输出，每个宠物对象包含：name, species, level, personality
示例：[{"name": "小熊贝贝", "species": "小熊", "level": 5, "personality": "热情开朗，喜欢交朋友"}]`,
        },
        {
          role: 'user',
          content: '请生成3-5个独特的AI宠物角色，用于宠物乐园场景。',
        },
      ];

      const response = await llmClient.chat(messages);

      // 解析JSON响应
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const pets = JSON.parse(jsonMatch[0]);

        if (Array.isArray(pets) && pets.length > 0) {
          console.log('[PetParadise] Generated AI pets:', pets.length);
          return pets.map((pet: { name: string; species: string; level: number; personality: string }, index: number) => ({
            playerId: `ai_pet_${index + 1}`,
            petId: `ai_pet_${index + 1}`,
            name: pet.name,
            level: pet.level || Math.floor(Math.random() * 10) + 1,
            position: {
              x: baseLocations[index % baseLocations.length].x + Math.random() * 6 - 3,
              y: baseLocations[index % baseLocations.length].y + Math.random() * 6 - 3,
            },
            lastUpdate: Date.now(),
            personality: pet.personality,
          }));
        }
      }
      console.log('[PetParadise] LLM response invalid, using fallback pets');
    } catch (e) {
      console.error('[PetParadise] Failed to generate AI pets:', e);
    }

    // Return fallback pets
    console.log('[PetParadise] Using fallback pets');
    return fallbackPets;
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
      tags: ['love', 'social'],
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

      console.log('[PetParadise] Greeting player:', otherPlayer.name);

      // 使用 LLM 生成打招呼和两轮有意义的对话
      const conversation = await generateGardenConversation(otherPlayer);
      console.log('[PetParadise] Generated conversation:', conversation);

      // 添加打招呼
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'default',
        senderName: petStatus.value.name,
        content: conversation.greeting,
        timestamp: new Date().toISOString(),
      });
      console.log('[PetParadise] Added greeting, history length:', gardenChatHistory.value.length);

      // 添加对方回答
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: playerId,
        senderName: otherPlayer.name,
        content: conversation.reply1,
        timestamp: new Date().toISOString(),
      });
      console.log('[PetParadise] Added reply1, history length:', gardenChatHistory.value.length);

      // 添加第二轮对话
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'default',
        senderName: petStatus.value.name,
        content: conversation.reply2,
        timestamp: new Date().toISOString(),
      });

      // 添加第三轮对话（对方继续回复）
      if (conversation.reply3) {
        gardenChatHistory.value.push({
          id: generateUUID(),
          senderId: playerId,
          senderName: otherPlayer.name,
          content: conversation.reply3,
          timestamp: new Date().toISOString(),
        });
      }
      console.log('[PetParadise] Final history length:', gardenChatHistory.value.length);

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
        content: `Greeting: ${conversation.greeting}\n${otherPlayer.name}: ${conversation.reply1}\n${petStatus.value.name}: ${conversation.reply2}${conversation.reply3 ? `\n${otherPlayer.name}: ${conversation.reply3}` : ''}`,
        metadata: {
          greeting: conversation.greeting,
          reply1: conversation.reply1,
          reply2: conversation.reply2,
          reply3: conversation.reply3,
          withPlayer: otherPlayer.name,
          withPlayerPersonality: otherPlayer.personality,
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

  // 生成花园对话（打招呼 + 多轮有意义的对话）
  async function generateGardenConversation(otherPlayer: OnlinePlayer): Promise<{ greeting: string; reply1: string; reply2: string; reply3?: string }> {
    const configStore = useConfigStore();
    const llmClient = configStore.getApiClient();

    // 获取宠物和主人的上下文信息
    const myPetName = petStatus.value.name;
    const myPetLevel = petStatus.value.level;
    const myPetEnergy = petStatus.value.energy;
    const myPetHappiness = petStatus.value.happiness;

    // 获取主人的兴趣和偏好
    const userInterests = memoryStore.userInterests.map(u => u.interest).slice(0, 5);
    const personalityProfile = memoryStore.getPersonalityProfile('default');
    const topTraits = personalityProfile
      ? Object.entries(personalityProfile.traits)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([trait]) => trait)
      : [];

    // 其他宠物的信息
    const otherPetName = otherPlayer.name;
    const otherPetLevel = otherPlayer.level;
    const otherPetPersonality = otherPlayer.personality || '友善热情';

    // 根据宠物状态选择话题
    const topicOptions = [
      { topic: '今天天气', emoji: '☀️' },
      { topic: '最近学的知识', emoji: '📚' },
      { topic: '玩耍的趣事', emoji: '🎮' },
      { topic: '主人的事情', emoji: '👤' },
      { topic: '冒险经历', emoji: '⚔️' },
    ];

    // 根据宠物状态选择开场话题
    let suggestedTopic = '今天天气真好啊';
    if (myPetEnergy < 40) {
      suggestedTopic = '我有点累了，想休息一下';
    } else if (myPetHappiness > 80) {
      suggestedTopic = '今天心情特别好！';
    } else if (userInterests.length > 0) {
      suggestedTopic = `我主人对${userInterests[0]}很感兴趣`;
    }

    const systemPrompt = `你是宠物乐园里的一个AI宠物对话生成器。你的任务是根据两只宠物的特点生成自然、有趣的对话。

【我的宠物信息】
- 名字：${myPetName}
- 等级：${myPetLevel}
- 能量状态：${myPetEnergy}%
- 快乐程度：${myPetHappiness}%
- 主人兴趣：${userInterests.length > 0 ? userInterests.join('、') : '暂无记录'}
- 性格特点：${topTraits.length > 0 ? topTraits.join('、') : '友善'}

【对方宠物信息】
- 名字：${otherPetName}
- 等级：${otherPetLevel}
- 性格：${otherPetPersonality}

【对话要求】
1. 对话要自然流畅，符合宠物性格
2. 话题要有趣，可以涉及：日常生活、学习、玩耍、天气、主人、冒险等
3. 每条消息长度适中（15-40字）
4. 体现两只宠物的不同性格特点
5. 可以适当加入emoji增加趣味性
6. 对方宠物的回复要符合其性格设定

请用JSON格式输出4轮对话：
{
  "greeting": "My Pet的开场问候和话题开启",
  "reply1": "对方宠物的回应",
  "reply2": "My Pet的继续对话",
  "reply3": "对方宠物的最终回应"
}`;

    const userPrompt = `请生成${myPetName}和${otherPetName}在花园里的对话。${otherPetName}是一只${otherPetPersonality}的宠物。

开场话题建议：${suggestedTopic}`;

    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    try {
      const response = await llmClient.chat(messages);

      // 解析 JSON 响应
      try {
        // 尝试从响应中提取 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.greeting && data.reply1 && data.reply2 && data.reply3) {
            return {
              greeting: data.greeting.trim(),
              reply1: data.reply1.trim(),
              reply2: data.reply2.trim(),
              reply3: data.reply3.trim(),
            };
          }
        }
        throw new Error('Invalid JSON structure');
      } catch (e) {
        console.error('Parse conversation JSON failed:', e);
        // Fallback to default conversation
        return generateFallbackConversation(myPetName, otherPetName, otherPetPersonality);
      }
    } catch (err) {
      console.error('Generate garden conversation failed:', err);
      // Fallback to default conversation
      return generateFallbackConversation(myPetName, otherPetName, otherPetPersonality);
    } finally {
      isLoading.value = false;
    }
  }

  // 生成默认对话（当 LLM 不可用时使用）
  function generateFallbackConversation(myPetName: string, otherPetName: string, otherPersonality: string): { greeting: string; reply1: string; reply2: string; reply3: string } {
    const greetings = [
      `你好呀，${otherPetName}！今天天气真好呢~`,
      `嗨，${otherPetName}！见到你真开心！`,
      `${otherPetName}，你好！最近怎么样？`,
    ];
    const responses = [
      `你好，${myPetName}！我也很高兴见到你！${otherPersonality}的我最喜欢交朋友了~`,
      `哇，是${myPetName}呀！我听说你很厉害呢！`,
      `嘿！${myPetName}，我们一起玩吧！`,
    ];
    const continuations = [
      `当然可以呀！我们可以聊聊最近学到的新知识~`,
      `好呀好呀！说说看~`,
      `嗯嗯，我也很想听你说说！`,
    ];
    const finalResponses = [
      `太好了！那我们开始吧！🌟`,
      `好的！我已经迫不及待了！✨`,
      `太棒了！开始吧~ 🎉`,
    ];

    const randomIndex = Math.floor(Math.random() * greetings.length);
    return {
      greeting: greetings[randomIndex],
      reply1: responses[randomIndex],
      reply2: continuations[randomIndex],
      reply3: finalResponses[randomIndex],
    };
  }

  // 花园发送消息
  async function sendGardenMessage(content: string): Promise<void> {
    if (!content.trim()) return;

    // 添加到花园聊天记录
    gardenChatHistory.value.push({
      id: generateUUID(),
      senderId: 'default',
      senderName: petStatus.value.name,
      content: content.trim(),
      timestamp: new Date().toISOString(),
    });

    // 增加聊天计数
    gardenChatCount.value++;

    // 生成 AI 响应
    await generateGardenReply(content);
  }

  // 生成花园聊天的 AI 回复
  async function generateGardenReply(userMessage: string): Promise<void> {
    const configStore = useConfigStore();
    const llmClient = configStore.getApiClient();

    // 获取当前选中的宠物（如果有）
    const selectedPlayer = onlinePlayers.value.find(p => p.playerId !== 'default');
    const otherPetName = selectedPlayer?.name || '小熊贝贝';
    const otherPersonality = selectedPlayer?.personality || '友善热情';

    // 获取最近的聊天历史
    const recentMessages = gardenChatHistory.value.slice(-6).map(m => ({
      role: m.senderId === 'default' ? 'user' : 'assistant',
      content: `${m.senderName}: ${m.content}`,
    }));

    const systemPrompt = `你是宠物乐园花园里的一个AI宠物（${otherPetName}）。你的性格是：${otherPersonality}。

请用自然的宠物语气回复用户的消息。回复要简短（15-30字），有趣，可以适当加入emoji。

要求：
1. 像宠物一样说话，活泼可爱
2. 回复要简短有趣
3. 可以对用户的话题做出回应
4. 适当加入emoji增加趣味性`;

    const userPrompt = `用户（${petStatus.value.name}）说：${userMessage}

请以${otherPetName}的身份回复。`;

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await llmClient.chat(messages);
      console.log('[PetParadise] AI reply:', response);

      // 添加 AI 回复到聊天记录
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'ai_pet',
        senderName: otherPetName,
        content: response.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[PetParadise] Generate reply failed:', err);
      // 添加默认回复
      const defaultReplies = [
        '嗯嗯，我听到了！🐾',
        '真的吗？好有趣呀！✨',
        '哈哈，太好玩了！🎮',
        '我也很喜欢聊天呢~ 💬',
        '说得好有道理！👍',
      ];
      gardenChatHistory.value.push({
        id: generateUUID(),
        senderId: 'ai_pet',
        senderName: otherPetName,
        content: defaultReplies[Math.floor(Math.random() * defaultReplies.length)],
        timestamp: new Date().toISOString(),
      });
    }
  }

  function getMasterInfo(): string {
    return `My Pet - Level 1. I'm learning and growing every day!`;
  }

  // ==========================================
  // Pet-Chat Integrated System Functions
  // ==========================================

  // Pet status state - 4 core needs only
  const petStatus = ref({
    name: 'My Pet',
    level: 1,
    friendship: 50,
    health: 100,
    happiness: 100,
    energy: 100,      // 0-100 (100 = energetic)
    play: 100,        // 0-100 (100 = entertained)
    love: 100,        // 0-100 (100 = loved)
    knowledge: 50,    // 0-100 (100 = well-learned)
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
      currentValue: petStatus.value[needType === 'learn' ? 'knowledge' : needType],
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
      energy: {
        default: [
          "主人，我有点累了，能休息一下吗？⚡",
          "主人，我的能量不足了...需要充电...🔋",
          "主人，想休息一会儿...💤",
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
    if (needType === 'energy') {
      messageSet = needMessages.default;
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
      { type: 'energy' as const, value: petStatus.value.energy },
      { type: 'play' as const, value: petStatus.value.play },
      { type: 'love' as const, value: petStatus.value.love },
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

  // Restore pet energy (combines feed and sleep)
  async function restoreEnergy(): Promise<void> {
    petStatus.value.energy = Math.min(100, petStatus.value.energy + 30);
    petStatus.value.health = Math.min(100, petStatus.value.health + 5);
    petStatus.value.happiness = Math.min(100, petStatus.value.happiness + 5);
    petStatus.value.friendship = Math.min(100, petStatus.value.friendship + 3);
    updateEmotion('satisfaction');

    await saveMemory({
      id: generateUUID(),
      petId: 'default',
      type: 'interaction' as const,
      title: 'Pet Restored Energy',
      content: 'Pet energy was restored',
      metadata: {
        energyIncreased: 30,
        healthIncreased: 5,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      usefulness: 8,
      tags: ['rest', 'care'],
    });

    await memoryStore.recordNeedSatisfied('default', 'energy', true);
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

    // Chat increases love (social connection) and knowledge
    petStatus.value.love = Math.min(100, petStatus.value.love + 5);
    petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + 3);
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
      tags: ['love', 'social'],
    });

    await memoryStore.recordNeedSatisfied('default', 'love', true);
  }

  // Learn topic with pet
  async function learnTopic(topic: string): Promise<void> {
    petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + 15);
    petStatus.value.love = Math.min(100, petStatus.value.love + 5);

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

    // Check if it's sleep time (energy decreases faster at night)
    const isSleepTime = new Date().getHours() >= 22 || new Date().getHours() < 6;

    if (isSleepTime) {
      petStatus.value.energy = Math.max(0, petStatus.value.energy - 3);
      petStatus.value.happiness = Math.max(0, petStatus.value.happiness - 1);
    }

    // Random decrease for needs over time
    petStatus.value.energy = Math.max(0, petStatus.value.energy - 1);
    petStatus.value.play = Math.max(0, petStatus.value.play - 2);
    petStatus.value.love = Math.max(0, petStatus.value.love - 2);
    petStatus.value.knowledge = Math.max(0, petStatus.value.knowledge - 1);

    // Try to share knowledge (handles timing checks internally)
    await tryShareKnowledge();

    // Save pet state periodically
    memoryStore.recordPetState('default', {
      energy: petStatus.value.energy,
      play: petStatus.value.play,
      love: petStatus.value.love,
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
        energy: petStatus.value.energy,
        play: petStatus.value.play,
        love: petStatus.value.love,
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
      { type: 'energy' as const, value: petStatus.value.energy },
      { type: 'energy' as const, value: petStatus.value.energy },
      { type: 'love' as const, value: petStatus.value.love },
      { type: 'play' as const, value: petStatus.value.play },
      { type: 'love' as const, value: petStatus.value.love },
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
      type: 'energy' | 'love' | 'play' | 'learn';
      value: number;
      action: 'restoreEnergy' | 'showAffection' | 'playWithPet' | 'learnTopic';
      stat: keyof typeof petStatus.value;
    }

    const needs: SelfCareNeed[] = [
      { type: 'energy', value: petStatus.value.energy, action: 'restoreEnergy', stat: 'energy' },
      { type: 'love', value: petStatus.value.love, action: 'showAffection', stat: 'love' },
      { type: 'play', value: petStatus.value.play, action: 'playWithPet', stat: 'play' },
      { type: 'learn', value: petStatus.value.knowledge, action: 'learnTopic', stat: 'knowledge' },
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
      restoreEnergy: {
        message: "我决定休息一下，恢复精力。💤",
        increase: 15,
        stat: 'energy',
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
      learnTopic: {
        message: "我决定自己看看书，学点新东西。📚",
        increase: 10,
        stat: 'knowledge',
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
      case 'energy':
        petStatus.value.energy = Math.min(100, petStatus.value.energy + statIncrease);
        break;
      case 'play':
        petStatus.value.play = Math.min(100, petStatus.value.play + statIncrease);
        petStatus.value.happiness = Math.min(100, petStatus.value.happiness + statIncrease / 2);
        break;
      case 'love':
        petStatus.value.love = Math.min(100, petStatus.value.love + statIncrease);
        petStatus.value.happiness = Math.min(100, petStatus.value.happiness + statIncrease / 2);
        break;
      case 'learn':
        petStatus.value.knowledge = Math.min(100, petStatus.value.knowledge + statIncrease);
        petStatus.value.love = Math.min(100, petStatus.value.love + statIncrease / 2);
        break;
    }

    // Record the status history
    await memoryStore.recordPetStatusHistory(
      petId,
      {
        energy: petStatus.value.energy,
        play: petStatus.value.play,
        love: petStatus.value.love,
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
      petStatus.value.love = Math.min(100, petStatus.value.love + 15);
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
    const needValue = petStatus.value[needType === 'learn' ? 'knowledge' : needType];

    // Only create goal if need is critical (< 50)
    if (needValue >= 50) return null;

    const goalType = needType === 'energy' ? 'rest' : needType === 'play' ? 'play' : needType === 'love' ? 'social' : 'learn';

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
    loadPetKingdom,
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
    petRequest,
    updateEmotion,
    restoreEnergy,
    playWithPet,
    showAffection,
    chatWithPet,
    learnTopic,
    checkNeeds,
    startNeedChecks,
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

