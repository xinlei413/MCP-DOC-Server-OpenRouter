import type { DocumentManagementService } from "../store/DocumentManagementService";

export interface LibraryVersion {
  version: string;
  indexed: boolean;
}

export interface LibraryInfo {
  name: string;
  versions: LibraryVersion[];
}

export interface ListLibrariesResult {
  libraries: LibraryInfo[];
}

/**
 * Tool for listing all available libraries and their indexed versions in the store.
 */
export class ListLibrariesTool {
  private docService: DocumentManagementService;

  constructor(docService: DocumentManagementService) {
    this.docService = docService;
  }

  async execute(options?: Record<string, never>): Promise<ListLibrariesResult> {
    const rawLibraries = await this.docService.listLibraries();

    const libraries = rawLibraries.map(({ library, versions }) => ({
      name: library,
      versions: versions.map((v) => ({
        version: v.version,
        indexed: v.indexed,
      })),
    }));

    return { libraries };
  }
}
