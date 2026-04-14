import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { generateUUID } from '../utils/uuid';

// Interactive entity types
export type InteractiveEntityType = 'pet' | 'player' | 'npc' | 'object' | 'decoration';

// Interactive entity
export interface InteractiveEntity {
  id: string;
  type: InteractiveEntityType;
  name: string;
  position: { x: number; y: number };
  radius: number; // Interaction radius
  isActive: boolean;
  lastInteraction?: string;
  metadata?: Record<string, unknown>;
}

// Interaction event
export interface InteractionEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  targetType: InteractiveEntityType;
  targetId: string;
  targetName: string;
  interactionType: string;
  timestamp: string;
  result: 'success' | 'failed';
  metadata?: Record<string, unknown>;
}

// Interactive zone
export interface InteractiveZone {
  id: string;
  name: string;
  position: { x: number; y: number };
  radius: number;
  type: 'social' | 'activity' | 'resource' | 'safe';
  capacity: number;
  currentOccupants: number;
  metadata?: Record<string, unknown>;
}

export const useInteractiveKingdomStore = defineStore('interactiveKingdom', () => {
  // Interactive entities
  const entities = ref<InteractiveEntity[]>([]);

  // Interactive zones
  const zones = ref<InteractiveZone[]>([]);

  // Interaction history
  const interactionHistory = ref<InteractionEvent[]>([]);

  // Active interaction
  const activeInteraction = ref<InteractionEvent | null>(null);

  // Computed: Get entities by type
  const entitiesByType = computed((): Record<string, InteractiveEntity[]> => {
    const byType: Record<string, InteractiveEntity[]> = {};
    entities.value.forEach(entity => {
      if (!byType[entity.type]) {
        byType[entity.type] = [];
      }
      byType[entity.type].push(entity);
    });
    return byType;
  });

  // Computed: Get active interactions
  const activeInteractions = computed((): InteractionEvent[] => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return interactionHistory.value.filter(
      event => new Date(event.timestamp).getTime() > oneHourAgo
    );
  });

  // Computed: Get entity count by type
  const entityCounts = computed((): Record<string, number> => {
    const counts: Record<string, number> = {};
    entities.value.forEach(entity => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });
    return counts;
  });

  // Computed: Get zone availability
  const zoneAvailability = computed((): Record<string, number> => {
    const availability: Record<string, number> = {};
    zones.value.forEach(zone => {
      availability[zone.id] = zone.capacity - zone.currentOccupants;
    });
    return availability;
  });

  // Actions
  function addEntity(entity: Omit<InteractiveEntity, 'id' | 'isActive' | 'lastInteraction'>): void {
    const newEntity: InteractiveEntity = {
      ...entity,
      id: `entity_${Date.now()}_${generateUUID()}`,
      isActive: true,
      lastInteraction: undefined,
    };

    entities.value.push(newEntity);
  }

  function updateEntity(entityId: string, updates: Partial<InteractiveEntity>): void {
    const entity = entities.value.find(e => e.id === entityId);
    if (entity) {
      Object.assign(entity, updates);
    }
  }

  function removeEntity(entityId: string): void {
    entities.value = entities.value.filter(e => e.id !== entityId);
  }

  function activateInteraction(
    sourceId: string,
    sourceName: string,
    targetType: InteractiveEntityType,
    targetId: string,
    targetName: string,
    interactionType: string
  ): InteractionEvent | null {
    const interaction: InteractionEvent = {
      id: `interaction_${Date.now()}_${generateUUID()}`,
      sourceId,
      sourceName,
      targetType,
      targetId,
      targetName,
      interactionType,
      timestamp: new Date().toISOString(),
      result: 'success',
    };

    interactionHistory.value.push(interaction);

    // Update active interaction
    activeInteraction.value = interaction;

    // Update entity last interaction
    updateEntity(targetId, { lastInteraction: interaction.timestamp });

    // Update zone occupants if in a zone
    updateZoneOccupants(targetId, 1);

    return interaction;
  }

  function completeInteraction(interactionId: string, result: 'success' | 'failed', metadata?: Record<string, unknown>): void {
    const interaction = interactionHistory.value.find(i => i.id === interactionId);
    if (interaction) {
      interaction.result = result;
      if (metadata) {
        interaction.metadata = { ...interaction.metadata, ...metadata };
      }
    }
    activeInteraction.value = null;
  }

  function addZone(zone: Omit<InteractiveZone, 'id' | 'currentOccupants'>): void {
    const newZone: InteractiveZone = {
      ...zone,
      id: `zone_${Date.now()}_${generateUUID()}`,
      currentOccupants: 0,
    };
    zones.value.push(newZone);
  }

  function updateZoneOccupants(entityId: string, change: number): void {
    zones.value.forEach(zone => {
      // Check if entity is in zone
      const entity = entities.value.find(e => e.id === entityId);
      if (entity && isInZone(entity.position, zone)) {
        zone.currentOccupants = Math.max(0, zone.currentOccupants + change);
      }
    });
  }

  // Check if position is within zone
  function isInZone(position: { x: number; y: number }, zone: InteractiveZone): boolean {
    const dx = position.x - zone.position.x;
    const dy = position.y - zone.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= zone.radius;
  }

  function getEntitiesInRange(position: { x: number; y: number }, range: number): InteractiveEntity[] {
    return entities.value.filter(entity => {
      if (!entity.isActive) return false;
      const dx = position.x - entity.position.x;
      const dy = position.y - entity.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= range;
    });
  }

  function getInteractionsByType(interactionType: string): InteractionEvent[] {
    return interactionHistory.value.filter(e => e.interactionType === interactionType);
  }

  function clearOldInteractions(daysToKeep = 7): void {
    const cutoffDate = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    interactionHistory.value = interactionHistory.value.filter(
      event => new Date(event.timestamp).getTime() > cutoffDate
    );
  }

  function resetInteractiveKingdom(): void {
    entities.value = [];
    zones.value = [];
    interactionHistory.value = [];
    activeInteraction.value = null;
  }

  return {
    entities,
    zones,
    interactionHistory,
    activeInteraction,
    entitiesByType,
    activeInteractions,
    entityCounts,
    zoneAvailability,
    addEntity,
    updateEntity,
    removeEntity,
    activateInteraction,
    completeInteraction,
    addZone,
    updateZoneOccupants,
    getEntitiesInRange,
    getInteractionsByType,
    clearOldInteractions,
    resetInteractiveKingdom,
  };
});
