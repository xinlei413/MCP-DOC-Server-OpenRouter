import type { ProgressCallback } from "../../types";
import type { ScraperOptions, ScraperProgress, ScraperStrategy } from "../types";
import { WebScraperStrategy } from "./WebScraperStrategy";

export class NpmScraperStrategy implements ScraperStrategy {
  private defaultStrategy: WebScraperStrategy;

  canHandle(url: string): boolean {
    const { hostname } = new URL(url);
    return ["npmjs.org", "npmjs.com", "www.npmjs.com"].includes(hostname);
  }

  constructor() {
    this.defaultStrategy = new WebScraperStrategy({
      urlNormalizerOptions: {
        ignoreCase: true,
        removeHash: true,
        removeTrailingSlash: true,
        removeQuery: true, // Enable removeQuery for NPM packages
      },
    });
  }

  async scrape(
    options: ScraperOptions,
    progressCallback: ProgressCallback<ScraperProgress>,
    signal?: AbortSignal,
  ): Promise<void> {
    // Use default strategy with our configuration, passing the signal
    await this.defaultStrategy.scrape(options, progressCallback, signal);
  }
}
