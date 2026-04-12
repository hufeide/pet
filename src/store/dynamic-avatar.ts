import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { PetEmotion } from '../types/pet-kingdom';

// Avatar state
export type AvatarState = 'idle' | 'walking' | 'jumping' | 'eating' | 'sleeping' | 'playing' | 'talking' | 'dancing';

// Avatar animation type
export type AnimationType = 'idle' | 'walk' | 'jump' | 'eat' | 'sleep' | 'play' | 'talk' | 'dance';

// Avatar transformation
export type AvatarTransformation = 'none' | 'happy' | 'sad' | 'excited' | 'sleepy' | 'angry' | 'shiny';

// Avatar appearance
export interface AvatarAppearance {
  form: string;
  color: string;
  size: number; // Scale factor 0.5 - 2.0
  rotation: number; // Degrees
}

// Dynamic avatar state
export interface DynamicAvatarState {
  currentState: AvatarState;
  currentAnimation: AnimationType;
  currentTransformation: AvatarTransformation;
  currentEmotion: PetEmotion;
  appearance: AvatarAppearance;
  lastActivity: string;
  isSleeping: boolean;
  isMoving: boolean;
}

export const useDynamicAvatarStore = defineStore('dynamicAvatar', () => {
  // Current avatar state
  const avatarState = ref<DynamicAvatarState>({
    currentState: 'idle',
    currentAnimation: 'idle',
    currentTransformation: 'none',
    currentEmotion: 'Neutral',
    appearance: {
      form: 'default',
      color: '#ffffff',
      size: 1.0,
      rotation: 0,
    },
    lastActivity: new Date().toISOString(),
    isSleeping: false,
    isMoving: false,
  });

  // Animation duration timer
  const animationTimer = ref<number | null>(null);

  // Computed: Get current emotion emoji
  const emotionEmoji = computed(() => {
    const emotionMap: Record<PetEmotion, string> = {
      Excited: '✨',
      Melancholy: '🌧️',
      Anxious: '😰',
      Lazy: '💤',
      Neutral: '🙂',
    };
    return emotionMap[avatarState.value.currentEmotion] || '🙂';
  });

  // Computed: Get animation based on state
  const currentAnimation = computed((): AnimationType => {
    const stateMap: Record<AvatarState, AnimationType> = {
      idle: 'idle',
      walking: 'walk',
      jumping: 'jump',
      eating: 'eat',
      sleeping: 'sleep',
      playing: 'play',
      talking: 'talk',
      dancing: 'dance',
    };
    return stateMap[avatarState.value.currentState];
  });

  // Computed: Get transformation based on emotion
  const currentTransformation = computed((): AvatarTransformation => {
    const transformationMap: Record<PetEmotion, AvatarTransformation> = {
      Excited: 'excited',
      Melancholy: 'sad',
      Anxious: 'angry',
      Lazy: 'sleepy',
      Neutral: 'none',
    };
    return transformationMap[avatarState.value.currentEmotion];
  });

  // Computed: Is avatar in a dynamic state
  const isDynamic = computed((): boolean => {
    return avatarState.value.currentState !== 'idle' && !avatarState.value.isSleeping;
  });

  // Computed: Get avatar CSS styles
  const avatarStyles = computed(() => {
    const { appearance, isSleeping } = avatarState.value;
    return {
      transform: `scale(${appearance.size}) rotate(${appearance.rotation}deg)`,
      color: appearance.color,
      opacity: isSleeping ? 0.6 : 1,
      transition: 'all 0.3s ease',
    };
  });

  // Actions
  function updateAvatarState(newState: Partial<DynamicAvatarState>): void {
    avatarState.value = { ...avatarState.value, ...newState };
  }

  function setAvatarState(state: AvatarState): void {
    avatarState.value.currentState = state;
    avatarState.value.lastActivity = new Date().toISOString();

    // Update isMoving based on state
    avatarState.value.isMoving = ['walking', 'jumping', 'dancing'].includes(state);

    // Update isSleeping
    avatarState.value.isSleeping = state === 'sleeping';

    // Set appropriate animation
    const animationMap: Record<AvatarState, AnimationType> = {
      idle: 'idle',
      walking: 'walk',
      jumping: 'jump',
      eating: 'eat',
      sleeping: 'sleep',
      playing: 'play',
      talking: 'talk',
      dancing: 'dance',
    };
    avatarState.value.currentAnimation = animationMap[state];
  }

  function setAvatarEmotion(emotion: PetEmotion): void {
    avatarState.value.currentEmotion = emotion;
    avatarState.value.lastActivity = new Date().toISOString();

    // Update transformation based on emotion
    const transformationMap: Record<PetEmotion, AvatarTransformation> = {
      Excited: 'excited',
      Melancholy: 'sad',
      Anxious: 'angry',
      Lazy: 'sleepy',
      Neutral: 'none',
    };
    avatarState.value.currentTransformation = transformationMap[emotion];
  }

  function setAvatarAppearance(appearance: Partial<AvatarAppearance>): void {
    avatarState.value.appearance = { ...avatarState.value.appearance, ...appearance };
  }

  function animate(
    animation: AnimationType,
    duration = 1000
  ): Promise<void> {
    return new Promise(resolve => {
      if (animationTimer.value) {
        clearTimeout(animationTimer.value);
      }

      // Set animation state
      const stateMap: Record<AnimationType, AvatarState> = {
        idle: 'idle',
        walk: 'walking',
        jump: 'jumping',
        eat: 'eating',
        sleep: 'sleeping',
        play: 'playing',
        talk: 'talking',
        dance: 'dancing',
      };
      avatarState.value.currentState = stateMap[animation];

      // Set timer to return to idle
      animationTimer.value = window.setTimeout(() => {
        if (avatarState.value.currentState !== 'sleeping') {
          avatarState.value.currentState = 'idle';
        }
        resolve();
      }, duration);
    });
  }

  function triggerJump(): void {
    animate('jump', 800);
  }

  function triggerDance(): void {
    animate('dance', 2000);
  }

  function triggerEat(): void {
    animate('eat', 1500);
  }

  function triggerSleep(duration = 5000): void {
    setAvatarState('sleeping');
    animationTimer.value = window.setTimeout(() => {
      if (avatarState.value.isSleeping) {
        setAvatarState('idle');
      }
    }, duration);
  }

  function triggerTalk(): void {
    animate('talk', 3000);
  }

  // Reset avatar to default state
  function resetAvatar(): void {
    avatarState.value = {
      currentState: 'idle',
      currentAnimation: 'idle',
      currentTransformation: 'none',
      currentEmotion: 'Neutral',
      appearance: {
        form: 'default',
        color: '#ffffff',
        size: 1.0,
        rotation: 0,
      },
      lastActivity: new Date().toISOString(),
      isSleeping: false,
      isMoving: false,
    };

    if (animationTimer.value) {
      clearTimeout(animationTimer.value);
      animationTimer.value = null;
    }
  }

  // Watch for state changes (debug logging - can be removed in production)
  // watch(
  //   () => avatarState.value.currentState,
  //   (newState, oldState) => {
  //     console.log(`[Avatar] State changed: ${oldState} -> ${newState}`);
  //   }
  // );

  // watch(
  //   () => avatarState.value.currentEmotion,
  //   (newEmotion, oldEmotion) => {
  //     console.log(`[Avatar] Emotion changed: ${oldEmotion} -> ${newEmotion}`);
  //   }
  // );

  return {
    avatarState,
    emotionEmoji,
    currentAnimation,
    currentTransformation,
    isDynamic,
    avatarStyles,
    updateAvatarState,
    setAvatarState,
    setAvatarEmotion,
    setAvatarAppearance,
    animate,
    triggerJump,
    triggerDance,
    triggerEat,
    triggerSleep,
    triggerTalk,
    resetAvatar,
  };
});
