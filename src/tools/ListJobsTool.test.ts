import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelineManager } from "../pipeline/PipelineManager";
import { type PipelineJob, PipelineJobStatus } from "../pipeline/types";
import type { ScraperOptions } from "../scraper/types";
import type { ScraperProgress } from "../scraper/types";
import { ListJobsTool } from "./ListJobsTool";

// Mock dependencies
vi.mock("../pipeline/PipelineManager");
vi.mock("../utils/logger");

describe("ListJobsTool", () => {
  // Define the mock instance directly
  let mockManagerInstance: Partial<PipelineManager>;
  let listJobsTool: ListJobsTool;

  // Define more complete mock data
  const mockJobs: PipelineJob[] = [
    {
      id: "job-1",
      library: "lib-a",
      version: "1.0.0",
      status: PipelineJobStatus.QUEUED,
      createdAt: new Date("2023-01-01T10:00:00Z"),
      options: { library: "lib-a", version: "1.0.0", url: "url1" } as ScraperOptions, // Complete options
      progress: null,
      error: null,
      startedAt: null,
      finishedAt: null,
      abortController: new AbortController(),
      completionPromise: Promise.resolve(),
      resolveCompletion: () => {},
      rejectCompletion: () => {},
    },
    {
      id: "job-2",
      library: "lib-b",
      version: "2.0.0",
      status: PipelineJobStatus.RUNNING,
      createdAt: new Date("2023-01-01T11:00:00Z"),
      startedAt: new Date("2023-01-01T11:05:00Z"),
      options: { library: "lib-b", version: "2.0.0", url: "url2" } as ScraperOptions, // Complete options
      progress: {
        pagesScraped: 5,
        maxPages: 100,
        currentUrl: "url2/page5",
        depth: 1,
        maxDepth: 3,
      } as ScraperProgress, // Complete progress
      error: null,
      finishedAt: null,
      abortController: new AbortController(),
      completionPromise: Promise.resolve(), // Placeholder
      resolveCompletion: () => {},
      rejectCompletion: () => {},
    },
    {
      id: "job-3",
      library: "lib-a",
      version: "1.1.0",
      status: PipelineJobStatus.COMPLETED,
      createdAt: new Date("2023-01-01T12:00:00Z"),
      startedAt: new Date("2023-01-01T12:05:00Z"),
      finishedAt: new Date("2023-01-01T12:15:00Z"),
      options: { library: "lib-a", version: "1.1.0", url: "url3" } as ScraperOptions, // Complete options
      progress: {
        pagesScraped: 10,
        maxPages: 10,
        currentUrl: "url3/page10",
        depth: 2,
        maxDepth: 2,
      } as ScraperProgress, // Complete progress
      error: null,
      abortController: new AbortController(),
      completionPromise: Promise.resolve(),
      resolveCompletion: () => {},
      rejectCompletion: () => {},
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();

    // Define the mock implementation for the manager instance
    mockManagerInstance = {
      getJobs: vi.fn().mockResolvedValue(mockJobs), // Default mock returns all jobs
    };

    // Instantiate the tool with the correctly typed mock instance
    listJobsTool = new ListJobsTool(mockManagerInstance as PipelineManager);
  });

  it("should call manager.getJobs without status when no status is provided", async () => {
    await listJobsTool.execute({});

    // Check if getJobs was called without arguments or with undefined
    expect(mockManagerInstance.getJobs).toHaveBeenCalledWith(undefined);
  });

  it("should call manager.getJobs with the specified status", async () => {
    const targetStatus = PipelineJobStatus.RUNNING;
    await listJobsTool.execute({ status: targetStatus });

    expect(mockManagerInstance.getJobs).toHaveBeenCalledWith(targetStatus);
  });

  it("should return the list of jobs received from the manager", async () => {
    const result = await listJobsTool.execute({});

    expect(result.jobs.length).toBe(mockJobs.length);
    expect(result.jobs.map((job) => job.id)).toEqual(mockJobs.map((job) => job.id));

    // Check properties of the first simplified JobInfo object
    if (result.jobs.length > 0 && mockJobs.length > 0) {
      const firstResultJob = result.jobs[0];
      const firstMockJob = mockJobs[0];
      expect(firstResultJob.id).toBe(firstMockJob.id);
      expect(firstResultJob.library).toBe(firstMockJob.library);
      expect(firstResultJob.version).toBe(firstMockJob.version);
      expect(firstResultJob.status).toBe(firstMockJob.status);
      expect(firstResultJob.createdAt).toBe(firstMockJob.createdAt.toISOString());
      expect(firstResultJob.startedAt).toBeNull(); // Based on first mockJob
      expect(firstResultJob.finishedAt).toBeNull(); // Based on first mockJob
      expect(firstResultJob.error).toBeNull(); // Based on first mockJob
    }
  });

  it("should return a filtered list if manager returns filtered jobs", async () => {
    const runningJobs = mockJobs.filter(
      (job) => job.status === PipelineJobStatus.RUNNING,
    );
    // Configure the mock for this specific test case
    (mockManagerInstance.getJobs as Mock).mockResolvedValue(runningJobs);

    const result = await listJobsTool.execute({ status: PipelineJobStatus.RUNNING });

    expect(result.jobs.length).toBe(runningJobs.length);
    expect(result.jobs.map((job) => job.id)).toEqual(runningJobs.map((job) => job.id));
    expect(mockManagerInstance.getJobs).toHaveBeenCalledWith(PipelineJobStatus.RUNNING);
  });

  it("should return an empty list if manager returns an empty list", async () => {
    (mockManagerInstance.getJobs as Mock).mockResolvedValue([]); // Manager returns empty

    const result = await listJobsTool.execute({});

    expect(result.jobs).toEqual([]);
  });
});
