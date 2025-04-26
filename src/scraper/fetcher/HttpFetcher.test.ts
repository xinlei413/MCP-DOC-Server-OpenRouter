import axios from "axios";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { RedirectError, ScraperError } from "../../utils/errors";
import { HttpFetcher } from "./HttpFetcher";

vi.mock("axios");
vi.mock("../../utils/logger");
const mockedAxios = vi.mocked(axios, true);

describe("HttpFetcher", () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    vi.useFakeTimers(); // Enable fake timers
  });

  afterAll(() => {
    vi.useRealTimers(); // Restore real timers after all tests
  });

  it("should fetch content successfully", async () => {
    const fetcher = new HttpFetcher();
    const mockResponse = {
      data: "<html><body><h1>Hello</h1></body></html>",
      headers: { "content-type": "text/html" },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetcher.fetch("https://example.com");
    expect(result.content).toBe(mockResponse.data);
    expect(result.mimeType).toBe("text/html");
    expect(result.source).toBe("https://example.com");
  });

  it("should handle different content types", async () => {
    const fetcher = new HttpFetcher();
    const mockResponse = {
      data: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      headers: { "content-type": "image/png" },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await fetcher.fetch("https://example.com/image.png");
    expect(result.content).toEqual(mockResponse.data);
    expect(result.mimeType).toBe("image/png");
  });

  it("should not retry on 4xx errors", async () => {
    const fetcher = new HttpFetcher();
    mockedAxios.get.mockRejectedValue({ response: { status: 404 } });

    await expect(fetcher.fetch("https://example.com")).rejects.toThrow(ScraperError);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it("should retry on 5xx errors", async () => {
    const fetcher = new HttpFetcher();
    mockedAxios.get
      .mockRejectedValueOnce({ response: { status: 502 } })
      .mockResolvedValueOnce({
        data: "<html><body><h1>Hello</h1></body></html>",
        headers: { "content-type": "text/html" },
      });

    const fetchPromise = fetcher.fetch("https://example.com");

    // Advance timers by the expected delay for each retry
    await vi.runAllTimersAsync();

    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect((await fetchPromise).content).toBe("<html><body><h1>Hello</h1></body></html>");
  });

  it("should throw error after max retries", async () => {
    const fetcher = new HttpFetcher();
    const maxRetries = 3;
    const baseDelay = 1000;

    mockedAxios.get.mockRejectedValue({ response: { status: 502 } });

    const fetchPromise = fetcher.fetch("https://example.com", {
      maxRetries: maxRetries,
      retryDelay: baseDelay,
    });

    // Advance timers by the expected delay for each retry
    // FIXME: If we use `await` here, the test will fail with an unhandled promise rejection
    vi.runAllTimersAsync();

    await expect(fetchPromise).rejects.toThrow(ScraperError);
    expect(mockedAxios.get).toHaveBeenCalledTimes(maxRetries + 1);
  });

  it("should respect custom headers", async () => {
    const fetcher = new HttpFetcher();
    const mockResponse = {
      data: "<html><body><h1>Hello</h1></body></html>",
      headers: { "content-type": "text/html" },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);
    const headers = { "X-Custom-Header": "value" };

    await fetcher.fetch("https://example.com", { headers });
    expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
      responseType: "arraybuffer",
      headers,
      timeout: undefined,
      maxRedirects: 5, // Default follows redirects
    });
  });

  describe("redirect handling", () => {
    it("should follow redirects by default", async () => {
      const fetcher = new HttpFetcher();
      const mockResponse = {
        data: "<html><body><h1>Hello</h1></body></html>",
        headers: { "content-type": "text/html" },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetcher.fetch("https://example.com");
      expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
        responseType: "arraybuffer",
        headers: undefined,
        timeout: undefined,
        maxRedirects: 5, // Default follows redirects
        signal: undefined,
      });
    });

    it("should follow redirects when followRedirects is true", async () => {
      const fetcher = new HttpFetcher();
      const mockResponse = {
        data: "<html><body><h1>Hello</h1></body></html>",
        headers: { "content-type": "text/html" },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetcher.fetch("https://example.com", { followRedirects: true });
      expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
        responseType: "arraybuffer",
        headers: undefined,
        timeout: undefined,
        maxRedirects: 5,
        signal: undefined,
      });
    });

    it("should not follow redirects when followRedirects is false", async () => {
      const fetcher = new HttpFetcher();
      const mockResponse = {
        data: "<html><body><h1>Hello</h1></body></html>",
        headers: { "content-type": "text/html" },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await fetcher.fetch("https://example.com", { followRedirects: false });
      expect(mockedAxios.get).toHaveBeenCalledWith("https://example.com", {
        responseType: "arraybuffer",
        headers: undefined,
        timeout: undefined,
        maxRedirects: 0, // No redirects allowed
        signal: undefined,
      });
    });

    it("should throw RedirectError when a redirect is encountered and followRedirects is false", async () => {
      const fetcher = new HttpFetcher();
      const redirectError = {
        response: {
          status: 301,
          headers: {
            location: "https://new-example.com",
          },
        },
      };
      mockedAxios.get.mockRejectedValue(redirectError);

      await expect(
        fetcher.fetch("https://example.com", { followRedirects: false }),
      ).rejects.toBeInstanceOf(RedirectError);

      await expect(
        fetcher.fetch("https://example.com", { followRedirects: false }),
      ).rejects.toMatchObject({
        originalUrl: "https://example.com",
        redirectUrl: "https://new-example.com",
        statusCode: 301,
      });
    });
  });
});
