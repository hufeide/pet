import { usePetKingdomStore } from '@/store/pet-kingdom';
import { useMemoryStore } from '@/store/memory';

interface HeartbeatConfig {
  intervalMs: number;
  decayRates: {
    energy: number;
    play: number;
    love: number;
    knowledge: number;
    happiness: number;
    health: number;
  };
  thresholds: {
    critical: number;
    danger: number;
  };
}

export const CONFIG: HeartbeatConfig = {
  intervalMs: 10 * 60 * 1000, // 10 minutes
  decayRates: {
    energy: 3,
    play: 2,
    love: 2,
    knowledge: 1,
    happiness: 2,
    health: 1,
  },
  thresholds: {
    critical: 20,  // Below this triggers penalties
    danger: 40,    // Below this shows warnings
  },
};

class HeartbeatService {
  private timer: number | null = null;
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

  getMissedMealsCount(): number {
    return 0; // No longer applicable with 4-needs system
  }

  private async tick() {
    console.log('[HeartbeatService] Tick executed');
    const petKingdomStore = usePetKingdomStore();
    const memoryStore = useMemoryStore();

    const petStatus = petKingdomStore.petStatus;

    console.log('[HeartbeatService] Current state:', {
      energy: petStatus.energy,
      play: petStatus.play,
      love: petStatus.love,
      knowledge: petStatus.knowledge,
    });

    // Apply decay to all needs
    const updatedStatus = {
      ...petStatus,
      energy: Math.max(0, petStatus.energy - CONFIG.decayRates.energy),
      play: Math.max(0, petStatus.play - CONFIG.decayRates.play),
      love: Math.max(0, petStatus.love - CONFIG.decayRates.love),
      knowledge: Math.max(0, petStatus.knowledge - CONFIG.decayRates.knowledge),
      happiness: Math.max(0, petStatus.happiness - CONFIG.decayRates.happiness),
      health: Math.max(0, petStatus.health - CONFIG.decayRates.health),
    };

    // Apply updates to pet-kingdom store
    petKingdomStore.petStatus = updatedStatus;

    // Record status history
    await memoryStore.recordPetStatusHistory(
      'default',
      updatedStatus,
      {
        energy: -CONFIG.decayRates.energy,
        play: -CONFIG.decayRates.play,
        love: -CONFIG.decayRates.love,
        knowledge: -CONFIG.decayRates.knowledge,
        happiness: -CONFIG.decayRates.happiness,
        health: -CONFIG.decayRates.health,
      },
      'auto'
    );

    // Emotion State Machine: Check for stat-based emotion transitions and natural decay
    petKingdomStore.updateEmotion('decay');

    // Trigger proactive behavior checks
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
      { type: 'energy', value: status.energy, label: 'energy' },
      { type: 'play', value: status.play, label: 'play' },
      { type: 'love', value: status.love, label: 'love' },
      { type: 'learn', value: status.knowledge, label: 'knowledge' },
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
      { stat: 'energy', value: status.energy, action: 'energy' },
      { stat: 'play', value: status.play, action: 'play' },
      { stat: 'love', value: status.love, action: 'love' },
      { stat: 'knowledge', value: status.knowledge, action: 'learn' },
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
}

export const heartbeatService = new HeartbeatService();