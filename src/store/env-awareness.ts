import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Environmental factors
export type EnvironmentalFactor =
  | 'time_of_day'
  | 'weather'
  | 'location'
  | 'temperature'
  | 'noise_level'
  | 'light_level';

// Environmental state
export interface EnvironmentalState {
  timeOfDay: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
  weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy' | 'unknown';
  location: string;
  temperature: number; // Celsius
  noiseLevel: number; // 0-100
  lightLevel: number; // 0-100
}

// Environmental preference
export interface EnvironmentalPreference {
  factor: EnvironmentalFactor;
  optimalRange: [number, number];
  preference: 'prefer' | 'avoid';
}

// Environmental event
export interface EnvironmentalEvent {
  id: string;
  type: EnvironmentalFactor;
  timestamp: string;
  oldValue: unknown;
  newValue: unknown;
  impact?: string;
}

export const useEnvAwarenessStore = defineStore('envAwareness', () => {
  // Current environmental state
  const environmentalState = ref<EnvironmentalState>({
    timeOfDay: 'noon',
    weather: 'sunny',
    location: 'center_square',
    temperature: 22,
    noiseLevel: 30,
    lightLevel: 80,
  });

  // Environmental events history
  const environmentalEvents = ref<EnvironmentalEvent[]>([]);

  // Computed: Get time of day from current hour
  const currentHour = computed(() => {
    return new Date().getHours();
  });

  // Computed: Determine time of day category
  const timeOfDayCategory = computed((): 'morning' | 'noon' | 'afternoon' | 'evening' | 'night' => {
    const hour = currentHour.value;
    if (hour >= 5 && hour < 9) return 'morning';
    if (hour >= 9 && hour < 12) return 'noon';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 21) return 'evening';
    return 'night';
  });

  // Computed: Is it meal time
  const isMealTime = computed((): boolean => {
    const hour = currentHour.value;
    return (hour >= 7 && hour < 9) || (hour >= 11 && hour < 13) || (hour >= 17 && hour < 19);
  });

  // Computed: Is it sleep time
  const isSleepTime = computed((): boolean => {
    const hour = currentHour.value;
    return hour >= 22 || hour < 6;
  });

  // Computed: Get optimal activity based on environment
  const optimalActivity = computed((): 'play' | 'rest' | 'learn' | 'social' => {
    const { timeOfDay, weather, noiseLevel } = environmentalState.value;

    if (timeOfDay === 'night' || isSleepTime.value) return 'rest';
    if (weather === 'rainy' || weather === 'stormy' || noiseLevel > 70) return 'learn';
    if (timeOfDay === 'morning' || timeOfDay === 'noon') return 'play';
    return 'social';
  });

  // Computed: Environmental comfort level
  const comfortLevel = computed((): number => {
    let comfort = 100;

    // Weather impact
    if (environmentalState.value.weather === 'rainy' || environmentalState.value.weather === 'stormy') {
      comfort -= 20;
    }
    if (environmentalState.value.weather === 'snowy') {
      comfort -= 10;
    }

    // Time impact
    if (environmentalState.value.timeOfDay === 'night') {
      comfort -= 10;
    }

    // Noise impact
    if (environmentalState.value.noiseLevel > 80) {
      comfort -= 20;
    } else if (environmentalState.value.noiseLevel > 50) {
      comfort -= 10;
    }

    // Light impact
    if (environmentalState.value.lightLevel < 30) {
      comfort -= 15;
    }

    return Math.max(0, Math.min(100, comfort));
  });

  // Actions
  function updateEnvironmentalState(updates: Partial<EnvironmentalState>): void {
    const newState = { ...environmentalState.value, ...updates };

    // Record events for changed values
    Object.keys(updates).forEach(key => {
      const typedKey = key as keyof EnvironmentalState;
      if (environmentalState.value[typedKey] !== newState[typedKey]) {
        const factor = key as EnvironmentalFactor;
        recordEnvironmentalEvent(factor, environmentalState.value[typedKey], newState[typedKey]);
      }
    });

    environmentalState.value = newState;
  }

  function recordEnvironmentalEvent(
    factor: EnvironmentalFactor,
    oldValue: unknown,
    newValue: unknown
  ): void {
    const event: EnvironmentalEvent = {
      id: `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: factor,
      timestamp: new Date().toISOString(),
      oldValue,
      newValue,
    };

    environmentalEvents.value.push(event);

    // Keep only last 100 events
    if (environmentalEvents.value.length > 100) {
      environmentalEvents.value = environmentalEvents.value.slice(-100);
    }
  }

  function simulateTimeChange(hoursToAdd: number): void {
    const currentHour = environmentalState.value.timeOfDay === 'morning' ? 8
      : environmentalState.value.timeOfDay === 'noon' ? 12
      : environmentalState.value.timeOfDay === 'afternoon' ? 14
      : environmentalState.value.timeOfDay === 'evening' ? 18
      : 22;

    const newHour = (currentHour + hoursToAdd) % 24;

    const newTimeOfDay = newHour >= 5 && newHour < 9 ? 'morning'
      : newHour >= 9 && newHour < 12 ? 'noon'
      : newHour >= 12 && newHour < 18 ? 'afternoon'
      : newHour >= 18 && newHour < 21 ? 'evening'
      : 'night';

    updateEnvironmentalState({ timeOfDay: newTimeOfDay });
  }

  function simulateWeatherChange(newWeather: EnvironmentalState['weather']): void {
    updateEnvironmentalState({ weather: newWeather });
  }

  function simulateLocationChange(newLocation: string): void {
    updateEnvironmentalState({ location: newLocation });
  }

  function getEnvironmentalImpact(activity: string): string {
    const { weather, timeOfDay } = environmentalState.value;

    if (activity === 'play' && (weather === 'rainy' || weather === 'stormy')) {
      return 'Not suitable for play in current weather';
    }
    if (activity === 'sleep' && timeOfDay === 'noon') {
      return 'It is daytime, maybe not the best time to sleep';
    }
    if (activity === 'social' && timeOfDay === 'night') {
      return 'Many pets are resting, maybe quiet tonight';
    }
    if (activity === 'learn' && weather === 'sunny') {
      return 'Beautiful weather, perfect for learning!';
    }

    return '';
  }

  // Get recent environmental events
  function getRecentEvents(minutes = 60): EnvironmentalEvent[] {
    const cutoff = Date.now() - minutes * 60 * 1000;
    return environmentalEvents.value.filter(
      event => new Date(event.timestamp).getTime() > cutoff
    );
  }

  // Reset environmental state
  function resetEnvState(): void {
    environmentalState.value = {
      timeOfDay: 'noon',
      weather: 'sunny',
      location: 'center_square',
      temperature: 22,
      noiseLevel: 30,
      lightLevel: 80,
    };
    environmentalEvents.value = [];
  }

  return {
    environmentalState,
    environmentalEvents,
    currentHour,
    timeOfDayCategory,
    isMealTime,
    isSleepTime,
    optimalActivity,
    comfortLevel,
    updateEnvironmentalState,
    recordEnvironmentalEvent,
    simulateTimeChange,
    simulateWeatherChange,
    simulateLocationChange,
    getEnvironmentalImpact,
    getRecentEvents,
    resetEnvState,
  };
});
