/**
 * Defines the available log levels.
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

let currentLogLevel: LogLevel = LogLevel.INFO; // Default level

/**
 * Sets the current logging level for the application.
 * @param level - The desired log level.
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Provides logging functionalities with level control.
 */
export const logger = {
  /**
   * Logs a debug message if the current log level is DEBUG or higher.
   * @param message - The message to log.
   */
  debug: (message: string) => {
    if (currentLogLevel >= LogLevel.DEBUG) {
      console.debug(message);
    }
  },
  /**
   * Logs an info message if the current log level is INFO or higher.
   * @param message - The message to log.
   */
  info: (message: string) => {
    if (currentLogLevel >= LogLevel.INFO) {
      console.log(message); // Using console.log for INFO
    }
  },
  /**
   * Logs a warning message if the current log level is WARN or higher.
   * @param message - The message to log.
   */
  warn: (message: string) => {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(message);
    }
  },
  /**
   * Logs an error message if the current log level is ERROR or higher (always logs).
   * @param message - The message to log.
   */
  error: (message: string) => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(message);
    }
  },
};
