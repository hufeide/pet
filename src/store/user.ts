import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getUserProfile, saveUserProfile } from '../db';
import { generateUUID } from '../utils/uuid';

// User profile interface matching the database schema
export interface UserProfile {
  id: string;
  petId: string;
  name: string;
  bio: string;
  preferences: string[];
  dislikes: string[];
  lastUpdated: string;
}

// Default user profile
const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  petId: 'default',
  name: 'Master',
  bio: 'Pet owner and friend',
  preferences: [],
  dislikes: [],
  lastUpdated: new Date().toISOString(),
};

export const useUserStore = defineStore('user', () => {
  // State
  const profile = ref<UserProfile>(DEFAULT_PROFILE);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const userName = computed(() => profile.value.name);
  const userBio = computed(() => profile.value.bio);
  const userPreferences = computed(() => profile.value.preferences);
  const userDislikes = computed(() => profile.value.dislikes);

  // Actions
  async function loadFromDB(petId = 'default'): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const savedProfile = await getUserProfile(petId);
      if (savedProfile) {
        profile.value = savedProfile;
      }
    } catch (err) {
      error.value = `Failed to load user profile: ${err}`;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveToDB(): Promise<void> {
    try {
      await saveUserProfile(profile.value);
    } catch (err) {
      error.value = `Failed to save user profile: ${err}`;
      throw err;
    }
  }

  async function updateProfile(updates: Partial<UserProfile>): Promise<void> {
    profile.value = { ...profile.value, ...updates, lastUpdated: new Date().toISOString() };
    await saveToDB();
  }

  async function setName(name: string): Promise<void> {
    await updateProfile({ name });
  }

  async function setBio(bio: string): Promise<void> {
    await updateProfile({ bio });
  }

  async function addPreference(preference: string): Promise<void> {
    if (!profile.value.preferences.includes(preference)) {
      await updateProfile({
        preferences: [...profile.value.preferences, preference],
      });
    }
  }

  async function removePreference(preference: string): Promise<void> {
    await updateProfile({
      preferences: profile.value.preferences.filter(p => p !== preference),
    });
  }

  async function addDislike(dislike: string): Promise<void> {
    if (!profile.value.dislikes.includes(dislike)) {
      await updateProfile({
        dislikes: [...profile.value.dislikes, dislike],
      });
    }
  }

  async function removeDislike(dislike: string): Promise<void> {
    await updateProfile({
      dislikes: profile.value.dislikes.filter(d => d !== dislike),
    });
  }

  // Extract user preferences from conversation content
  function extractPreferencesFromConversation(content: string): string[] {
    const preferences: string[] = [];
    const contentLower = content.toLowerCase();

    // Food preferences
    const foodKeywords = ['pizza', 'burger', 'sushi', 'pasta', 'steak', 'salad', 'dessert', 'cake', 'chocolate'];
    for (const keyword of foodKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    // Activity preferences
    const activityKeywords = ['gaming', 'reading', 'music', 'sports', 'travel', 'photography', 'art', 'dance'];
    for (const keyword of activityKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    // Music preferences
    const musicKeywords = ['rock', 'pop', 'jazz', 'classical', 'hip hop', ' electronic', 'country', 'rap'];
    for (const keyword of musicKeywords) {
      if (contentLower.includes(keyword)) {
        preferences.push(keyword);
      }
    }

    return preferences;
  }

  // Extract user dislikes from conversation content
  function extractDislikesFromConversation(content: string): string[] {
    const dislikes: string[] = [];
    const contentLower = content.toLowerCase();

    // Negative sentiment indicators
    const negativeKeywords = ['hate', 'dislike', 'avoid', 'skip', 'never', 'don\'t like', 'not fond'];
    for (const keyword of negativeKeywords) {
      if (contentLower.includes(keyword)) {
        // Try to extract the following word as the dislike
        const match = contentLower.match(new RegExp(`${keyword}\\s+(\\w+)`));
        if (match) {
          dislikes.push(match[1]);
        }
      }
    }

    return dislikes;
  }

  // Initialize default profile if not exists (called on first load)
  async function initializeDefaultProfile(petId = 'default'): Promise<void> {
    try {
      const existing = await getUserProfile(petId);
      if (!existing) {
        const newProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          id: generateUUID(),
          petId,
          lastUpdated: new Date().toISOString(),
        };
        await saveUserProfile(newProfile);
        profile.value = newProfile;
      }
    } catch (err) {
      error.value = `Failed to initialize user profile: ${err}`;
    }
  }

  return {
    profile,
    isLoading,
    error,
    userName,
    userBio,
    userPreferences,
    userDislikes,
    loadFromDB,
    saveToDB,
    updateProfile,
    setName,
    setBio,
    addPreference,
    removePreference,
    addDislike,
    removeDislike,
    extractPreferencesFromConversation,
    extractDislikesFromConversation,
    initializeDefaultProfile,
  };
});
