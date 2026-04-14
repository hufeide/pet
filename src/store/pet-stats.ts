import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PetStatus, PetSnapshot, StatusTrend } from '../types/pet-kingdom';

// Default pet status - 4 core needs
const DEFAULT_PET_STATUS: PetStatus = {
  energy: 100,
  play: 100,
  love: 100,
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
    energy: petStatus.value.energy,
    health: petStatus.value.health,
  }));

  const emotionalStats = computed(() => ({
    happiness: petStatus.value.happiness,
    love: petStatus.value.love,
    play: petStatus.value.play,
  }));

  const mentalStats = computed(() => ({
    knowledge: petStatus.value.knowledge,
  }));

  // Calculate trends for each stat
  const statusTrends = computed((): StatusTrend[] => {
    const trends: StatusTrend[] = [];

    const statNames: (keyof PetStatus)[] = [
      'energy', 'play', 'love', 'knowledge', 'health', 'happiness'
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

    if (petStatus.value.energy < THRESHOLD) needs.push({ stat: 'energy', label: 'Energy' });
    if (petStatus.value.love < THRESHOLD) needs.push({ stat: 'love', label: 'Love' });
    if (petStatus.value.play < THRESHOLD) needs.push({ stat: 'play', label: 'Play' });

    return needs;
  });

  // Overall pet well-being score (0-100)
  const wellBeingScore = computed(() => {
    const stats = petStatus.value;
    const total = (stats.energy + stats.play + stats.love + stats.knowledge + stats.health + stats.happiness) / 6;
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
        energy: petStatus.value.energy,
        play: petStatus.value.play,
        love: petStatus.value.love,
        knowledge: petStatus.value.knowledge,
        health: petStatus.value.health,
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