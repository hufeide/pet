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
