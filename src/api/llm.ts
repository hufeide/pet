import axios, { isAxiosError } from 'axios';
import type { APIResponse } from '../types/api.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export class LLMClient {
  private baseUrl: string;
  private apiKey: string;
  private model: string;

  constructor(config: LLMConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.apiKey = config.apiKey;
    this.model = config.model;
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        throw new Error(
          `API error: ${error.response?.status} ${error.response?.data}`,
        );
      }
      throw new Error(`Failed to get response: ${error}`);
    }
  }

  async chatWithResponse(messages: ChatMessage[]): Promise<APIResponse<string>> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 30000,
        },
      );

      return {
        success: true,
        data: response.data.choices[0].message.content,
      };
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        return {
          success: false,
          error: `API error: ${error.response?.status} ${error.response?.data}`,
        };
      }
      return {
        success: false,
        error: `Failed to get response: ${error}`,
      };
    }
  }
}
