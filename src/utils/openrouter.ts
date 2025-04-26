import axios from "axios";

export interface OpenRouterChatMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

export interface OpenRouterChatOptions {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  messages: OpenRouterChatMessage[];
  headers?: Record<string, string>;
  extraBody?: Record<string, any>; // 支持扩展 body 字段
}

/**
 * 通用 OpenRouter 聊天模型调用工具，支持多模型（Qwen、Claude、Gemini、Grok、Deepseek、Mistral、GLM、Auto等）
 * @param options OpenRouterChatOptions
 * @returns OpenRouter API 响应
 */
export async function openrouterChat({
  apiKey = process.env.OPENAI_API_KEY,
  model = process.env.MODEL_ID || "qwen/qwen2.5-vl-32b-instruct:free",
  baseURL = process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",
  messages,
  headers = {},
  extraBody = {},
}: OpenRouterChatOptions) {
  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages,
      ...extraBody,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
    }
  );
  return response.data;
}
