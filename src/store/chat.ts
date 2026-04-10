import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([]);

  function addMessage(role: 'user' | 'assistant', content: string): string {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    messages.value.push(message);
    return message.id;
  }

  function clearMessages(): void {
    messages.value = [];
  }

  function getHistory(limit = 50): ChatMessage[] {
    return messages.value.slice(-limit);
  }

  return {
    messages,
    addMessage,
    clearMessages,
    getHistory,
  };
});
