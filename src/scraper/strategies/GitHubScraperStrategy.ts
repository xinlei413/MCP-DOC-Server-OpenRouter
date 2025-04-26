import type { ProgressCallback } from "../../types";
import type { ScraperOptions, ScraperProgress, ScraperStrategy } from "../types";
import { WebScraperStrategy } from "./WebScraperStrategy";

export class GitHubScraperStrategy implements ScraperStrategy {
  private defaultStrategy: WebScraperStrategy;

  canHandle(url: string): boolean {
    const { hostname } = new URL(url);
    return ["github.com", "www.github.com"].includes(hostname);
  }

  constructor() {
    const shouldFollowLink = (baseUrl: URL, targetUrl: URL) => {
      // Must be in same repository
      if (this.getRepoPath(baseUrl) !== this.getRepoPath(targetUrl)) {
        return false;
      }

      const path = targetUrl.pathname;

      // Root README (repository root)
      if (path === this.getRepoPath(targetUrl)) {
        return true;
      }

      // Wiki pages
      if (path.startsWith(`${this.getRepoPath(targetUrl)}/wiki`)) {
        return true;
      }

      // Markdown files under /blob/
      if (
        path.startsWith(`${this.getRepoPath(targetUrl)}/blob/`) &&
        path.endsWith(".md")
      ) {
        return true;
      }

      return false;
    };

    this.defaultStrategy = new WebScraperStrategy({
      urlNormalizerOptions: {
        ignoreCase: true,
        removeHash: true,
        removeTrailingSlash: true,
        removeQuery: true, // Remove query parameters like ?tab=readme-ov-file
      },
      shouldFollowLink,
    });
  }

  private getRepoPath(url: URL): string {
    // Extract /<org>/<repo> from github.com/<org>/<repo>/...
    const match = url.pathname.match(/^\/[^/]+\/[^/]+/);
    return match?.[0] || "";
  }

  async scrape(
    options: ScraperOptions,
    progressCallback: ProgressCallback<ScraperProgress>,
    signal?: AbortSignal,
  ): Promise<void> {
    // Validate it's a GitHub URL
    const url = new URL(options.url);
    if (!url.hostname.includes("github.com")) {
      throw new Error("URL must be a GitHub URL");
    }

    // Pass signal down to the delegated strategy
    await this.defaultStrategy.scrape(options, progressCallback, signal);
  }
}
