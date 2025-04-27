// 已彻底移除 embedding 相关依赖和实现
// 保留类型定义和异常提示

/**
 * Supported embedding model providers. Each provider requires specific environment
 * variables to be set for API access.
 */
export type EmbeddingProvider = "openrouter";

/**
 * Error thrown when an invalid or unsupported embedding provider is specified.
 */
export class UnsupportedProviderError extends Error {
  constructor(provider: string) {
    super(`Embedding is not supported in this build: ${provider}`);
    this.name = "UnsupportedProviderError";
  }
}

/**
 * Creates an embedding model instance based on the specified provider and model name.
 * The provider and model name should be specified in the format "provider:model_name"
 * (e.g., "google:text-embedding-004"). If no provider is specified (i.e., just "model_name"),
 * OpenAI is used as the default provider.
 *
 * Environment variables required per provider:
 * - OpenAI: OPENAI_API_KEY (and optionally OPENAI_API_BASE, OPENAI_ORG_ID)
 * - Google Cloud Vertex AI: GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON)
 * - Google GenAI (Gemini): GOOGLE_API_KEY
 * - AWS: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (or BEDROCK_AWS_REGION)
 * - Microsoft: AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_INSTANCE_NAME, AZURE_OPENAI_API_DEPLOYMENT_NAME, AZURE_OPENAI_API_VERSION
 *
 * @param providerAndModel - The provider and model name in the format "provider:model_name"
 *                          or just "model_name" for OpenAI models.
 * @returns A configured instance of the appropriate Embeddings implementation.
 * @throws {UnsupportedProviderError} If an unsupported provider is specified.
 * @throws {ModelConfigurationError} If there's an issue with the model configuration.
 */
export function createEmbeddingModel(providerAndModel: string): never {
  throw new UnsupportedProviderError(
    "Embedding functionality has been disabled. Please use chat/completions only.",
  );
}
