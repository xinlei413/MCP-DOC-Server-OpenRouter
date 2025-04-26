import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockedObject } from "vitest"; // Import MockedObject
import type { DocumentManagementService } from "../store";
import { RemoveTool, type RemoveToolArgs } from "./RemoveTool";
import { ToolError } from "./errors";

// Mock dependencies
vi.mock("../store");
vi.mock("../utils/logger");

// Create a properly typed mock using MockedObject
const mockDocService = {
  removeAllDocuments: vi.fn(),
  // Add other methods used by DocumentManagementService if needed, mocking them with vi.fn()
} as MockedObject<DocumentManagementService>;

describe("RemoveTool", () => {
  let removeTool: RemoveTool;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks(); // Resets all mocks, including those on mockDocService
    removeTool = new RemoveTool(mockDocService); // Pass the typed mock
  });

  it("should call removeAllDocuments with library and version", async () => {
    const args: RemoveToolArgs = { library: "react", version: "18.2.0" };
    // Now TypeScript knows mockDocService.removeAllDocuments is a mock function
    mockDocService.removeAllDocuments.mockResolvedValue(undefined);

    const result = await removeTool.execute(args);

    expect(mockDocService.removeAllDocuments).toHaveBeenCalledTimes(1);
    expect(mockDocService.removeAllDocuments).toHaveBeenCalledWith("react", "18.2.0");
    expect(result).toEqual({
      message: "Successfully removed documents for react@18.2.0.",
    });
  });

  it("should call removeAllDocuments with library and undefined version for unversioned", async () => {
    const args: RemoveToolArgs = { library: "lodash" };
    mockDocService.removeAllDocuments.mockResolvedValue(undefined);

    const result = await removeTool.execute(args);

    expect(mockDocService.removeAllDocuments).toHaveBeenCalledTimes(1);
    expect(mockDocService.removeAllDocuments).toHaveBeenCalledWith("lodash", undefined);
    expect(result).toEqual({
      message: "Successfully removed documents for lodash (unversioned).",
    });
  });

  it("should handle empty string version as unversioned", async () => {
    const args: RemoveToolArgs = { library: "moment", version: "" };
    mockDocService.removeAllDocuments.mockResolvedValue(undefined);

    const result = await removeTool.execute(args);

    expect(mockDocService.removeAllDocuments).toHaveBeenCalledTimes(1);
    expect(mockDocService.removeAllDocuments).toHaveBeenCalledWith("moment", "");
    expect(result).toEqual({
      message: "Successfully removed documents for moment (unversioned).",
    });
  });

  it("should throw ToolError if removeAllDocuments fails", async () => {
    const args: RemoveToolArgs = { library: "vue", version: "3.0.0" };
    const testError = new Error("Database connection failed");
    mockDocService.removeAllDocuments.mockRejectedValue(testError);

    // Use try-catch to ensure the mock call check happens even after rejection
    try {
      await removeTool.execute(args);
    } catch (e) {
      expect(e).toBeInstanceOf(ToolError);
      expect((e as ToolError).message).toContain(
        "Failed to remove documents for vue@3.0.0: Database connection failed",
      );
    }
    // Verify the call happened
    expect(mockDocService.removeAllDocuments).toHaveBeenCalledWith("vue", "3.0.0");
  });

  it("should throw ToolError with correct message for unversioned failure", async () => {
    const args: RemoveToolArgs = { library: "angular" };
    const testError = new Error("Filesystem error");
    mockDocService.removeAllDocuments.mockRejectedValue(testError);

    // Use try-catch to ensure the mock call check happens even after rejection
    try {
      await removeTool.execute(args);
    } catch (e) {
      expect(e).toBeInstanceOf(ToolError);
      expect((e as ToolError).message).toContain(
        "Failed to remove documents for angular (unversioned): Filesystem error",
      );
    }
    // Verify the call happened
    expect(mockDocService.removeAllDocuments).toHaveBeenCalledWith("angular", undefined);
  });
});
