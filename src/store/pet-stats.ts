import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { PetStatus, PetSnapshot, StatusTrend } from '../types/pet-kingdom';

// Default pet status
const DEFAULT_PET_STATUS: PetStatus = {
  hunger: 100,
  sleep: 100,
  play: 100,
  love: 100,
  chat: 100,
  knowledge: 50,
  health: 100,
  happiness: 100,
};

export const usePetStatsStore = defineStore('petStats', () => {
  // Current pet status
  const petStatus = ref<PetStatus>({ ...DEFAULT_PET_STATUS });

  // Status history for trend calculation
  const statusHistory = ref<Array<{ timestamp: string; status: PetStatus }>>([]);

  // Last update time for each stat
  const lastUpdate = ref<Record<string, number>>({});

  // Computed properties for status categories
  const physicalStats = computed(() => ({
    hunger: petStatus.value.hunger,
    sleep: petStatus.value.sleep,
    energy: petStatus.value.sleep, // Derived from sleep
    health: petStatus.value.health,
  }));

  const emotionalStats = computed(() => ({
    happiness: petStatus.value.happiness,
    love: petStatus.value.love,
    play: petStatus.value.play,
    chat: petStatus.value.chat,
  }));

  const mentalStats = computed(() => ({
    knowledge: petStatus.value.knowledge,
    learning: petStatus.value.knowledge, // Alias for knowledge
  }));

  // Calculate trends for each stat
  const statusTrends = computed((): StatusTrend[] => {
    const trends: StatusTrend[] = [];

    const statNames: (keyof PetStatus)[] = [
      'hunger', 'sleep', 'play', 'love', 'chat', 'knowledge', 'health', 'happiness'
    ];

    statNames.forEach(statName => {
      const currentValue = petStatus.value[statName];
      const historyForStat = statusHistory.value
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 24); // Last 24 hours

      if (historyForStat.length >= 2) {
        const value24hAgo = historyForStat[historyForStat.length - 1].status[statName];
        const change24h = currentValue - value24hAgo;

        // Simple trend calculation
        let trend: StatusTrend['trend'] = 'stable';
        if (change24h > 5) trend = 'up';
        else if (change24h < -5) trend = 'down';

        trends.push({
          statName: String(statName),
          currentValue,
          change24h,
          change7d: 0, // Placeholder for 7-day change
          trend,
        });
      }
    });

    return trends;
  });

  // Urgent needs (stats below threshold)
  const urgentNeeds = computed(() => {
    const THRESHOLD = 40;
    const needs = [];

    if (petStatus.value.hunger < THRESHOLD) needs.push({ stat: 'hunger', label: 'Hunger' });
    if (petStatus.value.sleep < THRESHOLD) needs.push({ stat: 'sleep', label: 'Sleep' });
    if (petStatus.value.love < THRESHOLD) needs.push({ stat: 'love', label: 'Love' });
    if (petStatus.value.play < THRESHOLD) needs.push({ stat: 'play', label: 'Play' });
    if (petStatus.value.chat < THRESHOLD) needs.push({ stat: 'chat', label: 'Chat' });

    return needs;
  });

  // Overall pet well-being score (0-100)
  const wellBeingScore = computed(() => {
    const stats = petStatus.value;
    const total = (stats.hunger + stats.sleep + stats.play + stats.love + stats.chat + stats.knowledge + stats.health + stats.happiness) / 8;
    return Math.round(total);
  });

  // Actions
  function updatePetStatus(updates: Partial<PetStatus>): void {
    const timestamp = new Date().toISOString();

    // Save current state to history before updating
    statusHistory.value.push({
      timestamp,
      status: { ...petStatus.value },
    });

    // Keep only last 100 history entries
    if (statusHistory.value.length > 100) {
      statusHistory.value = statusHistory.value.slice(-100);
    }

    // Update status
    Object.assign(petStatus.value, updates);

    // Update last update times
    Object.keys(updates).forEach(key => {
      lastUpdate.value[key] = Date.now();
    });
  }

  function restorePetStatus(status: PetStatus): void {
    petStatus.value = { ...status };
  }

  function getPetSnapshot(): PetSnapshot {
    return {
      petId: 'default',
      level: 1,
      name: 'My Pet',
      form: 'default',
      experience: petStatus.value.knowledge,
      stats: {
        happiness: petStatus.value.happiness,
        hunger: petStatus.value.hunger,
        health: petStatus.value.health,
        energy: petStatus.value.sleep, // Map sleep to energy
      },
      inventoryCount: 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Reset to default status
  function resetStatus(): void {
    petStatus.value = { ...DEFAULT_PET_STATUS };
    statusHistory.value = [];
    lastUpdate.value = {};
  }

  return {
    petStatus,
    statusHistory,
    lastUpdate,
    physicalStats,
    emotionalStats,
    mentalStats,
    statusTrends,
    urgentNeeds,
    wellBeingScore,
    updatePetStatus,
    restorePetStatus,
    getPetSnapshot,
    resetStatus,
  };
});
