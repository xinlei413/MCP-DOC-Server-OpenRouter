import psl from "psl";
import { InvalidUrlError } from "./errors";

interface UrlNormalizerOptions {
  ignoreCase?: boolean;
  removeHash?: boolean;
  removeTrailingSlash?: boolean;
  removeQuery?: boolean;
  removeIndex?: boolean;
}

const defaultNormalizerOptions: UrlNormalizerOptions = {
  ignoreCase: true,
  removeHash: true,
  removeTrailingSlash: true,
  removeQuery: false,
  removeIndex: true,
};

export function normalizeUrl(
  url: string,
  options: UrlNormalizerOptions = defaultNormalizerOptions,
): string {
  try {
    const parsedUrl = new URL(url);
    const finalOptions = { ...defaultNormalizerOptions, ...options };

    // Create a new URL to ensure proper structure
    const normalized = new URL(parsedUrl.origin + parsedUrl.pathname);

    // Remove index files first, before handling trailing slashes
    if (finalOptions.removeIndex) {
      normalized.pathname = normalized.pathname.replace(
        /\/index\.(html|htm|asp|php|jsp)$/i,
        "/",
      );
    }

    // Handle trailing slash
    if (finalOptions.removeTrailingSlash && normalized.pathname.length > 1) {
      normalized.pathname = normalized.pathname.replace(/\/+$/, "");
    }

    // Keep original parts we want to preserve
    const preservedHash = !finalOptions.removeHash ? parsedUrl.hash : "";
    const preservedSearch = !finalOptions.removeQuery ? parsedUrl.search : "";

    // Construct final URL string in correct order (query before hash)
    let result = normalized.origin + normalized.pathname;
    if (preservedSearch) {
      result += preservedSearch;
    }
    if (preservedHash) {
      result += preservedHash;
    }

    // Apply case normalization if configured
    if (finalOptions.ignoreCase) {
      result = result.toLowerCase();
    }

    return result;
  } catch {
    return url; // Return original URL if parsing fails
  }
}

/**
 * Validates if a string is a valid URL
 * @throws {InvalidUrlError} If the URL is invalid
 */
export function validateUrl(url: string): void {
  try {
    new URL(url);
  } catch (error) {
    throw new InvalidUrlError(url, error instanceof Error ? error : undefined);
  }
}

/**
 * Checks if two URLs have the exact same hostname
 */
export function hasSameHostname(urlA: URL, urlB: URL): boolean {
  return urlA.hostname.toLowerCase() === urlB.hostname.toLowerCase();
}

/**
 * Checks if two URLs are on the same domain (including subdomains)
 * Using the public suffix list to properly handle domains like .co.uk
 */
export function hasSameDomain(urlA: URL, urlB: URL): boolean {
  const domainA = psl.get(urlA.hostname.toLowerCase());
  const domainB = psl.get(urlB.hostname.toLowerCase());
  return domainA !== null && domainA === domainB;
}

/**
 * Checks if a target URL is under the same path as the base URL
 * Example: base = https://example.com/docs/
 *          target = https://example.com/docs/getting-started
 *          result = true
 */
export function isSubpath(baseUrl: URL, targetUrl: URL): boolean {
  // Normalize paths to ensure consistent comparison
  const basePath = baseUrl.pathname.endsWith("/")
    ? baseUrl.pathname
    : `${baseUrl.pathname}/`;

  return targetUrl.pathname.startsWith(basePath);
}

export type { UrlNormalizerOptions };
