import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid';
import { saveSocialConversation, getSocialConversations } from '../db';
import { LLMClient } from '../api/llm';
import type {
  SocialState,
  SocialCharacter,
  SocialResult,
  SocialScenario,
  ConversationRecord,
  CharacterRole,
} from '../types/social';

// 问题库 - 根据难度分类
const QUESTION_POOL: Record<string, string[]> = {
  // 简单问题（难度 1-2）
  easy: [
    'What is your name?',
    'Where are you from?',
    'How old are you?',
    'What is your favorite color?',
    'Do you like this place?',
    'Are you enjoying your time here?',
    'Is this your first time here?',
    'What brings you here today?',
  ],
  // 中等问题（难度 3-5）
  medium: [
    'Why is your project delayed?',
    'What is your daily progress?',
    'How do you solve the technical issues?',
    'Can you describe your workflow?',
    'What challenges are you facing?',
    'How do you manage your time?',
    'What is your long-term goal?',
    'How do you handle stress?',
  ],
  // 困难问题（难度 6-8）
  hard: [
    'How would you handle a critical system failure?',
    'What is your strategy for team management?',
    'How do you ensure code quality?',
    'Can you explain your architecture design?',
    'How do you handle conflicting requirements?',
    'What is your approach to performance optimization?',
    'How do you stay updated with new technologies?',
    'What is your lesson from past failures?',
  ],
  // 专家问题（难度 9+）
  expert: [
    'How would you design a scalable system from scratch?',
    'What are the trade-offs between consistency and availability?',
    'How do you approach technical debt management?',
    'Can you explain complex concepts to non-technical stakeholders?',
    'How do you lead a team through organizational change?',
    'What is your strategy for technical roadmapping?',
    'How do you evaluate new technologies for adoption?',
    'What is your vision for the future of this project?',
  ],
};

// 根据难度获取问题
function getQuestionsForDifficulty(difficulty: number, count: number): string[] {
  let pool: string[] = [];

  if (difficulty <= 2) {
    pool = QUESTION_POOL.easy;
  } else if (difficulty <= 5) {
    pool = [...QUESTION_POOL.easy, ...QUESTION_POOL.medium];
  } else if (difficulty <= 8) {
    pool = [...QUESTION_POOL.medium, ...QUESTION_POOL.hard];
  } else {
    pool = [...QUESTION_POOL.hard, ...QUESTION_POOL.expert];
  }

  // 随机选择指定数量的问题
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 根据角色生成问题
function generateCharacterQuestions(role: string, difficulty: number): string[] {
  const baseCount = Math.max(1, Math.floor(difficulty / 2) + 1); // 难度越高，问题越多
  return getQuestionsForDifficulty(difficulty, baseCount);
}

// Generate sample characters with dynamic questions based on difficulty
function generateCharacters(difficulty = 1): SocialCharacter[] {
  const bossQuestions = generateCharacterQuestions('boss', difficulty);
  const touristQuestions = generateCharacterQuestions('tourist', difficulty);
  const merchantQuestions = generateCharacterQuestions('merchant', difficulty);

  return [
    {
      id: `char_boss_${difficulty}`,
      role: 'boss',
      name: 'Strict Manager',
      personality: ['demanding', 'professional', 'critical'],
      dialogueStyle: 'formal',
      questions: bossQuestions,
      difficulty,
      responsePatterns: {
        confident: ['Good answer', 'Impressive', 'Clear thinking', 'Well explained'],
        unsure: ['Are you sure?', 'Try to be more confident', 'Think harder', 'Elaborate more'],
        poor: ['Not acceptable', 'Better prepare next time', 'Disappointing', 'Weak response'],
      },
    },
    {
      id: `char_tourist_${difficulty}`,
      role: 'tourist',
      name: 'Curious Visitor',
      personality: ['friendly', 'curious', 'easygoing'],
      dialogueStyle: 'casual',
      questions: touristQuestions,
      difficulty: Math.max(1, difficulty - 1),
      responsePatterns: {
        welcoming: ['Wonderful!', 'Thanks for sharing', 'I love this place too', 'That sounds great'],
        rude: ['Wow, that was rude', 'Please be more polite', 'I hope you apologize', 'Unacceptable'],
        neutral: ['I see', 'Interesting', 'Okay', 'I understand'],
      },
    },
    {
      id: `char_merchant_${difficulty}`,
      role: 'merchant',
      name: 'Honest Trader',
      personality: ['shrewd', 'fair', 'talkative'],
      dialogueStyle: 'casual',
      questions: merchantQuestions,
      difficulty: Math.max(1, difficulty - 1),
      responsePatterns: {
        negotiate: ['Good offer', 'Let me think', 'Can you pay a bit more?', 'Fair point'],
        generous: ['Thank you so much', 'You are very kind', 'I appreciate this', 'Much appreciated'],
        lowball: ['That is too low', 'I cannot accept that', 'Try a better offer', 'Way too low'],
      },
    },
  ];
}

// Generate sample scenarios based on level
function getScenarioForLevel(level: number): SocialScenario {
  const difficulty = Math.min(10, Math.max(1, Math.floor(level / 2) + 1));

  const scenarios: SocialScenario[] = [
    {
      id: `scenario_1_l${level}`,
      title: 'First Encounter',
      description: 'Simple interactions for beginners',
      characters: generateCharacters(Math.max(1, difficulty - 1)),
      difficulty: Math.max(1, difficulty - 1),
      maxLevel: 3,
      experienceBase: 10,
    },
    {
      id: `scenario_2_l${level}`,
      title: 'Social Gathering',
      description: 'Multiple characters with varied personalities',
      characters: generateCharacters(difficulty),
      difficulty: difficulty,
      maxLevel: 7,
      experienceBase: 20,
    },
    {
      id: `scenario_3_l${level}`,
      title: 'Business Negotiation',
      description: 'Complex interactions with high stakes',
      characters: generateCharacters(Math.min(10, difficulty + 1)),
      difficulty: Math.min(10, difficulty + 1),
      maxLevel: 10,
      experienceBase: 30,
    },
  ];

  // Return scenario based on level
  const suitable = scenarios.find(s => level <= s.maxLevel);
  return suitable || scenarios[scenarios.length - 1];
}

export const useSocialStore = defineStore('social', () => {
  // State
  const currentScenario = ref<SocialScenario | null>(null);
  const activeCharacters = ref<SocialCharacter[]>([]);
  const currentQuestions = ref<string[]>([]);
  const conversations = ref<ConversationRecord[]>([]);
  const learnedSkills = ref<string[]>([]);
  const relationshipScore = ref<Record<string, number>>({});
  const totalExperience = ref(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const conversationCount = computed(() => conversations.value.length);
  const skillCount = computed(() => learnedSkills.value.length);
  const averageRelationship = computed(() => {
    const scores = Object.values(relationshipScore.value);
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  });

  // Actions
  async function loadFromDB(petId: string): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const savedConversations = await getSocialConversations(petId);
      conversations.value = savedConversations || [];

      // Extract learned tips from conversations
      const tips = new Set<string>();
      conversations.value.forEach(c => {
        c.learnedTips.forEach(tip => tips.add(tip));
      });
      learnedSkills.value = Array.from(tips);
    } catch (err) {
      error.value = `Failed to load social data: ${err}`;
    } finally {
      isLoading.value = false;
    }
  }

  async function startScenario(scenarioId: string, petLevel: number): Promise<void> {
    const scenario = getScenarioForLevel(petLevel);
    currentScenario.value = scenario;
    activeCharacters.value = [...scenario.characters];
    // 随机选择一个角色的问题作为当前问题
    if (activeCharacters.value.length > 0) {
      const randomChar = activeCharacters.value[Math.floor(Math.random() * activeCharacters.value.length)];
      currentQuestions.value = randomChar.questions;
    }
    error.value = null;
  }

  async function interact(
    characterId: string,
    response: string,
  ): Promise<SocialResult> {
    isLoading.value = true;
    error.value = null;

    try {
      const character = activeCharacters.value.find(c => c.id === characterId);
      if (!character) {
        throw new Error('Character not found');
      }

      // Build context from past conversations
      const context = buildConversationContext(characterId);

      // Get LLM to evaluate response
      const llmClient = new LLMClient({
        baseUrl: 'http://192.168.1.159:19000/v1',
        apiKey: 'sk-no-key-required',
        model: 'Qwen3Coder',
      });

      const prompt = buildSocialPrompt(character, context, response);
      const evaluation = await llmClient.chatWithResponse([
        { role: 'system', content: prompt },
        { role: 'user', content: 'Evaluate this response' },
      ]);

      // Parse evaluation (simplified)
      const evaluationText = evaluation.data.toLowerCase();
      const success = evaluationText.includes('good') || evaluationText.includes('great') || evaluationText.includes('excellent');
      const experience = character.difficulty * 5;
      const learnedTips = extractTips(evaluationText);

      // Update relationship score
      const currentScore = relationshipScore.value[characterId] || 50;
      relationshipScore.value[characterId] = Math.max(0, Math.min(100, currentScore + (success ? 10 : -5)));

      // Create conversation record
      const record: ConversationRecord = {
        id: generateUUID(),
        petId: 'default',
        characterId,
        characterRole: character.role,
        characterName: character.name,
        questionsAnswered: currentQuestions.value.map(q => ({
          question: q,
          answer: response,
          llmScore: success ? 80 : 40,
        })),
        success,
        experience,
        learnedTips,
        timestamp: new Date().toISOString(),
        mood: success ? 'happy' : 'neutral',
      };

      conversations.value.push(record);
      await saveSocialConversation(record);

      // Update state
      totalExperience.value += experience;
      learnedTips.forEach(tip => {
        if (!learnedSkills.value.includes(tip)) {
          learnedSkills.value.push(tip);
        }
      });

      // Generate character reaction
      const reaction = generateCharacterReaction(success, character, learnedTips);

      return {
        success,
        characterReaction: reaction,
        experience,
        learnedTips,
      };
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Interaction failed';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  function buildConversationContext(characterId: string): string {
    const characterConversations = conversations.value.filter(
      c => c.characterId === characterId,
    );
    if (characterConversations.length === 0) return 'No prior conversations.';

    const last = characterConversations[characterConversations.length - 1];
    return `Previous interaction: ${last.success ? 'successful' : 'challenging'}. Last tips learned: ${last.learnedTips.join(', ')}.`;
  }

  function buildSocialPrompt(character: SocialCharacter, context: string, response: string): string {
    return `
You are evaluating a response in a social interaction.

Character Profile:
- Role: ${character.role}
- Personality: ${character.personality.join(', ')}
- Dialogue Style: ${character.dialogueStyle}

Context: ${context}

Character Question: "${character.questions[0] || 'Greeting'}"
Pet Response: "${response}"

Evaluate the response on:
1. Relevance to the question
2. Social appropriateness
3. Creativity and engagement

Provide your evaluation and suggest one improvement if needed.
`;
  }

  function extractTips(evaluationText: string): string[] {
    const tips: string[] = [];

    if (evaluationText.includes('good') || evaluationText.includes('great')) {
      tips.push('be polite and friendly');
    }
    if (evaluationText.includes('confident') || evaluationText.includes('clear')) {
      tips.push('speak with confidence');
    }
    if (evaluationText.includes('creative') || evaluationText.includes('interesting')) {
      tips.push('think creatively');
    }

    return tips;
  }

  function generateCharacterReaction(
    success: boolean,
    character: SocialCharacter,
    learnedTips: string[],
  ): string {
    if (success) {
      const positives = character.responsePatterns.confident || ['Good answer', 'Well done'];
      return positives[Math.floor(Math.random() * positives.length)];
    } else {
      const negatives = character.responsePatterns.poor || ['Not bad', 'Try again'];
      return negatives[Math.floor(Math.random() * negatives.length)];
    }
  }

  function getDiary(period: 'daily' | 'weekly' | 'monthly'): string {
    const filtered = conversations.value;
    const tips = Array.from(new Set(filtered.flatMap(c => c.learnedTips)));

    return `
# Social Diary

## Interactions Summary
- Total conversations: ${filtered.length}
- Successful interactions: ${filtered.filter(c => c.success).length}
- Skills learned: ${tips.length}

## Key Learnings
${tips.map(t => `- ${t}`).join('\n')}

## Character Relationships
${Object.entries(relationshipScore.value)
      .map(([cid, score]) => `- Character ${cid}: ${score}/100`)
      .join('\n')}
`;
  }

  function reset(): void {
    currentScenario.value = null;
    activeCharacters.value = [];
    currentQuestions.value = [];
    conversations.value = [];
    learnedSkills.value = [];
    relationshipScore.value = {};
    totalExperience.value = 0;
  }

  return {
    currentScenario,
    activeCharacters,
    currentQuestions,
    conversations,
    conversationCount,
    learnedSkills,
    skillCount,
    relationshipScore,
    averageRelationship,
    totalExperience,
    isLoading,
    error,
    loadFromDB,
    startScenario,
    interact,
    getDiary,
    reset,
  };
});
