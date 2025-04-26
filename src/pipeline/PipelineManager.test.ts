import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScraperService } from "../scraper";
import type { DocumentManagementService } from "../store/DocumentManagementService";
import { PipelineManager } from "./PipelineManager";
import { PipelineWorker } from "./PipelineWorker";
import type { PipelineManagerCallbacks } from "./types";
import { PipelineJobStatus } from "./types";

// Mock dependencies
vi.mock("../store/DocumentManagementService");
vi.mock("../scraper/ScraperService");
vi.mock("./PipelineWorker");
vi.mock("../utils/logger");

// Mock uuid
const mockUuid = "mock-uuid-123";
vi.mock("uuid", () => ({
  v4: () => mockUuid,
}));

describe("PipelineManager", () => {
  let mockStore: Partial<DocumentManagementService>;
  let mockScraperService: Partial<ScraperService>;
  let mockWorkerInstance: { executeJob: Mock };
  let manager: PipelineManager;
  let mockCallbacks: PipelineManagerCallbacks;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers(); // Use fake timers for controlling async queue processing

    mockStore = {
      // Add mock methods if manager interacts directly (it shouldn't now)
    };

    mockScraperService = {
      // Add mock methods if manager interacts directly (it shouldn't now)
    };

    // Mock the worker's executeJob method
    mockWorkerInstance = {
      executeJob: vi.fn().mockResolvedValue(undefined), // Default success
    };
    // Mock the constructor of PipelineWorker to return our mock instance
    (PipelineWorker as Mock).mockImplementation(() => mockWorkerInstance);

    mockCallbacks = {
      onJobStatusChange: vi.fn().mockResolvedValue(undefined),
      onJobProgress: vi.fn().mockResolvedValue(undefined),
      onJobError: vi.fn().mockResolvedValue(undefined),
    };

    // Default concurrency of 1 for simpler testing unless overridden
    manager = new PipelineManager(
      mockStore as DocumentManagementService,
      1, // Default to 1 for easier sequential testing
    );
    manager.setCallbacks(mockCallbacks);
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers
  });

  // --- Enqueueing Tests ---
  it("should enqueue a job with QUEUED status and return a job ID", async () => {
    const options = { url: "http://a.com", library: "libA", version: "1.0" };
    const jobId = await manager.enqueueJob("libA", "1.0", options);

    expect(jobId).toBe(mockUuid);
    const job = await manager.getJob(jobId);
    expect(job).toBeDefined();
    expect(job?.status).toBe(PipelineJobStatus.QUEUED);
    expect(job?.library).toBe("libA");
    expect(job?.options.url).toBe("http://a.com");
    expect(mockCallbacks.onJobStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId, status: PipelineJobStatus.QUEUED }),
    );
  });

  // --- Basic Execution Flow ---
  it("should start a queued job when start() is called", async () => {
    // Override worker mock for this test ONLY to make it pending
    const pendingPromise = new Promise(() => {}); // A promise that never resolves
    mockWorkerInstance.executeJob.mockReturnValue(pendingPromise);

    // Add required options properties for the type
    const options = {
      url: "http://a.com",
      library: "libA",
      version: "1.0",
      maxPages: 1,
      maxDepth: 1,
    };
    const jobId = await manager.enqueueJob("libA", "1.0", options);

    await manager.start();
    await vi.advanceTimersByTimeAsync(1); // Allow microtasks (like _processQueue) to run

    const job = await manager.getJob(jobId);
    expect(job?.status).toBe(PipelineJobStatus.RUNNING);
    expect(mockCallbacks.onJobStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId, status: PipelineJobStatus.RUNNING }),
    );
    expect(PipelineWorker).toHaveBeenCalledOnce(); // Worker should be created
    expect(mockWorkerInstance.executeJob).toHaveBeenCalledOnce(); // Worker's job should start
    expect(mockWorkerInstance.executeJob).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId }), // Pass the job
      mockCallbacks, // Pass manager's callbacks
    );
  });

  it("should transition job to COMPLETED on successful worker execution", async () => {
    const options = { url: "http://a.com", library: "libA", version: "1.0" };
    const jobId = await manager.enqueueJob("libA", "1.0", options);

    await manager.start();
    await vi.advanceTimersByTimeAsync(1); // Start the job

    // Wait for the job's completion promise (which resolves when _runJob finishes)
    await manager.waitForJobCompletion(jobId);

    const job = await manager.getJob(jobId);
    expect(job?.status).toBe(PipelineJobStatus.COMPLETED);
    expect(job?.finishedAt).toBeInstanceOf(Date);
    expect(mockCallbacks.onJobStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: jobId, status: PipelineJobStatus.COMPLETED }),
    );
  });

  // Add more tests here for concurrency, failure, cancellation etc.
});
