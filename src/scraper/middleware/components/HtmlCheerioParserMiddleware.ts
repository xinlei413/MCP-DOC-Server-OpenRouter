import * as cheerio from "cheerio";
import { logger } from "../../../utils/logger";
import type { ContentProcessingContext, ContentProcessorMiddleware } from "../types";

/**
 * Middleware to parse HTML string/buffer content into a Cheerio object.
 * It populates the `context.dom` property.
 * Assumes the input HTML in `context.content` is the final version to be parsed
 * (e.g., after potential rendering by Playwright or modification by JS execution).
 */
export class HtmlCheerioParserMiddleware implements ContentProcessorMiddleware {
  async process(
    context: ContentProcessingContext,
    next: () => Promise<void>,
  ): Promise<void> {
    // Only process HTML content
    if (!context.contentType.startsWith("text/html")) {
      await next();
      return;
    }

    // Ensure content is a string for Cheerio
    const htmlString =
      typeof context.content === "string"
        ? context.content
        : Buffer.from(context.content).toString("utf-8");

    try {
      logger.debug(`Parsing HTML content with Cheerio from ${context.source}`);
      // Load the HTML string using Cheerio
      const $ = cheerio.load(htmlString);

      // Add the Cheerio API object to the context
      context.dom = $;

      // Proceed to the next middleware
      await next();
    } catch (error) {
      logger.error(`Failed to parse HTML with Cheerio for ${context.source}: ${error}`);
      context.errors.push(
        error instanceof Error
          ? error
          : new Error(`Cheerio HTML parsing failed: ${String(error)}`),
      );
      // Do not proceed further down the pipeline if parsing fails
      return;
    }
  }
}
