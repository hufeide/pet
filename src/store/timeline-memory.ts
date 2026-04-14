import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PetMemoryType } from './memory';

// Timeline event types
export type TimelineEventType =
  | 'stat_update'
  | 'interaction'
  | 'conversation'
  | 'achievement'
  | 'evolution'
  | 'knowledge_shared'
  | 'need_satisfied'
  | 'emotional_change'
  | 'social';

// Timeline event interface
export interface TimelineEvent {
  id: string;
  petId: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  content: string;
  icon?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

// Timeline group for display
export interface TimelineGroup {
  date: string;
  events: TimelineEvent[];
}

export const useTimelineMemoryStore = defineStore('timelineMemory', () => {
  // Timeline events storage
  const timelineEvents = ref<TimelineEvent[]>([]);

  // Last event time per category for deduplication
  const lastEventTime = ref<Record<string, number>>({});

  // Computed: Get events by date
  const eventsByDate = computed((): TimelineGroup[] => {
    const groups: Record<string, TimelineEvent[]> = {};

    timelineEvents.value.forEach(event => {
      const date = event.timestamp.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });

    return Object.entries(groups)
      .map(([date, events]) => ({
        date,
        events: events.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  // Computed: Get events by type
  const eventsByType = computed((): Record<string, TimelineEvent[]> => {
    const byType: Record<string, TimelineEvent[]> = {};
    timelineEvents.value.forEach(event => {
      if (!byType[event.type]) {
        byType[event.type] = [];
      }
      byType[event.type].push(event);
    });
    return byType;
  });

  // Computed: Get recent events (last 24 hours)
  const recentEvents = computed((): TimelineEvent[] => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return timelineEvents.value.filter(
      event => new Date(event.timestamp).getTime() > oneDayAgo
    );
  });

  // Computed: Get emotional events
  const emotionalEvents = computed((): TimelineEvent[] => {
    return timelineEvents.value.filter(
      event => event.type === 'emotional_change'
    );
  });

  // Actions
  function addEvent(event: Omit<TimelineEvent, 'id'>): void {
    const newEvent: TimelineEvent = {
      ...event,
      id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    timelineEvents.value.push(newEvent);

    // Keep only last 1000 events
    if (timelineEvents.value.length > 1000) {
      timelineEvents.value = timelineEvents.value.slice(-1000);
    }

    // Update last event time for category
    lastEventTime.value[event.type] = Date.now();
  }

  function addStatUpdate(
    petId: string,
    statName: string,
    oldValue: number,
    newValue: number,
    metadata?: Record<string, unknown>
  ): void {
    const change = newValue - oldValue;
    if (change === 0) return;

    addEvent({
      petId,
      type: 'stat_update' as TimelineEventType,
      timestamp: new Date().toISOString(),
      title: `${statName} ${change > 0 ? 'Improved' : 'Changed'}`,
      content: `${statName}: ${oldValue} → ${newValue}`,
      icon: change > 0 ? '↑' : '↓',
      category: 'stat',
      metadata: { statName, oldValue, newValue, change, ...metadata },
    });
  }

  function addInteraction(
    petId: string,
    interactionType: string,
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    addEvent({
      petId,
      type: 'interaction' as TimelineEventType,
      timestamp: new Date().toISOString(),
      title: `Interaction: ${interactionType}`,
      content,
      icon: '🐾',
      category: 'social',
      metadata: { interactionType, ...metadata },
    });
  }

  function addAchievement(
    petId: string,
    achievementName: string,
    description: string,
    metadata?: Record<string, unknown>
  ): void {
    addEvent({
      petId,
      type: 'achievement' as TimelineEventType,
      timestamp: new Date().toISOString(),
      title: achievementName,
      content: description,
      icon: '🏆',
      category: 'achievement',
      metadata: { achievementName, ...metadata },
    });
  }

  function addEmotionalChange(
    petId: string,
    fromEmotion: string,
    toEmotion: string,
    reason?: string,
    metadata?: Record<string, unknown>
  ): void {
    addEvent({
      petId,
      type: 'emotional_change' as TimelineEventType,
      timestamp: new Date().toISOString(),
      title: `Emotion: ${fromEmotion} → ${toEmotion}`,
      content: reason || 'Emotional state changed',
      icon: '✨',
      category: 'emotion',
      metadata: { fromEmotion, toEmotion, reason, ...metadata },
    });
  }

  function addKnowledgeShared(
    petId: string,
    topic: string,
    content: string,
    metadata?: Record<string, unknown>
  ): void {
    addEvent({
      petId,
      type: 'knowledge_shared' as TimelineEventType,
      timestamp: new Date().toISOString(),
      title: `Learned: ${topic}`,
      content,
      icon: '📚',
      category: 'learning',
      metadata: { topic, content, ...metadata },
    });
  }

  // Get events within a date range
  function getEventsInRange(
    startDate: string,
    endDate: string
  ): TimelineEvent[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return timelineEvents.value.filter(
      event => {
        const time = new Date(event.timestamp).getTime();
        return time >= start && time <= end;
      }
    );
  }

  // Get events by type
  function getEventsByType(eventType: TimelineEventType): TimelineEvent[] {
    return timelineEvents.value.filter(event => event.type === eventType);
  }

  // Clear old events (keep last N days)
  function clearOldEvents(daysToKeep = 30): void {
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    timelineEvents.value = timelineEvents.value.filter(
      event => new Date(event.timestamp).getTime() > cutoffDate
    );
  }

  // Clear all events
  function clearTimeline(): void {
    timelineEvents.value = [];
    lastEventTime.value = {};
  }

  // Get timeline statistics
  const timelineStats = computed(() => {
    const totalEvents = timelineEvents.value.length;
    const eventTypes: Record<string, number> = {};
    timelineEvents.value.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    return { totalEvents, eventTypes };
  });

  return {
    timelineEvents,
    eventsByDate,
    eventsByType,
    recentEvents,
    emotionalEvents,
    timelineStats,
    addEvent,
    addStatUpdate,
    addInteraction,
    addAchievement,
    addEmotionalChange,
    addKnowledgeShared,
    getEventsInRange,
    getEventsByType,
    clearOldEvents,
    clearTimeline,
  };
});
