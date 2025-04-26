import { describe, expect, it, vi } from "vitest";
import type { LibraryVersion } from "./ListLibrariesTool";
import { ToolError, VersionNotFoundError } from "./errors";

vi.mock("../utils/logger");

describe("Tool Errors", () => {
  describe("ToolError", () => {
    it("should create an instance with correct properties", () => {
      const error = new ToolError("Generic tool failure", "MyTool");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ToolError);
      expect(error.name).toBe("ToolError");
      expect(error.message).toBe("Generic tool failure");
      expect(error.toolName).toBe("MyTool");
    });
  });

  describe("VersionNotFoundError", () => {
    const library = "test-lib";
    const requestedVersion = "1.2.3";
    const availableVersions: LibraryVersion[] = [
      { version: "1.0.0", indexed: true },
      { version: "2.0.0", indexed: false },
      { version: "1.1.0", indexed: true },
      { version: "2.0.0-beta.1", indexed: true },
    ];
    const emptyAvailable: LibraryVersion[] = [];

    it("should create an instance with correct properties", () => {
      const error = new VersionNotFoundError(
        library,
        requestedVersion,
        availableVersions,
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ToolError); // Inherits from ToolError
      expect(error).toBeInstanceOf(VersionNotFoundError);
      expect(error.name).toBe("VersionNotFoundError");
      expect(error.message).toContain(
        `Version ${requestedVersion} not found for ${library}`,
      );
      expect(error.message).toContain("Available versions:");
      expect(error.library).toBe(library);
      expect(error.requestedVersion).toBe(requestedVersion);
      expect(error.availableVersions).toEqual(availableVersions);
      // Inherited property
      expect(error.toolName).toBe("SearchTool"); // Default toolName for this error
    });

    it("should correctly identify the latest semver version using getLatestVersion", () => {
      const error = new VersionNotFoundError(
        library,
        requestedVersion,
        availableVersions,
      );
      const latest = error.getLatestVersion();
      // Expect 2.0.0, as it's the highest stable version according to semver rules
      expect(latest).toEqual({ version: "2.0.0", indexed: false });
    });

    it("should handle pre-release versions correctly in getLatestVersion", () => {
      const versionsWithPrerelease: LibraryVersion[] = [
        { version: "1.0.0", indexed: true },
        { version: "1.1.0-alpha.1", indexed: true },
        { version: "1.1.0", indexed: false },
      ];
      const error = new VersionNotFoundError(
        library,
        requestedVersion,
        versionsWithPrerelease,
      );
      const latest = error.getLatestVersion();
      expect(latest).toEqual({ version: "1.1.0", indexed: false }); // Stable 1.1.0 is > 1.1.0-alpha.1
    });

    it("should return undefined from getLatestVersion when availableVersions is empty", () => {
      const error = new VersionNotFoundError(library, requestedVersion, emptyAvailable);
      const latest = error.getLatestVersion();
      expect(latest).toBeUndefined();
    });

    it("should handle only pre-release versions in getLatestVersion", () => {
      const onlyPrerelease: LibraryVersion[] = [
        { version: "1.0.0-rc.1", indexed: true },
        { version: "1.0.0-beta.2", indexed: false },
      ];
      const error = new VersionNotFoundError(library, requestedVersion, onlyPrerelease);
      const latest = error.getLatestVersion();
      // rc.1 > beta.2
      expect(latest).toEqual({ version: "1.0.0-rc.1", indexed: true });
    });
  });
});
