import { usePetKingdomStore } from '@/store/pet-kingdom';
import { useMemoryStore } from '@/store/memory';

interface HeartbeatConfig {
  intervalMs: number;
  decayRates: {
    hunger: { base: number; mealTimePenalty: number };
    energy: { base: number; sleepPenalty: number };
    happiness: { base: number; loneliness: number };
    health: { base: number; starvation: number };
    play: number;
    love: number;
    chat: number;
    knowledge: number;
  };
  thresholds: {
    critical: number;
    danger: number;
  };
}

export const CONFIG: HeartbeatConfig = {
  intervalMs: 10 * 60 * 1000, // 10 minutes
  decayRates: {
    hunger: { base: 5, mealTimePenalty: 10 },  // Extra decay if missed meal time
    energy: { base: 3, sleepPenalty: 15 },      // Extra decay if not sleeping at night
    happiness: { base: 2, loneliness: 5 },       // Extra if no interaction
    health: { base: 1, starvation: 10 },         // Extra if hunger < 20
    play: 2,
    love: 2,
    chat: 2,
    knowledge: 1,
  },
  thresholds: {
    critical: 20,  // Below this triggers penalties
    danger: 40,    // Below this shows warnings
  },
};

class HeartbeatService {
  private timer: number | null = null;
  private missedMealsCount = 0;
  private readonly MAX_MISSED_MEALS = 4;
  private lastSelfCareTime = 0; // Timestamp of last self-care action
  private readonly SELF_CARE_COOLDOWN = 2 * 60 * 60 * 1000; // 2 hours

  start() {
    if (this.timer) {
      console.log('[HeartbeatService] Already running');
      return;
    }
    this.timer = window.setInterval(() => this.tick(), CONFIG.intervalMs);
    console.log('[HeartbeatService] Started (10-min interval)');
    // Note: Do not run immediately on start to avoid instant death on page load
    // The first tick will run after the interval (10 minutes)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[HeartbeatService] Stopped');
    }
  }

  resetMissedMeals() {
    this.missedMealsCount = 0;
    console.log('[HeartbeatService] Missed meals counter reset');
  }

  getMissedMealsCount(): number {
    return this.missedMealsCount;
  }

  private async tick() {
    console.log('[HeartbeatService] Tick executed');
    const petKingdomStore = usePetKingdomStore();
    const memoryStore = useMemoryStore();

    const petStatus = petKingdomStore.petStatus;
    const now = new Date();
    const currentHour = now.getHours();

    // Circadian rhythm checks
    const isMealTime = memoryStore.isMealTime();
    const isSleepTime = memoryStore.isSleepTime();

    console.log('[HeartbeatService] Current state:', {
      isMealTime,
      isSleepTime,
      hour: currentHour,
      hunger: petStatus.hunger,
    });

    // Calculate decay with circadian adjustments
    let hungerDecay = CONFIG.decayRates.hunger.base;
    let energyDecay = CONFIG.decayRates.energy.base;
    let happinessDecay = CONFIG.decayRates.happiness.base;
    let healthDecay = CONFIG.decayRates.health.base;

    // Meal time penalty: if it's meal time and hunger is low, decay faster
    if (isMealTime && petStatus.hunger < 70) {
      hungerDecay += CONFIG.decayRates.hunger.mealTimePenalty;
      console.log('[HeartbeatService] Meal time penalty applied to hunger');
    }

    // Sleep time penalty: if it's sleep time and not sleeping, energy decays faster
    if (isSleepTime && petStatus.sleep < 70) {
      energyDecay += CONFIG.decayRates.energy.sleepPenalty;
      console.log('[HeartbeatService] Sleep time penalty applied to energy');
    }

    // Starvation penalty: if hunger is critical, health decays faster
    if (petStatus.hunger < CONFIG.thresholds.critical) {
      healthDecay += CONFIG.decayRates.health.starvation;
      happinessDecay += CONFIG.decayRates.happiness.loneliness;
    }

    // Apply decay
    const updatedStatus = {
      ...petStatus,
      hunger: Math.max(0, petStatus.hunger - hungerDecay),
      energy: Math.max(0, petStatus.energy - energyDecay),
      happiness: Math.max(0, petStatus.happiness - happinessDecay),
      health: Math.max(0, petStatus.health - healthDecay),
      play: Math.max(0, petStatus.play - CONFIG.decayRates.play),
      love: Math.max(0, petStatus.love - CONFIG.decayRates.love),
      chat: Math.max(0, petStatus.chat - CONFIG.decayRates.chat),
      knowledge: Math.max(0, petStatus.knowledge - CONFIG.decayRates.knowledge),
    };

    // Penalty system: Missed Meals
    if (isMealTime && updatedStatus.hunger < CONFIG.thresholds.critical) {
      this.missedMealsCount++;
      console.warn(`[HeartbeatService] Missed meal detected! Count: ${this.missedMealsCount}/${this.MAX_MISSED_MEALS}`);

      // Additional penalties for missed meals
      updatedStatus.health = Math.max(0, updatedStatus.health - 5);
      updatedStatus.happiness = Math.max(0, updatedStatus.happiness - 10);

      // Check for death
      if (this.missedMealsCount >= this.MAX_MISSED_MEALS) {
        await this.handleDeath(petKingdomStore);
        return;
      }
    } else if (updatedStatus.hunger >= 70) {
      // Reset counter if pet is well-fed
      this.missedMealsCount = 0;
    }

    // Update sleep decay if not sleeping during sleep time
    if (isSleepTime && petStatus.sleep < 50) {
      updatedStatus.health = Math.max(0, updatedStatus.health - 2);
      updatedStatus.happiness = Math.max(0, updatedStatus.happiness - 3);
    }

    // Apply updates to pet-kingdom store
    petKingdomStore.petStatus = updatedStatus;

    // Record status history
    await memoryStore.recordPetStatusHistory(
      'default',
      updatedStatus,
      {
        hunger: -hungerDecay,
        energy: -energyDecay,
        happiness: -happinessDecay,
        health: -healthDecay,
      },
      'auto'
    );

    // Emotion State Machine: Check for stat-based emotion transitions and natural decay
    petKingdomStore.updateEmotion('decay');

    // Trigger proactive behavior checks (Phase 2)
    await this.checkProactiveBehaviors(petKingdomStore, memoryStore, updatedStatus);

    // Check for self-care mode (trigger after 2 hours of user inactivity)
    await this.checkSelfCareMode(petKingdomStore, updatedStatus);
  }

  private async checkProactiveBehaviors(
    petKingdomStore: ReturnType<typeof usePetKingdomStore>,
    memoryStore: ReturnType<typeof useMemoryStore>,
    status: any
  ) {
    // Check if pet should send a request (need < 30)
    const urgentNeeds = [
      { type: 'eat', value: status.hunger, label: 'hunger' },
      { type: 'sleep', value: status.sleep, label: 'sleep' },
      { type: 'love', value: status.love, label: 'love' },
      { type: 'play', value: status.play, label: 'play' },
    ];

    const mostUrgent = urgentNeeds.reduce((prev, curr) =>
      curr.value < prev.value ? curr : prev
    );

    if (mostUrgent.value < CONFIG.thresholds.danger) {
      console.log(`[HeartbeatService] Pet has urgent need: ${mostUrgent.label} (${mostUrgent.value})`);
      // This will be handled by petRequest computed property in UI
    }

    // Try knowledge sharing if conditions met
    await petKingdomStore.tryShareKnowledge();
  }

  private async checkSelfCareMode(
    petKingdomStore: ReturnType<typeof usePetKingdomStore>,
    status: typeof petKingdomStore.petStatus
  ) {
    const now = Date.now();

    // Check if cooldown expired (2 hours since last self-care)
    if (now - this.lastSelfCareTime < this.SELF_CARE_COOLDOWN) {
      return;
    }

    // Check if any stat is critically low (< 30)
    const criticalNeeds = [
      { stat: 'hunger', value: status.hunger, action: 'eat' },
      { stat: 'sleep', value: status.sleep, action: 'sleep' },
      { stat: 'love', value: status.love, action: 'love' },
      { stat: 'play', value: status.play, action: 'play' },
    ];

    const criticalNeed = criticalNeeds.find(n => n.value < 30);
    if (!criticalNeed) {
      return;
    }

    console.log(`[HeartbeatService] Self-care triggered: ${criticalNeed.stat} (${criticalNeed.value})`);

    // Execute self-care action
    const result = await petKingdomStore.selfCare();

    if (result.statIncreased) {
      this.lastSelfCareTime = now;
      console.log(`[HeartbeatService] Self-care completed: ${result.message}`);

      // Record to memory as event
      await useMemoryStore().addMemory(
        'event',
        'Self-Care',
        `Pet performed self-care: ${result.action}`,
        {
          stat: result.statIncreased,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        5,
        ['self-care', 'autonomous']
      );
    }
  }

  private async handleDeath(petKingdomStore: ReturnType<typeof usePetKingdomStore>) {
    console.error('[HeartbeatService] PET HAS DIED due to starvation (4 missed meals).');

    petKingdomStore.petStatus = {
      ...petKingdomStore.petStatus,
      health: 0,
      happiness: 0,
      hunger: 0,
      energy: 0,
    };

    // Record death event
    await useMemoryStore().addMemory(
      'event',
      'Pet Death',
      'Pet died due to 4 consecutive missed meals',
      {
        cause: 'starvation',
        missedMeals: this.missedMealsCount,
        timestamp: new Date().toISOString(),
      },
      10,
      ['death', 'starvation', 'game-over']
    );

    // Stop the heartbeat
    this.stop();

    // Show death notification (will be implemented in UI)
    alert('Your pet has passed away due to starvation. Please restart the application to adopt a new pet.');
  }
}

export const heartbeatService = new HeartbeatService();
