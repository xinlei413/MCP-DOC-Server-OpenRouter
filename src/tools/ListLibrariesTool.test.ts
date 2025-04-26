import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentManagementService } from "../store/DocumentManagementService";
import { logger } from "../utils/logger"; // Assuming logger might be used internally, mock it just in case
import { ListLibrariesTool } from "./ListLibrariesTool";

// Mock dependencies
vi.mock("../store/DocumentManagementService");
vi.mock("../utils/logger");

describe("ListLibrariesTool", () => {
  let mockDocService: Partial<DocumentManagementService>;
  let listLibrariesTool: ListLibrariesTool;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Setup mock DocumentManagementService
    mockDocService = {
      listLibraries: vi.fn(),
    };

    // Create instance of the tool with the mock service
    listLibrariesTool = new ListLibrariesTool(
      mockDocService as DocumentManagementService,
    );
  });

  it("should return a list of libraries with their versions", async () => {
    const mockRawLibraries = [
      {
        library: "react",
        versions: [
          { version: "18.2.0", indexed: true },
          { version: "17.0.1", indexed: false },
        ],
      },
      {
        library: "vue",
        versions: [{ version: "3.2.0", indexed: true }],
      },
      {
        library: "unversioned-lib",
        versions: [{ version: "", indexed: true }], // Test unversioned case
      },
    ];
    (mockDocService.listLibraries as Mock).mockResolvedValue(mockRawLibraries);

    const result = await listLibrariesTool.execute();

    expect(mockDocService.listLibraries).toHaveBeenCalledOnce();
    expect(result).toEqual({
      libraries: [
        {
          name: "react",
          versions: [
            { version: "18.2.0", indexed: true },
            { version: "17.0.1", indexed: false },
          ],
        },
        {
          name: "vue",
          versions: [{ version: "3.2.0", indexed: true }],
        },
        {
          name: "unversioned-lib",
          versions: [{ version: "", indexed: true }],
        },
      ],
    });
    // Check structure more generally
    expect(result.libraries).toBeInstanceOf(Array);
    expect(result.libraries.length).toBe(3);
    for (const lib of result.libraries) {
      expect(lib).toHaveProperty("name");
      expect(lib).toHaveProperty("versions");
      expect(lib.versions).toBeInstanceOf(Array);
      for (const v of lib.versions) {
        expect(v).toHaveProperty("version");
        expect(v).toHaveProperty("indexed");
      }
    }
  });

  it("should return an empty list when no libraries are in the store", async () => {
    (mockDocService.listLibraries as Mock).mockResolvedValue([]);

    const result = await listLibrariesTool.execute();

    expect(mockDocService.listLibraries).toHaveBeenCalledOnce();
    expect(result).toEqual({ libraries: [] });
  });

  it("should handle potential errors from the docService", async () => {
    const error = new Error("Failed to access store");
    (mockDocService.listLibraries as Mock).mockRejectedValue(error);

    await expect(listLibrariesTool.execute()).rejects.toThrow("Failed to access store");
  });
});
