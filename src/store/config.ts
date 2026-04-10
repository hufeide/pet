import { defineStore } from 'pinia';
import { ref } from 'vue';
import { LLMClient } from '../api/llm.js';

interface APIConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  imageModel?: string;
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<APIConfig>({
    provider: 'custom',
    baseUrl: 'http://192.168.1.159:19000/v1',
    apiKey: 'sk-no-key-required',
    model: 'Qwen3Coder',
    imageModel: '',
  });

  const isLoading = ref(false);

  function setConfig(newConfig: APIConfig): void {
    config.value = newConfig;
    localStorage.setItem('llm_config', JSON.stringify(newConfig));
  }

  function getConfig(): APIConfig {
    const saved = localStorage.getItem('llm_config');
    if (saved) {
      return JSON.parse(saved);
    }
    return config.value;
  }

  function clearConfig(): void {
    localStorage.removeItem('llm_config');
    config.value = {
      provider: 'vllm',
      baseUrl: 'http://localhost:8000/v1',
      apiKey: '',
      model: 'default',
      imageModel: '',
    };
  }

  function getApiClient(): LLMClient {
    return new LLMClient({
      baseUrl: config.value.baseUrl,
      apiKey: config.value.apiKey,
      model: config.value.model,
    });
  }

  return {
    config,
    isLoading,
    setConfig,
    getConfig,
    clearConfig,
    getApiClient,
  };
});
