import type { DocumentManagementService } from "../store";
import { logger } from "../utils/logger";
import { VersionNotFoundError } from "./errors";

export interface FindVersionToolOptions {
  library: string;
  targetVersion?: string;
}

/**
 * Tool for finding the best matching version of a library in the store.
 * Supports exact version matches and X-Range patterns (e.g., '5.x', '5.2.x').
 */
export class FindVersionTool {
  private docService: DocumentManagementService;

  constructor(docService: DocumentManagementService) {
    this.docService = docService;
  }

  /**
   * Executes the tool to find the best matching version and checks for unversioned docs.
   * @returns A descriptive string indicating the best match and unversioned status, or an error message.
   */
  async execute(options: FindVersionToolOptions): Promise<string> {
    const { library, targetVersion } = options;
    const targetVersionString = targetVersion ? `@${targetVersion}` : "";

    try {
      const { bestMatch, hasUnversioned } = await this.docService.findBestVersion(
        library,
        targetVersion,
      );

      let message = "";
      if (bestMatch) {
        message = `Best match: ${bestMatch}.`;
        if (hasUnversioned) {
          message += " Unversioned docs also available.";
        }
      } else if (hasUnversioned) {
        message = `No matching version found for ${library}${targetVersionString}, but unversioned docs exist.`;
      } else {
        // This case should ideally be caught by VersionNotFoundError below,
        // but added for completeness.
        message = `No matching version or unversioned documents found for ${library}${targetVersionString}.`;
      }
      return message;
    } catch (error) {
      if (error instanceof VersionNotFoundError) {
        // This error is thrown when no semver versions AND no unversioned docs exist.
        logger.info(`ℹ️ Version not found: ${error.message}`);
        return `No matching version or unversioned documents found for ${library}${targetVersionString}. Available: ${
          error.availableVersions.length > 0
            ? error.availableVersions.map((v) => v.version).join(", ")
            : "None"
        }.`;
      }
      // Re-throw unexpected errors
      logger.error(
        `❌ Error finding version for ${library}${targetVersionString}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
