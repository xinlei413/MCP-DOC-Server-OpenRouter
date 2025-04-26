import { type Browser, type Page, chromium } from "playwright";
import { logger } from "../../../utils/logger";
import { ScrapeMode } from "../../types"; // Import ScrapeMode
import type { ContentProcessingContext, ContentProcessorMiddleware } from "../types";

/**
 * Middleware to process HTML content using Playwright for rendering dynamic content,
 * *if* the scrapeMode option requires it ('playwright' or 'auto').
 * It updates `context.content` with the rendered HTML if Playwright runs.
 * Subsequent middleware (e.g., HtmlCheerioParserMiddleware) should handle parsing this content.
 */
export class HtmlPlaywrightMiddleware implements ContentProcessorMiddleware {
  private browser: Browser | null = null;

  /**
   * Initializes the Playwright browser instance.
   * Consider making this more robust (e.g., lazy initialization, singleton).
   */
  private async ensureBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      const launchArgs = process.env.PLAYWRIGHT_LAUNCH_ARGS?.split(" ") ?? [];
      logger.debug(
        `Launching new Playwright browser instance (Chromium) with args: ${launchArgs.join(" ") || "none"}...`,
      );
      this.browser = await chromium.launch({ channel: "chromium", args: launchArgs });
      this.browser.on("disconnected", () => {
        logger.debug("Playwright browser instance disconnected.");
        this.browser = null;
      });
    }

    return this.browser;
  }

  /**
   * Closes the Playwright browser instance if it exists.
   * Should be called during application shutdown.
   */
  async closeBrowser(): Promise<void> {
    if (this.browser?.isConnected()) {
      logger.debug("Closing Playwright browser instance...");
      await this.browser.close();
      this.browser = null;
    }
  }

  async process(
    context: ContentProcessingContext,
    next: () => Promise<void>,
  ): Promise<void> {
    // Only process HTML content
    if (!context.contentType.startsWith("text/html")) {
      await next();
      return;
    }

    // Determine if Playwright should run based on scrapeMode
    const scrapeMode = context.options?.scrapeMode ?? ScrapeMode.Auto; // Default to Auto
    const shouldRunPlaywright =
      scrapeMode === ScrapeMode.Playwright || scrapeMode === ScrapeMode.Auto;

    if (!shouldRunPlaywright) {
      logger.debug(
        `Skipping Playwright rendering for ${context.source} as scrapeMode is '${scrapeMode}'.`,
      );
      await next();
      return;
    }

    // --- Playwright Execution Logic ---
    logger.debug(
      `Running Playwright rendering for ${context.source} (scrapeMode: '${scrapeMode}')`,
    );

    let page: Page | null = null;
    let renderedHtml: string | null = null;

    try {
      const browser = await this.ensureBrowser();
      page = await browser.newPage();
      logger.debug(`Playwright: Processing ${context.source}`);

      // Block unnecessary resources
      await page.route("**/*", (route) => {
        if (route.request().url() === context.source) {
          return route.fulfill({
            status: 200,
            contentType: context.contentType,
            body: context.content,
          });
        }

        const resourceType = route.request().resourceType();
        if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
          return route.abort();
        }
        return route.continue();
      });

      // Load initial HTML content
      // Use 'domcontentloaded' as scripts might need the initial DOM structure
      // Use 'networkidle' if waiting for async data fetches is critical, but slower.
      await page.goto(context.source, {
        waitUntil: "load",
      });

      // Optionally, add a small delay or wait for a specific element if needed
      // await page.waitForTimeout(100); // Example: wait 100ms

      // Get the fully rendered HTML
      renderedHtml = await page.content();
      logger.debug(`Playwright: Successfully rendered content for ${context.source}`);
    } catch (error) {
      logger.error(`Playwright failed to render ${context.source}: ${error}`);
      context.errors.push(
        error instanceof Error
          ? error
          : new Error(`Playwright rendering failed: ${String(error)}`),
      );
    } finally {
      // Ensure page is closed even if subsequent steps fail
      if (page) {
        await page.unroute("**/*");
        await page.close();
      }
    }
    // --- End Playwright Execution Logic ---

    // Update context content *only if* Playwright ran and succeeded
    if (renderedHtml !== null) {
      context.content = renderedHtml;
      logger.debug(
        `Playwright middleware updated content for ${context.source}. Proceeding.`,
      );
    } else {
      // Log if Playwright ran but failed to render
      logger.warn(
        `Playwright rendering resulted in null content for ${context.source}. Proceeding without content update.`,
      );
    }

    // Proceed to the next middleware regardless of Playwright success/failure
    await next();
  }
}
