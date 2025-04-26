import { type Mock, describe, expect, it, vi } from "vitest";
import type { ProgressCallback } from "../types";
import { ScraperError } from "../utils/errors";
import type { ScraperRegistry } from "./ScraperRegistry";
import { ScraperService } from "./ScraperService";
import type { ScraperOptions, ScraperProgress, ScraperStrategy } from "./types";

vi.mock("../utils/logger");

describe("ScraperService", () => {
  // Mock registry
  const mockRegistry = {
    getStrategy: vi.fn(),
  };

  // Mock strategy
  const mockStrategy = {
    scrape: vi.fn(),
  };

  it("should use registry to get correct strategy", async () => {
    const service = new ScraperService(mockRegistry as unknown as ScraperRegistry);
    const options: ScraperOptions = {
      url: "https://example.com",
      library: "test",
      version: "1.0",
      maxPages: 10,
      maxDepth: 1,
    };
    const progressCallback: ProgressCallback<ScraperProgress> = vi.fn();

    mockRegistry.getStrategy.mockReturnValue(mockStrategy);
    // Call scrape without a signal (it's optional)
    await service.scrape(options, progressCallback);

    expect(mockRegistry.getStrategy).toHaveBeenCalledWith(options.url);
    // Expect scrape to be called with undefined for the signal
    expect(mockStrategy.scrape).toHaveBeenCalledWith(
      options,
      progressCallback,
      undefined,
    );
  });

  it("should pass progress callback to strategy", async () => {
    const service = new ScraperService(mockRegistry as unknown as ScraperRegistry);
    const options: ScraperOptions = {
      url: "https://example.com",
      library: "test",
      version: "1.0",
      maxPages: 10,
      maxDepth: 1,
    };
    const progressCallback: ProgressCallback<ScraperProgress> = vi.fn();

    mockRegistry.getStrategy.mockReturnValue(mockStrategy);
    // Call scrape without a signal
    await service.scrape(options, progressCallback);

    // Expect scrape to be called with undefined for the signal
    expect(mockStrategy.scrape).toHaveBeenCalledWith(
      options,
      progressCallback,
      undefined,
    );
  });

  it("should handle file:// URLs", async () => {
    const service = new ScraperService(mockRegistry as unknown as ScraperRegistry);
    const options: ScraperOptions = {
      url: "file:///path/to/file.md",
      library: "test",
      version: "1.0",
      maxPages: 10,
      maxDepth: 1,
    };
    const progressCallback: ProgressCallback<ScraperProgress> = vi.fn();

    mockRegistry.getStrategy.mockReturnValue(mockStrategy);
    // Call scrape without a signal
    await service.scrape(options, progressCallback);

    expect(mockRegistry.getStrategy).toHaveBeenCalledWith(options.url);
    // Expect scrape to be called with undefined for the signal
    expect(mockStrategy.scrape).toHaveBeenCalledWith(
      options,
      progressCallback,
      undefined,
    );
  });

  it("should throw error if no strategy found", async () => {
    const service = new ScraperService(mockRegistry as unknown as ScraperRegistry);
    const options: ScraperOptions = {
      url: "unknown://example.com",
      library: "test",
      version: "1.0",
      maxPages: 10,
      maxDepth: 1,
    };
    const progressCallback: ProgressCallback<ScraperProgress> = vi.fn();

    mockRegistry.getStrategy.mockReturnValue(null);

    await expect(service.scrape(options, progressCallback)).rejects.toThrow(ScraperError);
    await expect(service.scrape(options, progressCallback)).rejects.toThrow(
      "No scraper strategy found for URL: unknown://example.com",
    );
  });

  it("should propagate errors from strategy", async () => {
    const service = new ScraperService(mockRegistry as unknown as ScraperRegistry);
    const options: ScraperOptions = {
      url: "https://example.com",
      library: "test",
      version: "1.0",
      maxPages: 10,
      maxDepth: 1,
    };
    const progressCallback: ProgressCallback<ScraperProgress> = vi.fn();

    mockRegistry.getStrategy.mockReturnValue(mockStrategy);
    mockStrategy.scrape.mockRejectedValue(new Error("Strategy error"));

    await expect(service.scrape(options, progressCallback)).rejects.toThrow(
      "Strategy error",
    );
  });
});
