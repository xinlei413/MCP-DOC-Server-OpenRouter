import path from "node:path";
import { Document } from "@langchain/core/documents";
import { createFsFromVolume, vol } from "memfs"; // Import memfs volume
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LibraryNotFoundError, VersionNotFoundError } from "../tools/errors";
import { DocumentManagementService } from "./DocumentManagementService";
import { StoreError } from "./errors";

vi.mock("node:fs", () => ({ default: createFsFromVolume(vol) }));
vi.mock("../utils/logger");

// Mock env-paths using mockImplementation
const mockEnvPaths = { data: "/mock/env/path/data" };
const mockEnvPathsFn = vi.fn().mockReturnValue(mockEnvPaths); // Keep the spy/implementation separate
vi.mock("env-paths", () => ({
  // Mock with a placeholder function initially
  default: vi.fn(),
}));

// Import the mocked function AFTER vi.mock
import envPaths from "env-paths";

// Assign the actual implementation to the mocked function
vi.mocked(envPaths).mockImplementation(mockEnvPathsFn);

// Define the instance methods mock
const mockStore = {
  initialize: vi.fn(),
  shutdown: vi.fn(),
  queryUniqueVersions: vi.fn(),
  checkDocumentExists: vi.fn(),
  queryLibraryVersions: vi.fn(),
  addDocuments: vi.fn(),
  deleteDocuments: vi.fn(),
};

// Mock the DocumentStore module
vi.mock("./DocumentStore", () => {
  // Create the mock constructor *inside* the factory function
  const MockDocumentStore = vi.fn(() => mockStore);
  return { DocumentStore: MockDocumentStore };
});

// Import the mocked constructor AFTER vi.mock
import { DocumentStore } from "./DocumentStore";

// Mock DocumentRetrieverService (keep existing structure)
const mockRetriever = {
  search: vi.fn(),
};

vi.mock("./DocumentRetrieverService", () => ({
  DocumentRetrieverService: vi.fn().mockImplementation(() => mockRetriever),
}));

// --- END MOCKS ---

describe("DocumentManagementService", () => {
  let docService: DocumentManagementService; // For general tests

  // Define expected paths consistently
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const expectedOldDbPath = path.join(projectRoot, ".store", "documents.db");
  const expectedStandardDbPath = path.join(mockEnvPaths.data, "documents.db");

  beforeEach(() => {
    vi.clearAllMocks();
    vol.reset(); // Reset memfs
    // Ensure envPaths mock is reset/set for general tests
    mockEnvPathsFn.mockReturnValue(mockEnvPaths);

    // Initialize the main service instance used by most tests
    // This will now use memfs for its internal fs calls
    docService = new DocumentManagementService();
  });

  afterEach(async () => {
    // Shutdown the main service instance
    await docService?.shutdown();
  });

  // --- Constructor Path Logic Tests ---
  describe("Constructor Database Path Selection", () => {
    // Add beforeEach specific to this suite for memfs reset
    beforeEach(() => {
      vol.reset(); // Reset memfs volume before each test
      vi.clearAllMocks(); // Clear other mocks like DocumentStore constructor
      // Re-apply default envPaths mock for this suite
      mockEnvPathsFn.mockReturnValue(mockEnvPaths);
    });

    it("should use the old local path if it exists", () => {
      // Simulate the old path existing in memfs
      vol.mkdirSync(path.dirname(expectedOldDbPath), { recursive: true });
      vol.writeFileSync(expectedOldDbPath, ""); // Create the file

      // Instantiate LOCALLY for this specific test
      const localDocService = new DocumentManagementService();

      // Verify DocumentStore was called with the old path
      expect(vi.mocked(DocumentStore)).toHaveBeenCalledWith(expectedOldDbPath);
      // Verify the directory still exists (mkdirSync shouldn't error)
      expect(vol.existsSync(path.dirname(expectedOldDbPath))).toBe(true);
    });

    it("should use the standard env path if the old local path does not exist", () => {
      // Ensure old path doesn't exist (handled by vol.reset() in beforeEach)
      // Ensure envPaths mock returns the expected value
      mockEnvPathsFn.mockReturnValue(mockEnvPaths);

      // Instantiate LOCALLY for this specific test
      const localDocService = new DocumentManagementService();

      // Verify DocumentStore was called with the standard path
      expect(vi.mocked(DocumentStore)).toHaveBeenCalledWith(expectedStandardDbPath);
      // Verify envPaths was called
      expect(mockEnvPathsFn).toHaveBeenCalledWith("docs-mcp-server", { suffix: "" });
      // Verify the standard directory was created in memfs
      expect(vol.existsSync(path.dirname(expectedStandardDbPath))).toBe(true);
    });

    it("should use the path from DOCS_MCP_STORE_PATH environment variable if set", () => {
      const mockEnvStorePath = "/mock/env/store/path";
      const expectedEnvDbPath = path.join(mockEnvStorePath, "documents.db");
      const originalEnvValue = process.env.DOCS_MCP_STORE_PATH; // Store original value
      process.env.DOCS_MCP_STORE_PATH = mockEnvStorePath; // Set env var

      try {
        // Ensure neither old nor standard paths exist initially for isolation
        // (vol.reset() in beforeEach should handle this)

        // Instantiate LOCALLY for this specific test
        const localDocService = new DocumentManagementService();

        // Verify DocumentStore was called with the env var path
        expect(vi.mocked(DocumentStore)).toHaveBeenCalledWith(expectedEnvDbPath);
        // Verify the env var directory was created in memfs
        expect(vol.existsSync(mockEnvStorePath)).toBe(true);
        // Verify other paths were NOT created (optional but good check)
        expect(vol.existsSync(path.dirname(expectedOldDbPath))).toBe(false);
        expect(vol.existsSync(path.dirname(expectedStandardDbPath))).toBe(false);
        // Verify envPaths was NOT called
        expect(mockEnvPathsFn).not.toHaveBeenCalled();
        // Verify fs.existsSync was NOT called for the old path check
        // (We need to spy on fs.existsSync for this) - Let's skip this assertion for now as it requires more mock setup
      } finally {
        // Restore original env var value
        process.env.DOCS_MCP_STORE_PATH = originalEnvValue;
      }
    });
  });
  // --- END: Constructor Path Logic Tests ---

  // --- Existing Tests (Rely on global docService and mocks) ---
  // Grouped existing tests for clarity
  describe("Initialization and Shutdown", () => {
    it("should initialize correctly", async () => {
      // Uses global docService initialized in beforeEach
      await docService.initialize();
      expect(mockStore.initialize).toHaveBeenCalled();
    });

    it("should shutdown correctly", async () => {
      // Uses global docService initialized in beforeEach
      await docService.shutdown();
      expect(mockStore.shutdown).toHaveBeenCalled();
    });
  });

  describe("Core Functionality", () => {
    // Uses global docService initialized in beforeEach

    it("should handle empty store existence check", async () => {
      mockStore.checkDocumentExists.mockResolvedValue(false); // Use mockStoreInstance
      const exists = await docService.exists("test-lib", "1.0.0");
      expect(exists).toBe(false);
      expect(mockStore.checkDocumentExists).toHaveBeenCalledWith("test-lib", "1.0.0");
    });

    describe("document processing", () => {
      it("should add and search documents with basic metadata", async () => {
        const library = "test-lib";
        const version = "1.0.0";
        const validDocument = new Document({
          pageContent: "Test document content about testing",
          metadata: {
            url: "http://example.com",
            title: "Test Doc",
          },
        });

        const documentNoUrl = new Document({
          pageContent: "Test document without URL",
          metadata: {
            title: "Test Doc",
          },
        });

        // Should fail when URL is missing
        await expect(
          docService.addDocument(library, version, documentNoUrl),
        ).rejects.toThrow(StoreError);

        await expect(
          docService.addDocument(library, version, documentNoUrl),
        ).rejects.toHaveProperty("message", "Document metadata must include a valid URL");

        // Should succeed with valid URL
        mockRetriever.search.mockResolvedValue(["Mocked search result"]);

        await docService.addDocument(library, version, validDocument);

        const results = await docService.searchStore(library, version, "testing");
        expect(mockStore.addDocuments).toHaveBeenCalledWith(
          // Fix: Use mockStoreInstance
          library,
          version,
          expect.arrayContaining([
            expect.objectContaining({ pageContent: validDocument.pageContent }),
          ]),
        );
        expect(results).toEqual(["Mocked search result"]); // Expect mocked result
      });

      it("should preserve semantic metadata when processing markdown documents", async () => {
        const library = "test-lib";
        const version = "1.0.0";
        const document = new Document({
          pageContent: "# Chapter 1\nTest content\n## Section 1.1\nMore testing content",
          metadata: {
            url: "http://example.com/docs",
            title: "Root Doc",
          },
        });

        // Mock the search result to match what would actually be stored after processing
        mockRetriever.search.mockResolvedValue(["Mocked search result"]);

        await docService.addDocument(library, version, document);

        // Verify the documents were stored with semantic metadata
        expect(mockStore.addDocuments).toHaveBeenCalledWith(
          // Fix: Use mockStoreInstance
          library,
          version,
          expect.arrayContaining([
            expect.objectContaining({
              metadata: expect.objectContaining({
                level: 1,
                path: expect.arrayContaining(["Chapter 1", "Section 1.1"]),
              }),
            }),
          ]),
        );

        // Verify search results preserve metadata
        const results = await docService.searchStore(library, version, "testing");
        expect(results).toEqual(["Mocked search result"]);
      });
    });

    it("should remove all documents for a specific library and version", async () => {
      const library = "test-lib";
      const version = "1.0.0";

      await docService.removeAllDocuments(library, version);
      expect(mockStore.deleteDocuments).toHaveBeenCalledWith(library, version); // Fix: Use mockStoreInstance
    });

    it("should handle removing documents with null/undefined/empty version", async () => {
      const library = "test-lib";
      await docService.removeAllDocuments(library, null);
      expect(mockStore.deleteDocuments).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
      await docService.removeAllDocuments(library, undefined);
      expect(mockStore.deleteDocuments).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
      await docService.removeAllDocuments(library, "");
      expect(mockStore.deleteDocuments).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
    });

    describe("listVersions", () => {
      it("should return an empty array if the library has no documents", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue([]); // Fix: Use mockStoreInstance
        const versions = await docService.listVersions("nonexistent-lib");
        expect(versions).toEqual([]);
      });

      it("should return an array of indexed versions", async () => {
        const library = "test-lib";
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "1.1.0", "1.2.0"]); // Fix: Use mockStoreInstance

        const versions = await docService.listVersions(library);
        expect(versions).toEqual([
          { version: "1.0.0", indexed: true },
          { version: "1.1.0", indexed: true },
          { version: "1.2.0", indexed: true },
        ]);
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(library); // Fix: Use mockStoreInstance
      });

      it("should filter out empty string and non-semver versions", async () => {
        const library = "test-lib";
        mockStore.queryUniqueVersions.mockResolvedValue([
          // Fix: Use mockStoreInstance
          "1.0.0",
          "",
          "invalid-version",
          "2.0.0-beta", // Valid semver, should be included
          "2.0.0",
        ]);

        const versions = await docService.listVersions(library);
        expect(versions).toEqual([
          { version: "1.0.0", indexed: true },
          { version: "2.0.0-beta", indexed: true },
          { version: "2.0.0", indexed: true },
        ]);
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(library); // Fix: Use mockStoreInstance
      });
    });

    describe("findBestVersion", () => {
      const library = "test-lib";

      beforeEach(() => {
        // Reset mocks for checkDocumentExists for each test
        mockStore.checkDocumentExists.mockResolvedValue(false); // Fix: Use mockStoreInstance
      });

      it("should return best match and hasUnversioned=false when only semver exists", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "1.1.0", "2.0.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // No unversioned // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library, "1.5.0");
        expect(result).toEqual({ bestMatch: "1.1.0", hasUnversioned: false });
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(library); // Fix: Use mockStoreInstance
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
      });

      it("should return latest match and hasUnversioned=false for 'latest'", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "2.0.0", "3.0.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // Fix: Use mockStoreInstance

        const latestResult = await docService.findBestVersion(library, "latest");
        expect(latestResult).toEqual({ bestMatch: "3.0.0", hasUnversioned: false });

        const defaultResult = await docService.findBestVersion(library); // No target version
        expect(defaultResult).toEqual({ bestMatch: "3.0.0", hasUnversioned: false });
      });

      it("should return best match and hasUnversioned=true when both exist", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "1.1.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Unversioned exists // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library, "1.0.x");
        expect(result).toEqual({ bestMatch: "1.0.0", hasUnversioned: true });
      });

      it("should return latest match and hasUnversioned=true when both exist (latest)", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "2.0.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library);
        expect(result).toEqual({ bestMatch: "2.0.0", hasUnversioned: true });
      });

      it("should return null bestMatch and hasUnversioned=true when only unversioned exists", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue([""]); // listVersions filters this out // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Unversioned exists // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library);
        expect(result).toEqual({ bestMatch: null, hasUnversioned: true });

        const resultSpecific = await docService.findBestVersion(library, "1.0.0");
        expect(resultSpecific).toEqual({ bestMatch: null, hasUnversioned: true });
      });

      it("should return fallback match and hasUnversioned=true when target is higher but unversioned exists", async () => {
        // Renamed test for clarity
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "1.1.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Unversioned exists // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library, "3.0.0"); // Target higher than available
        // Expect fallback to latest available (1.1.0) because a version was requested
        expect(result).toEqual({ bestMatch: "1.1.0", hasUnversioned: true }); // Corrected expectation
      });

      it("should return fallback match and hasUnversioned=false when target is higher and only semver exists", async () => {
        // New test for specific corner case
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0", "1.1.0"]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // No unversioned // Fix: Use mockStoreInstance

        const result = await docService.findBestVersion(library, "3.0.0"); // Target higher than available
        // Expect fallback to latest available (1.1.0)
        expect(result).toEqual({ bestMatch: "1.1.0", hasUnversioned: false });
      });

      it("should throw VersionNotFoundError when no versions (semver or unversioned) exist", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue([]); // No semver // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // No unversioned // Fix: Use mockStoreInstance

        await expect(docService.findBestVersion(library, "1.0.0")).rejects.toThrow(
          VersionNotFoundError,
        );
        await expect(docService.findBestVersion(library)).rejects.toThrow(
          VersionNotFoundError,
        );

        // Check error details
        const error = await docService.findBestVersion(library).catch((e) => e);
        expect(error).toBeInstanceOf(VersionNotFoundError);
        expect(error.library).toBe(library);
        expect(error.requestedVersion).toBe(""); // Default requested version is empty
        expect(error.availableVersions).toEqual([]); // No valid semver versions found
      });

      it("should not throw for invalid target version format if unversioned exists", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0"]); // Has semver // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Has unversioned // Fix: Use mockStoreInstance

        // Invalid format, but unversioned exists, so should return null match
        const result = await docService.findBestVersion(library, "invalid-format");
        expect(result).toEqual({ bestMatch: null, hasUnversioned: true });
      });

      it("should throw VersionNotFoundError for invalid target version format if only semver exists", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0"]); // Has semver // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // No unversioned // Fix: Use mockStoreInstance

        // Invalid format, no unversioned fallback -> throw
        await expect(
          docService.findBestVersion(library, "invalid-format"),
        ).rejects.toThrow(VersionNotFoundError);
      });
    });

    describe("listLibraries", () => {
      it("should list libraries and their versions", async () => {
        const mockLibraryMap = new Map([
          ["lib1", new Set(["1.0.0", "1.1.0"])],
          ["lib2", new Set(["2.0.0"])],
        ]);
        mockStore.queryLibraryVersions.mockResolvedValue(mockLibraryMap); // Fix: Use mockStoreInstance

        const result = await docService.listLibraries();
        expect(result).toEqual([
          {
            library: "lib1",
            versions: [
              { version: "1.0.0", indexed: true },
              { version: "1.1.0", indexed: true },
            ],
          },
          {
            library: "lib2",
            versions: [{ version: "2.0.0", indexed: true }],
          },
        ]);
      });

      it("should return an empty array if there are no libraries", async () => {
        mockStore.queryLibraryVersions.mockResolvedValue(new Map()); // Fix: Use mockStoreInstance
        const result = await docService.listLibraries();
        expect(result).toEqual([]);
      });

      it("should filter out empty string versions from the list", async () => {
        const mockLibraryMap = new Map([
          ["lib1", new Set(["1.0.0", ""])], // Has empty version
          ["lib2", new Set(["2.0.0"])],
          ["lib3", new Set([""])], // Only has empty version
        ]);
        mockStore.queryLibraryVersions.mockResolvedValue(mockLibraryMap); // Fix: Use mockStoreInstance

        const result = await docService.listLibraries();
        expect(result).toEqual([
          {
            library: "lib1",
            versions: [{ version: "1.0.0", indexed: true }], // Empty version filtered out
          },
          {
            library: "lib2",
            versions: [{ version: "2.0.0", indexed: true }],
          },
          {
            library: "lib3",
            versions: [], // Empty version filtered out, resulting in empty array
          },
        ]);
      });
    });

    // Tests for handling optional version parameter (null/undefined/"")
    describe("Optional Version Handling", () => {
      const library = "opt-lib";
      const doc = new Document({
        pageContent: "Optional version test",
        metadata: { url: "http://opt.com" },
      });
      const query = "optional";

      it("exists should normalize version to empty string", async () => {
        await docService.exists(library, null);
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
        await docService.exists(library, undefined);
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
        await docService.exists(library, "");
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(library, ""); // Fix: Use mockStoreInstance
      });

      it("addDocument should normalize version to empty string", async () => {
        await docService.addDocument(library, null, doc);
        expect(mockStore.addDocuments).toHaveBeenCalledWith(
          library,
          "",
          expect.any(Array),
        ); // Fix: Use mockStoreInstance
        await docService.addDocument(library, undefined, doc);
        expect(mockStore.addDocuments).toHaveBeenCalledWith(
          library,
          "",
          expect.any(Array),
        ); // Fix: Use mockStoreInstance
        await docService.addDocument(library, "", doc);
        expect(mockStore.addDocuments).toHaveBeenCalledWith(
          library,
          "",
          expect.any(Array),
        ); // Fix: Use mockStoreInstance
      });

      it("searchStore should normalize version to empty string", async () => {
        // Call without explicit limit, should use default limit of 5
        await docService.searchStore(library, null, query);
        expect(mockRetriever.search).toHaveBeenCalledWith(library, "", query, 5); // Expect default limit 5

        // Call with explicit limit
        await docService.searchStore(library, undefined, query, 7);
        expect(mockRetriever.search).toHaveBeenCalledWith(library, "", query, 7);

        // Call with another explicit limit
        await docService.searchStore(library, "", query, 10);
        expect(mockRetriever.search).toHaveBeenCalledWith(library, "", query, 10);
      });
    });

    describe("validateLibraryExists", () => {
      const library = "test-lib";
      const existingLibraries = [
        { library: "test-lib", versions: [{ version: "1.0.0", indexed: true }] },
        { library: "another-lib", versions: [{ version: "2.0.0", indexed: true }] },
        { library: "react", versions: [] },
      ];

      it("should resolve successfully if versioned documents exist", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue(["1.0.0"]); // Has versioned docs // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // No unversioned docs // Fix: Use mockStoreInstance

        await expect(docService.validateLibraryExists(library)).resolves.toBeUndefined();
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(library.toLowerCase()); // Fix: Use mockStoreInstance
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(
          // Fix: Use mockStoreInstance
          library.toLowerCase(),
          "",
        );
      });

      it("should resolve successfully if only unversioned documents exist", async () => {
        mockStore.queryUniqueVersions.mockResolvedValue([]); // No versioned docs // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(true); // Has unversioned docs // Fix: Use mockStoreInstance

        await expect(docService.validateLibraryExists(library)).resolves.toBeUndefined();
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(library.toLowerCase()); // Fix: Use mockStoreInstance
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(
          // Fix: Use mockStoreInstance
          library.toLowerCase(),
          "",
        );
      });

      it("should throw LibraryNotFoundError if library does not exist (no suggestions)", async () => {
        const nonExistentLibrary = "non-existent-lib";
        mockStore.queryUniqueVersions.mockResolvedValue([]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // Fix: Use mockStoreInstance
        mockStore.queryLibraryVersions.mockResolvedValue(new Map()); // No libraries exist at all // Fix: Use mockStoreInstance

        await expect(
          docService.validateLibraryExists(nonExistentLibrary),
        ).rejects.toThrow(LibraryNotFoundError);

        const error = await docService
          .validateLibraryExists(nonExistentLibrary)
          .catch((e) => e);
        expect(error).toBeInstanceOf(LibraryNotFoundError);
        expect(error.requestedLibrary).toBe(nonExistentLibrary);
        expect(error.suggestions).toEqual([]);
        expect(mockStore.queryLibraryVersions).toHaveBeenCalled(); // Ensure it tried to get suggestions // Fix: Use mockStoreInstance
      });

      it("should throw LibraryNotFoundError with suggestions if library does not exist", async () => {
        const misspelledLibrary = "reac"; // Misspelled 'react'
        mockStore.queryUniqueVersions.mockResolvedValue([]); // Fix: Use mockStoreInstance
        mockStore.checkDocumentExists.mockResolvedValue(false); // Fix: Use mockStoreInstance
        // Mock listLibraries to return existing libraries
        const mockLibraryMap = new Map(
          existingLibraries.map((l) => [
            l.library,
            new Set(l.versions.map((v) => v.version)),
          ]),
        );
        mockStore.queryLibraryVersions.mockResolvedValue(mockLibraryMap); // Fix: Use mockStoreInstance

        await expect(docService.validateLibraryExists(misspelledLibrary)).rejects.toThrow(
          LibraryNotFoundError,
        );

        const error = await docService
          .validateLibraryExists(misspelledLibrary)
          .catch((e) => e);
        expect(error).toBeInstanceOf(LibraryNotFoundError);
        expect(error.requestedLibrary).toBe(misspelledLibrary);
        expect(error.suggestions).toEqual(["react"]); // Expect 'react' as suggestion
        expect(mockStore.queryLibraryVersions).toHaveBeenCalled(); // Fix: Use mockStoreInstance
      });

      it("should handle case insensitivity", async () => {
        const libraryUpper = "TEST-LIB";
        const libraryLower = libraryUpper.toLowerCase(); // 'test-lib'

        // Mock the store to indicate the LOWERCASE library exists
        mockStore.queryUniqueVersions.mockImplementation(async (lib) =>
          lib === libraryLower ? ["1.0.0"] : [],
        );
        // Alternatively, or additionally, mock checkDocumentExists:
        // mockStore.checkDocumentExists.mockImplementation(async (lib, ver) =>
        //   lib === libraryLower && ver === "" ? true : false
        // );

        // Should still resolve because the service normalizes the input
        await expect(
          docService.validateLibraryExists(libraryUpper),
        ).resolves.toBeUndefined();

        // Verify the mocks were called with the LOWERCASE name
        expect(mockStore.queryUniqueVersions).toHaveBeenCalledWith(libraryLower);
        expect(mockStore.checkDocumentExists).toHaveBeenCalledWith(libraryLower, "");
      });
    });
  }); // Closing brace for describe("Core Functionality", ...)
}); // Closing brace for the main describe block
