/**
 * Raw content fetched from a source before processing.
 * Includes metadata about the content for proper processing.
 */
export interface RawContent {
  /** Raw content as string or buffer */
  content: string | Buffer;
  /** MIME type of the content */
  mimeType: string;
  /** Original source location */
  source: string;
  /** Character encoding if applicable */
  encoding?: string;
}

/**
 * Options for configuring content fetching behavior
 */
export interface FetchOptions {
  /** Maximum retry attempts for failed fetches */
  maxRetries?: number;
  /** Base delay between retries in milliseconds */
  retryDelay?: number;
  /** Additional headers for HTTP requests */
  headers?: Record<string, string>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Whether to follow HTTP redirects (3xx responses) */
  followRedirects?: boolean;
}

/**
 * Interface for fetching content from different sources
 */
export interface ContentFetcher {
  /**
   * Check if this fetcher can handle the given source
   */
  canFetch(source: string): boolean;

  /**
   * Fetch content from the source
   */
  fetch(source: string, options?: FetchOptions): Promise<RawContent>;
}
