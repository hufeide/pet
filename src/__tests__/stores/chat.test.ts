/**
 * Unit tests for chat store
 * Tests chat history and message management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../../store/chat.js';
import { createPinia, setActivePinia } from 'pinia';

describe('ChatStore', () => {
  let store: ReturnType<typeof useChatStore>;
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    store = useChatStore();
  });

  it('should initialize with empty messages', () => {
    expect(store.messages).toEqual([]);
  });

  it('should add message to messages', () => {
    // Mock crypto.randomUUID to avoid environment issues
    const originalRandomUUID = crypto.randomUUID;
    (crypto as any).randomUUID = () => 'test-uuid';

    store.addMessage('user', 'Hello');
    expect(store.messages.length).toBe(1);
    expect(store.messages[0].content).toBe('Hello');

    // Restore
    (crypto as any).randomUUID = originalRandomUUID;
  });

  it('should get message history', () => {
    // Mock crypto.randomUUID
    const originalRandomUUID = crypto.randomUUID;
    (crypto as any).randomUUID = () => 'test-uuid';

    store.addMessage('user', 'Hello');
    store.addMessage('assistant', 'Hi there');
    const history = store.getHistory();
    expect(history.length).toBe(2);

    (crypto as any).randomUUID = originalRandomUUID;
  });

  it('should get limited history', () => {
    // Mock crypto.randomUUID
    const originalRandomUUID = crypto.randomUUID;
    (crypto as any).randomUUID = () => 'test-uuid';

    for (let i = 0; i < 10; i++) {
      store.addMessage('user', `Message ${i}`);
    }
    const history = store.getHistory(5);
    expect(history.length).toBe(5);

    (crypto as any).randomUUID = originalRandomUUID;
  });

  it('should clear chat history', () => {
    // Mock crypto.randomUUID
    const originalRandomUUID = crypto.randomUUID;
    (crypto as any).randomUUID = () => 'test-uuid';

    store.addMessage('user', 'Hello');
    store.addMessage('assistant', 'Hi there');
    store.clearMessages();
    expect(store.messages.length).toBe(0);

    (crypto as any).randomUUID = originalRandomUUID;
  });
});
