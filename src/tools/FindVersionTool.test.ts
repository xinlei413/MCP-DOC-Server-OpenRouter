import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentManagementService } from "../store";
import { logger } from "../utils/logger";
import { FindVersionTool, type FindVersionToolOptions } from "./FindVersionTool";
import { VersionNotFoundError } from "./errors";

// Mock dependencies
vi.mock("../store"); // Mock the entire store module if DocumentManagementService is complex
vi.mock("../utils/logger");

describe("FindVersionTool", () => {
  let mockDocService: Partial<DocumentManagementService>;
  let findVersionTool: FindVersionTool;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Setup mock DocumentManagementService
    mockDocService = {
      findBestVersion: vi.fn(),
    };

    // Create instance of the tool with the mock service
    findVersionTool = new FindVersionTool(mockDocService as DocumentManagementService);
  });

  it("should return message indicating best match when found", async () => {
    const options: FindVersionToolOptions = { library: "react", targetVersion: "18.2.0" };
    const mockResult = { bestMatch: "18.2.0", hasUnversioned: false };
    (mockDocService.findBestVersion as Mock).mockResolvedValue(mockResult);

    const result = await findVersionTool.execute(options);

    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("react", "18.2.0");
    expect(result).toContain("Best match: 18.2.0");
    expect(result).not.toContain("Unversioned docs");
  });

  it("should return message indicating best match and unversioned docs when both exist", async () => {
    const options: FindVersionToolOptions = { library: "react", targetVersion: "18.x" };
    const mockResult = { bestMatch: "18.3.1", hasUnversioned: true };
    (mockDocService.findBestVersion as Mock).mockResolvedValue(mockResult);

    const result = await findVersionTool.execute(options);

    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("react", "18.x");
    expect(result).toContain("Best match: 18.3.1");
    expect(result).toContain("Unversioned docs also available");
  });

  it("should return message indicating only unversioned docs when no version matches", async () => {
    const options: FindVersionToolOptions = { library: "vue", targetVersion: "4.0.0" };
    const mockResult = { bestMatch: null, hasUnversioned: true };
    (mockDocService.findBestVersion as Mock).mockResolvedValue(mockResult);

    const result = await findVersionTool.execute(options);

    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("vue", "4.0.0");
    expect(result).toContain("No matching version found");
    expect(result).toContain("but unversioned docs exist");
  });

  it("should return message indicating no match when VersionNotFoundError is thrown", async () => {
    const options: FindVersionToolOptions = {
      library: "angular",
      targetVersion: "1.0.0",
    };
    const available = [
      { version: "15.0.0", indexed: true },
      { version: "16.1.0", indexed: false },
    ];
    const error = new VersionNotFoundError("angular", "1.0.0", available);
    (mockDocService.findBestVersion as Mock).mockRejectedValue(error);

    const result = await findVersionTool.execute(options);

    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("angular", "1.0.0");
    expect(result).toContain("No matching version or unversioned documents found");
    expect(result).toContain("Available:"); // Check it mentions availability without exact format
    expect(result).toContain("15.0.0");
    expect(result).toContain("16.1.0");
  });

  it("should return message indicating no match when VersionNotFoundError is thrown with no available versions", async () => {
    const options: FindVersionToolOptions = { library: "unknown-lib" };
    const error = new VersionNotFoundError("unknown-lib", "latest", []); // Assuming default is 'latest' if targetVersion omitted
    (mockDocService.findBestVersion as Mock).mockRejectedValue(error);

    const result = await findVersionTool.execute(options);

    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("unknown-lib", undefined); // targetVersion is undefined
    expect(result).toContain("No matching version or unversioned documents found");
    expect(result).toContain("Available: None");
  });

  it("should re-throw unexpected errors from docService", async () => {
    const options: FindVersionToolOptions = { library: "react" };
    const unexpectedError = new Error("Database connection failed");
    (mockDocService.findBestVersion as Mock).mockRejectedValue(unexpectedError);

    await expect(findVersionTool.execute(options)).rejects.toThrow(
      "Database connection failed",
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle missing targetVersion correctly", async () => {
    const options: FindVersionToolOptions = { library: "react" }; // No targetVersion
    const mockResult = { bestMatch: "18.3.1", hasUnversioned: false };
    (mockDocService.findBestVersion as Mock).mockResolvedValue(mockResult);

    const result = await findVersionTool.execute(options);

    // Check that findBestVersion was called with undefined for targetVersion
    expect(mockDocService.findBestVersion).toHaveBeenCalledWith("react", undefined);
    expect(result).toContain("Best match: 18.3.1");
  });
});
