import { JSDOM, VirtualConsole } from "jsdom";
import type { ConstructorOptions } from "jsdom";

/**
 * Creates a JSDOM instance with a pre-configured virtual console to suppress console noise.
 * This utility simplifies the setup of JSDOM by providing a standard configuration.
 *
 * @param html - The HTML content to parse.
 * @param options - Optional JSDOM configuration options. These will be merged with the default virtual console setup.
 * @returns A JSDOM instance.
 */
export function createJSDOM(html: string, options?: ConstructorOptions): JSDOM {
  const virtualConsole = new VirtualConsole();
  // Suppress console output from JSDOM by default
  virtualConsole.on("error", () => {});
  virtualConsole.on("warn", () => {});
  virtualConsole.on("info", () => {});
  virtualConsole.on("debug", () => {});
  virtualConsole.on("log", () => {}); // Also suppress regular logs

  const defaultOptions: ConstructorOptions = {
    virtualConsole,
  };

  // Merge provided options with defaults, letting provided options override
  const finalOptions: ConstructorOptions = { ...defaultOptions, ...options };

  return new JSDOM(html, finalOptions);
}
