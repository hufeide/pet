<template>
  <div class="config-panel">
    <h3>API Configuration</h3>
    <p class="config-desc">Configure your LLM API endpoint and key</p>

    <form @submit.prevent="saveConfig" class="config-form">
      <div class="form-group">
        <label for="provider">LLM Provider</label>
        <select
          id="provider"
          v-model="config.provider"
          required
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="qwen">通义千问 (Qwen)</option>
          <option value="kimi">Kimi (月之暗面)</option>
          <option value="vllm">Local vLLM</option>
          <option value="custom">Custom (OpenAI-compatible)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="baseUrl">API Endpoint</label>
        <input
          id="baseUrl"
          v-model="config.baseUrl"
          type="url"
          placeholder="https://api.openai.com/v1"
          required
        />
        <p class="form-hint">For vLLM, use: http://localhost:8000/v1</p>
      </div>

      <div class="form-group">
        <label for="apiKey">API Key</label>
        <input
          id="apiKey"
          v-model="config.apiKey"
          type="password"
          placeholder="sk-..."
          required
        />
      </div>

      <div class="form-group">
        <label for="model">Model Name</label>
        <input
          id="model"
          v-model="config.model"
          type="text"
          placeholder="gpt-4"
          required
        />
      </div>

      <div class="form-group">
        <label for="imageModel">Image Generation Model (Optional)</label>
        <input
          id="imageModel"
          v-model="config.imageModel"
          type="text"
          placeholder="dall-e-3"
        />
        <p class="form-hint">For local image gen, use: http://localhost:7860</p>
      </div>

      <div class="form-actions">
        <button type="button" @click="testConnection" :disabled="testing">
          {{ testing ? 'Testing...' : 'Test Connection' }}
        </button>
        <button
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Saving...' : 'Save Configuration' }}
        </button>
      </div>

      <div v-if="message" :class="['message', 'message-' + message.type]">
        {{ message.text }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useConfigStore } from '../store/config';

const configStore = useConfigStore();

const config = reactive({
  provider: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  imageModel: '',
});

const testing = ref(false);
const saving = ref(false);
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null);

onMounted(() => {
  // Load config from store
  config.provider = configStore.config.provider;
  config.baseUrl = configStore.config.baseUrl;
  config.apiKey = configStore.config.apiKey;
  config.model = configStore.config.model;
  config.imageModel = configStore.config.imageModel || '';
});

async function testConnection() {
  testing.value = true;
  message.value = null;

  try {
    const client = configStore.getApiClient();
    
    // Test with a simple message
    const result = await client.chatWithResponse([
      { role: 'user', content: 'hi' },
    ]);

    if (result.success) {
      message.value = {
        type: 'success',
        text: 'Connection successful! API is working.',
      };
    } else {
      message.value = {
        type: 'error',
        text: `Connection failed: ${result.error}`,
      };
    }
  } catch (err) {
    message.value = {
      type: 'error',
      text: `Connection failed: ${err}`,
    };
  } finally {
    testing.value = false;
  }
}

function saveConfig() {
  saving.value = true;

  try {
    const newConfig = {
      provider: config.provider as any,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      model: config.model,
      imageModel: config.imageModel,
    };

    configStore.setConfig(newConfig);
    
    message.value = {
      type: 'success',
      text: 'Configuration saved successfully!',
    };
  } catch (err) {
    message.value = {
      type: 'error',
      text: `Failed to save: ${err}`,
    };
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.config-panel {
  padding: 20px;
}

.config-panel h3 {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
}

.config-desc {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 0.9rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1976D2;
}

.form-hint {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.form-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.form-actions button:first-child {
  background: #E0E0E0;
  color: #333;
}

.form-actions button:first-child:hover:not(:disabled) {
  background: #D0D0D0;
}

.form-actions button:last-child {
  background: #1976D2;
  color: white;
}

.form-actions button:last-child:hover:not(:disabled) {
  background: #1565C0;
}

.form-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 0.9rem;
}

.message-success {
  background: #E8F5E9;
  color: #2E7D32;
  border-left: 4px solid #2E7D32;
}

.message-error {
  background: #FFEBEE;
  color: #C62828;
  border-left: 4px solid #C62828;
}
</style>
