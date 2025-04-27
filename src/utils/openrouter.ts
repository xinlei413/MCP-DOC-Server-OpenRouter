import axios from "axios";

export interface OpenRouterChatMessage {
  role: "user" | "assistant" | "system";
  // 支持 string、OpenRouter API 多模态消息格式
  content:
    | string
    | Array<
        { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
      >;
}

export interface OpenRouterChatOptions {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  messages: OpenRouterChatMessage[];
  headers?: Record<string, string>;
  // biome-ignore lint/suspicious/noExplicitAny: OpenRouter API 允许任意扩展字段
  extraBody?: Record<string, any>; // 支持扩展 body 字段
  referer?: string; // HTTP-Referer
  xTitle?: string; // X-Title
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
  referer,
  xTitle,
}: OpenRouterChatOptions) {
  const finalHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...headers,
  };
  if (referer) finalHeaders["HTTP-Referer"] = referer;
  if (xTitle) finalHeaders["X-Title"] = xTitle;

  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages,
      ...extraBody,
    },
    {
      headers: finalHeaders,
    },
  );
  return response.data;
}

// 支持的模型列表（可扩展）
export const OPENROUTER_MODELS = [
  "openai/gpt-4.1",
  "openai/gpt-4.1-mini",
  "anthropic/claude-3.7-sonnet",
  "anthropic/claude-3.7-sonnet:thinking",
  "google/gemini-2.5-pro-preview-03-25",
  "google/gemini-2.5-flash-preview",
  "google/gemini-2.5-flash-preview:thinking",
  "x-ai/grok-3-mini-beta",
  "x-ai/grok-3-beta",
  "qwen/qwen2.5-vl-32b-instruct:free",
  "qwen/qwen2.5-vl-3b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
  "deepseek/deepseek-v3-base:free",
  "microsoft/mai-ds-r1:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "thudm/glm-z1-32b:free",
  "thudm/glm-4-9b:free",
  "thudm/glm-z1-9b:free",
  "openrouter/auto",
  "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
  "shisa-ai/shisa-v2-llama3.3-70b:free",
  "sophosympatheia/rogue-rose-103b-v0.2:free",
];
