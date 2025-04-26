import type { JSONSchema7 } from "json-schema";
import type { DocumentManagementService } from "../store";
import { logger } from "../utils/logger";
import { ToolError } from "./errors"; // Keep ToolError for potential internal errors

/**
 * Input schema for the remove_docs tool.
 */
export const RemoveToolInputSchema: JSONSchema7 = {
  type: "object",
  properties: {
    library: {
      type: "string",
      description: "Name of the library",
    },
    version: {
      type: "string",
      description: "Version of the library (optional, removes unversioned if omitted)",
    },
  },
  required: ["library"],
  additionalProperties: false,
};

/**
 * Represents the arguments for the remove_docs tool.
 * The MCP server should validate the input against RemoveToolInputSchema before calling execute.
 */
export interface RemoveToolArgs {
  library: string;
  version?: string;
}

/**
 * Tool to remove indexed documentation for a specific library version.
 * This class provides the core logic, intended to be called by the McpServer.
 */
export class RemoveTool {
  readonly name = "remove_docs";
  readonly description = "Remove indexed documentation for a library version.";
  readonly inputSchema = RemoveToolInputSchema;

  constructor(private readonly documentManagementService: DocumentManagementService) {}

  /**
   * Executes the tool to remove the specified library version documents.
   * Assumes args have been validated by the caller (McpServer) against inputSchema.
   * Returns a simple success message or throws an error.
   */
  async execute(args: RemoveToolArgs): Promise<{ message: string }> {
    const { library, version } = args;

    logger.info(
      `Executing ${this.name} for library: ${library}${version ? `, version: ${version}` : " (unversioned)"}`,
    );

    try {
      // Core logic: Call the document management service
      await this.documentManagementService.removeAllDocuments(library, version);

      const message = `Successfully removed documents for ${library}${version ? `@${version}` : " (unversioned)"}.`;
      logger.info(message);
      // Return a simple success object, the McpServer will format the final response
      return { message };
    } catch (error) {
      const errorMessage = `Failed to remove documents for ${library}${version ? `@${version}` : " (unversioned)"}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(`Error executing ${this.name}: ${errorMessage}`);
      // Re-throw the error for the McpServer to handle and format
      throw new ToolError(errorMessage, this.name);
    }
  }
}
