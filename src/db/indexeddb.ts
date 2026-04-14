// IndexedDB for browser environment
const DB_NAME = 'AIPetDB';
const DB_VERSION = 3;

// UUID generator for browsers without crypto.randomUUID
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4';
    } else {
      uuid += chars.charAt(Math.floor(Math.random() * 16));
    }
  }
  return uuid;
}

interface PetData {
  id: string;
  name: string;
  level: number;
  experience: number;
  form: string;
  personality: string[];
  stats: {
    happiness: number;
    hunger: number;
    health: number;
    energy: number;
  };
  inventory: any[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  petId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface APIConfig {
  key: string;
  value: string;
}

interface AdventureData {
  id: string;
  petId: string;
  mapId: string;
  position: { x: number; y: number };
  inventory: any[];
  quests: any[];
  totalExperience: number;
  timestamp: string;
}

interface SocialConversation {
  id: string;
  petId: string;
  characterId: string;
  characterRole: string;
  characterName: string;
  questionsAnswered: Array<{
    question: string;
    answer: string;
    llmScore: number;
  }>;
  success: boolean;
  experience: number;
  learnedTips: string[];
  timestamp: string;
  mood: 'happy' | 'neutral' | 'sad' | 'angry';
}

interface MemoryRecord {
  id: string;
  petId: string;
  type: string;
  title: string;
  content: string;
  metadata: string; // JSON string
  timestamp: string;
  usefulness: number;
  tags: string[];
}

interface UserProfile {
  id: string;
  petId: string;
  name: string;
  bio: string;
  preferences: string[];
  dislikes: string[];
  lastUpdated: string;
}

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create pets store
      if (!db.objectStoreNames.contains('pets')) {
        const petsStore = db.createObjectStore('pets', { keyPath: 'id' });
        petsStore.createIndex('id', 'id', { unique: true });
      }

      // Create chat_history store
      if (!db.objectStoreNames.contains('chat_history')) {
        const chatStore = db.createObjectStore('chat_history', { keyPath: 'id' });
        chatStore.createIndex('petId', 'petId', { unique: false });
      }

      // Create api_configs store
      if (!db.objectStoreNames.contains('api_configs')) {
        const configStore = db.createObjectStore('api_configs', { keyPath: 'key' });
      }

      // Create items store
      if (!db.objectStoreNames.contains('items')) {
        const itemsStore = db.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('petId', 'petId', { unique: false });
      }

      // Create adventures store
      if (!db.objectStoreNames.contains('adventures')) {
        const adventureStore = db.createObjectStore('adventures', { keyPath: 'id' });
        adventureStore.createIndex('petId', 'petId', { unique: false });
      }

      // Create social_conversations store
      if (!db.objectStoreNames.contains('social_conversations')) {
        const socialStore = db.createObjectStore('social_conversations', { keyPath: 'id' });
        socialStore.createIndex('petId', 'petId', { unique: false });
      }

      // Create memories store
      if (!db.objectStoreNames.contains('memories')) {
        const memoryStore = db.createObjectStore('memories', { keyPath: 'id' });
        memoryStore.createIndex('petId', 'petId', { unique: false });
        memoryStore.createIndex('type', 'type', { unique: false });
      }

      // Create user_profiles store
      if (!db.objectStoreNames.contains('user_profiles')) {
        const profileStore = db.createObjectStore('user_profiles', { keyPath: 'id' });
        profileStore.createIndex('petId', 'petId', { unique: false });
      }
    };

    request.onsuccess = (event: Event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event: Event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function initSchema(): Promise<void> {
  const db = await getDB();
  db.close();
}

export async function getPet(id: string): Promise<unknown | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readonly');
    const store = transaction.objectStore('pets');
    const request = store.get(id);

    request.onsuccess = () => {
      db.close();
      resolve(request.result || undefined);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function savePet(pet: PetData): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readwrite');
    const store = transaction.objectStore('pets');
    const request = store.put(pet);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deletePet(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readwrite');
    const store = transaction.objectStore('pets');
    const request = store.delete(id);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllPets(): Promise<PetData[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pets', 'readonly');
    const store = transaction.objectStore('pets');
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();
      resolve(request.result || []);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function addChatMessage(
  petId: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const db = await getDB();
  const message: ChatMessage = {
    id: generateUUID(),
    petId,
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chat_history', 'readwrite');
    const store = transaction.objectStore('chat_history');
    const request = store.put(message);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getChatHistory(
  petId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('chat_history', 'readonly');
    const store = transaction.objectStore('chat_history');
    const request = store.getAll();

    request.onsuccess = () => {
      const allMessages = request.result || [];
      const filtered = allMessages
        .filter((msg: ChatMessage) => msg.petId === petId)
        .sort((a: ChatMessage, b: ChatMessage) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .slice(-limit);

      db.close();
      resolve(filtered);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveAPIConfig(config: unknown): Promise<void> {
  const db = await getDB();
  const entry: APIConfig = {
    key: 'llm_config',
    value: JSON.stringify(config),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction('api_configs', 'readwrite');
    const store = transaction.objectStore('api_configs');
    const request = store.put(entry);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAPIConfig(): Promise<unknown | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('api_configs', 'readonly');
    const store = transaction.objectStore('api_configs');
    const request = store.get('llm_config');

    request.onsuccess = () => {
      db.close();
      if (request.result) {
        resolve(JSON.parse(request.result.value));
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Adventure Game DB Functions
export async function saveAdventure(adventure: AdventureData): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('adventures', 'readwrite');
    const store = transaction.objectStore('adventures');
    const request = store.put(adventure);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAdventures(petId: string): Promise<AdventureData[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('adventures', 'readonly');
    const store = transaction.objectStore('adventures');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const filtered = all.filter((a: AdventureData) => a.petId === petId);
      db.close();
      resolve(filtered);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Social Game DB Functions
export async function saveSocialConversation(conversation: SocialConversation): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('social_conversations', 'readwrite');
    const store = transaction.objectStore('social_conversations');
    const request = store.put(conversation);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getSocialConversations(
  petId: string,
  limit = 50,
): Promise<SocialConversation[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('social_conversations', 'readonly');
    const store = transaction.objectStore('social_conversations');
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const filtered = all
        .filter((c: SocialConversation) => c.petId === petId)
        .sort((a: SocialConversation, b: SocialConversation) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        )
        .slice(-limit);
      db.close();
      resolve(filtered);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// Memory System DB Functions
export async function saveMemory(record: Omit<MemoryRecord, 'metadata'> & { metadata: Record<string, unknown> | string }): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('memories', 'readwrite');
    const store = transaction.objectStore('memories');
    const entry = {
      ...record,
      metadata: JSON.stringify(record.metadata),
    };
    const request = store.put(entry);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getMemories(
  petId: string,
  type?: string,
): Promise<MemoryRecord[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('memories', 'readonly');
    const store = transaction.objectStore('memories');
    const request = type
      ? store.index('type').getAll(type)
      : store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const filtered = all.filter((m: MemoryRecord) => m.petId === petId);
      // Parse metadata back to object
      const result = filtered.map((m: MemoryRecord) => ({
        ...m,
        metadata: typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata,
      }));
      db.close();
      resolve(result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getMemorySummary(petId: string): Promise<{
  total: number;
  byType: Record<string, number>;
  averageUsefulness: number;
}> {
  const memories = await getMemories(petId);
  const byType: Record<string, number> = {};
  let totalUsefulness = 0;

  memories.forEach((m) => {
    byType[m.type] = (byType[m.type] || 0) + 1;
    totalUsefulness += m.usefulness;
  });

  return {
    total: memories.length,
    byType,
    averageUsefulness: memories.length > 0 ? totalUsefulness / memories.length : 0,
  };
}

// User Profile DB Functions
export async function getUserProfile(petId: string): Promise<UserProfile | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('user_profiles', 'readonly');
    const store = transaction.objectStore('user_profiles');
    const request = store.index('petId').getAll(petId);

    request.onsuccess = () => {
      const all = request.result || [];
      db.close();
      if (all.length > 0) {
        // Return the first (or only) user profile for this pet
        resolve(all[0]);
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('user_profiles', 'readwrite');
    const store = transaction.objectStore('user_profiles');
    const request = store.put(profile);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('user_profiles', 'readwrite');
    const store = transaction.objectStore('user_profiles');
    const request = store.get(id);

    request.onsuccess = () => {
      const existing = request.result;
      if (existing) {
        const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
        const updateRequest = store.put(updated);
        updateRequest.onsuccess = () => {
          db.close();
          resolve();
        };
        updateRequest.onerror = () => {
          db.close();
          reject(updateRequest.error);
        };
      } else {
        db.close();
        resolve(); // No existing profile to update
      }
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}
