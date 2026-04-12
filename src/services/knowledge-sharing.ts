// Knowledge Sharing Service
// Pet automatically shares interesting knowledge with user

// Knowledge topics categories (Chinese)
const KNOWLEDGE_TOPICS = {
  history: [
    '你知道吗？长城其实无法用肉眼从太空看到，这是一个常见的误解！',
    '古埃及人认为金字塔是法老通往永生的阶梯，内部充满了珍贵的陪葬品。',
    '罗马帝国鼎盛时期统治着超过 5000 万人，横跨欧、亚、非三大洲。',
    '马可·波罗的游记让欧洲人第一次了解了东方的繁荣与富庶。',
    '亚历山大图书馆曾是古代世界最大的图书馆，收藏了数十万卷书籍。',
  ],
  travel: [
    '加拿大的班夫国家公园拥有令人惊叹的露易丝湖，湖水呈现出迷人的绿松石色。',
    '马尔代夫由 1000 多个珊瑚岛组成，是世界上地势最低的国家。',
    '日本的樱花季是著名的春季传统，每年吸引数百万游客。',
    '希腊的圣托里尼以壮丽的日落和白色建筑闻名于世。',
    '大峡谷是由科罗拉多河经过 600 万年冲刷形成的。',
  ],
  culture: [
    '在日本，吃完盘子里的所有食物被认为是有礼貌的表现。',
    '茶道传统存在于许多文化中，包括中国、日本和摩洛哥。',
    '巴西狂欢节被认为是世界上最大的狂欢节，有数百万参与者。',
    '印度一年中庆祝超过 2000 个节日。',
    '毛利人的哈卡战舞来自新西兰，现在被体育队伍广泛表演。',
  ],
  science: [
    '蜂蜜永远不会变质——考古学家在古埃及墓穴中发现了仍可食用的蜂蜜！',
    '章鱼有三个心脏和蓝色的血液。',
    '埃菲尔铁塔在夏季会因为热膨胀而高出 15 厘米。',
    '金星上的一天比金星上的一年还要长。',
    '香蕉是弯曲的，因为它们朝向太阳生长（正向地性）。',
  ],
  technology: [
    '最早的聊天机器人 ELIZA 创建于 1966 年，它通过模式匹配模拟心理治疗师。',
    '现代 AI 模型使用了 Transformer 架构，这种架构最初是为翻译任务设计的。',
    'AI 正在帮助科学家发现新药，通过分析分子结构预测药物效果。',
    '第一台电子计算机 ENIAC 重达 30 吨，占据了整个房间。',
    '互联网上最早的图片是 1992 年上传的，显示的是一位女演员。',
  ],
  nature: [
    '章鱼有三个心脏，两个负责给鳃供血，一个负责给其他器官供血。',
    '蜜蜂通过舞蹈来告诉同伴花蜜的位置，这叫"摇摆舞"。',
    '猫头鹰是唯一能真正看到蓝色的鸟。',
    '蓝鲸的心脏有一辆汽车那么大。',
    '树木可以通过地下真菌网络互相传递信息和营养。',
  ],
  food: [
    '寿司最初是东南亚的一种保存鱼肉的方法，后来在日本发展成美食。',
    '巧克力在古代玛雅文明中被用作货币。',
    '披萨起源于意大利那不勒斯，最初是穷人的食物。',
    '咖啡最初在埃塞俄比亚被发现，传说是一只山羊吃了一种红色浆果后变得异常活跃。',
    '辣椒的辣度用斯科维尔指标衡量，最辣的辣椒超过 200 万斯科维尔单位。',
  ],
};

// Get random knowledge from a category
function getRandomKnowledge(category: keyof typeof KNOWLEDGE_TOPICS): string {
  const topics = KNOWLEDGE_TOPICS[category];
  return topics[Math.floor(Math.random() * topics.length)];
}

// Get random knowledge from any category
function getRandomKnowledgeAny(): string {
  const categories = Object.keys(KNOWLEDGE_TOPICS) as Array<keyof typeof KNOWLEDGE_TOPICS>;
  const category = categories[Math.floor(Math.random() * categories.length)];
  return getRandomKnowledge(category);
}

// Check if current time is appropriate for sharing (not nighttime)
function isSharingTime(): boolean {
  const hour = new Date().getHours();
  // sharing time: 8am to 10pm
  return hour >= 8 && hour < 22;
}

// Generate a knowledge share message (legacy, use enhanced version below)
export function generateKnowledgeShareLegacy(): { topic: string; content: string } {
  const content = getRandomKnowledgeAny();
  // Infer topic from content (Chinese keywords)
  let topic = '有趣的知识';

  if (content.includes('长城') || content.includes('埃及') || content.includes('罗马') || content.includes('马可')) {
    topic = '历史';
  } else if (content.includes('班夫') || content.includes('马尔代夫') || content.includes('大峡谷') || content.includes('圣托里尼')) {
    topic = '旅行';
  } else if (content.includes('日本') || content.includes('茶道') || content.includes('巴西') || content.includes('印度')) {
    topic = '文化';
  } else if (content.includes('蜂蜜') || content.includes('章鱼') || content.includes('埃菲尔') || content.includes('金星')) {
    topic = '科学';
  } else if (content.includes('聊天机器人') || content.includes('AI') || content.includes('计算机') || content.includes('互联网')) {
    topic = '科技';
  } else if (content.includes('蜜蜂') || content.includes('猫头鹰') || content.includes('蓝鲸') || content.includes('树木')) {
    topic = '自然';
  } else if (content.includes('寿司') || content.includes('巧克力') || content.includes('披萨') || content.includes('咖啡') || content.includes('辣椒')) {
    topic = '美食';
  }

  return { topic, content };
}

// Check if pet should share knowledge (random chance, max 1 per 2-4 hours)
// Can trigger anytime between 8am-10pm, with higher chance at meal times
export function shouldShareKnowledge(lastShareTime: Date | null): boolean {
  // Can only share during daytime (8am-10pm)
  if (!isSharingTime()) return false;

  if (!lastShareTime) return true;

  const now = new Date();
  const diffHours = (now.getTime() - lastShareTime.getTime()) / (1000 * 60 * 60);

  // Share every 2-4 hours randomly
  // Increased chance after 2 hours, maximum chance after 4 hours
  if (diffHours >= 4) return true;
  if (diffHours >= 2 && Math.random() < 0.4) return true;

  return false;
}

// Generate a chat topic based on user interests using LLM with synthesis
export async function generateChatTopicWithLLM(userInterests: string[]): Promise<{ topic: string; description: string; synthesized?: boolean } | null> {
  const { useConfigStore } = await import('@/store/config');
  const configStore = useConfigStore();
  const llmClient = configStore.getApiClient();

  // Weight interests by mention count (most mentioned first)
  const weightedInterests = userInterests
    .sort((a, b) => b.localeCompare(a)) // Simple weighting - in real impl, would use mention counts
    .slice(0, 5); // Top 5 interests

  const interestStr = weightedInterests.length > 0 ? weightedInterests.join(', ') : '日常生活';

  // Try to synthesize 2+ interests into a novel topic if we have enough interests
  const shouldSynthesize = weightedInterests.length >= 2 && Math.random() < 0.6; // 60% chance to synthesize

  const systemPrompt = `你是一只聪明、有爱心的 AI 宠物。请生成一个有趣的话题来和主人聊天。

要求：
1. ${shouldSynthesize ? '尝试将主人的多个兴趣结合起来，创造新颖的话题' : '话题应该引起主人的兴趣'}
2. 包含一些有趣的知识、问题或观察
3. 语言自然、友好、有趣，体现宠物的可爱性格
4. 不要只谈论自己的需求（饿了、困了等）
5. 可以加入适当的幽默或好奇心
6. 使用中文输出
7. 输出格式：JSON 对象`;

  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: shouldSynthesize
        ? `主人最近的兴趣：${interestStr}

请结合这些兴趣，生成一个新颖、有趣的话题来和主人聊天。例如，如果主人喜欢"咖啡"和"爵士乐"，可以问"如果把爵士乐的即兴精神用到咖啡拉花里会怎样？"

请生成话题：`
        : `主人最近的兴趣：${interestStr}

请生成一个有趣的话题来和主人聊天：`,
    },
  ];

  try {
    const response = await llmClient.chat(messages);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.topic && data.description) {
        return {
          topic: data.topic.trim(),
          description: data.description.trim(),
          synthesized: shouldSynthesize,
        };
      }
    }
  } catch (e) {
    console.error('Failed to generate chat topic with LLM:', e);
    // Fallback to synthesized or simple topic
    if (shouldSynthesize && weightedInterests.length >= 2) {
      const interest1 = weightedInterests[0];
      const interest2 = weightedInterests[1];
      return {
        topic: `${interest1}与${interest2}的结合`,
        description: `主人，我最近在想，如果把${interest1}和${interest2}结合起来会怎样？你觉得呢？`,
        synthesized: true,
      };
    }
    return {
      topic: '闲聊',
      description: `主人，我最近在想${userInterests[0] || '生活'}相关的事情，你有什么看法吗？`,
    };
  }

  return null;
}

// Enhanced knowledge share with user interest weighting
export function generateKnowledgeShare(userInterests?: string[]): { topic: string; content: string; interestAligned?: boolean } {
  // If user interests provided, try to align with them
  if (userInterests && userInterests.length > 0) {
    const randomInterest = userInterests[Math.floor(Math.random() * userInterests.length)];

    // Try to find related knowledge
    const allTopics = Object.values(KNOWLEDGE_TOPICS).flat();
    const relatedIndex = allTopics.findIndex(content =>
      content.includes(randomInterest) ||
      content.split('').some(char => randomInterest.includes(char))
    );

    if (relatedIndex >= 0) {
      const content = allTopics[relatedIndex];
      return {
        topic: `关于${randomInterest}`,
        content: content,
        interestAligned: true,
      };
    }
  }

  // Fallback to random knowledge
  const content = getRandomKnowledgeAny();
  let topic = '有趣的知识';

  if (content.includes('长城') || content.includes('埃及') || content.includes('罗马') || content.includes('马可')) {
    topic = '历史';
  } else if (content.includes('班夫') || content.includes('马尔代夫') || content.includes('大峡谷') || content.includes('圣托里尼')) {
    topic = '旅行';
  } else if (content.includes('日本') || content.includes('茶道') || content.includes('巴西') || content.includes('印度')) {
    topic = '文化';
  } else if (content.includes('蜂蜜') || content.includes('章鱼') || content.includes('埃菲尔') || content.includes('金星')) {
    topic = '科学';
  } else if (content.includes('聊天机器人') || content.includes('AI') || content.includes('计算机') || content.includes('互联网')) {
    topic = '科技';
  } else if (content.includes('蜜蜂') || content.includes('猫头鹰') || content.includes('蓝鲸') || content.includes('树木')) {
    topic = '自然';
  } else if (content.includes('寿司') || content.includes('巧克力') || content.includes('披萨') || content.includes('咖啡') || content.includes('辣椒')) {
    topic = '美食';
  }

  return { topic, content };
}
