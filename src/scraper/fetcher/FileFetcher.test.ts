import { vol } from "memfs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScraperError } from "../../utils/errors";
import { FileFetcher } from "./FileFetcher";

vi.mock("node:fs/promises", () => ({ default: vol.promises }));
vi.mock("../../utils/logger");

describe("FileFetcher", () => {
  beforeEach(() => {
    vol.reset();
  });

  it("should fetch file content successfully", async () => {
    const fetcher = new FileFetcher();
    const mockContent = "Hello, world!";

    // Create a virtual file system
    vol.fromJSON({
      "/path/to/file.txt": mockContent,
    });

    const result = await fetcher.fetch("file:///path/to/file.txt");
    expect(result.content.toString()).toBe(mockContent);
    expect(result.mimeType).toBe("text/plain");
    expect(result.source).toBe("file:///path/to/file.txt");
    expect(result.encoding).toBe("utf-8");
  });

  it("should handle different file types", async () => {
    const fetcher = new FileFetcher();
    const mockContent = "<h1>Hello</h1>";

    // Create a virtual file system
    vol.fromJSON({
      "/path/to/file.html": mockContent,
    });

    const result = await fetcher.fetch("file:///path/to/file.html");
    expect(result.mimeType).toBe("text/html");
  });

  it("should throw error if file does not exist", async () => {
    const fetcher = new FileFetcher();

    await expect(fetcher.fetch("file:///path/to/file.txt")).rejects.toThrow(ScraperError);
  });

  it("should only handle file protocol", async () => {
    const fetcher = new FileFetcher();
    expect(fetcher.canFetch("https://example.com")).toBe(false);
    expect(fetcher.canFetch("file:///path/to/file.txt")).toBe(true);
  });
});
