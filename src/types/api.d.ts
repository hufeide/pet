// OpenAI-compatible API types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface Choice {
  index: number;
  message: ChatMessage;
  finish_reason: 'stop' | 'length' | 'content_filter';
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// LLM API configuration
export interface LLMAPIConfig {
  provider: 'openai' | 'anthropic' | 'qwen' | 'kimi' | 'vllm';
  baseUrl: string;
  apiKey: string;
  model: string;
}

// Image generation API types
export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: '256x256' | '512x512' | '1024x1024';
  quality?: string;
}

export interface ImageGenerationResponse {
  data: ImageData[];
}

export interface ImageData {
  url: string;
  b64_json?: string;
  revised_prompt?: string;
}

// API Response types for Electron IPC
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
