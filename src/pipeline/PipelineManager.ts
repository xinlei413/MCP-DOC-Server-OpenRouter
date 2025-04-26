import { v4 as uuidv4 } from "uuid";
import { ScraperRegistry, ScraperService } from "../scraper";
import type { ScraperOptions } from "../scraper/types";
import type { DocumentManagementService } from "../store";
import { logger } from "../utils/logger";
import { PipelineWorker } from "./PipelineWorker"; // Import the worker
import { CancellationError, PipelineStateError } from "./errors";
import type { PipelineJob, PipelineManagerCallbacks } from "./types";
import { PipelineJobStatus } from "./types";

const DEFAULT_CONCURRENCY = 3;

/**
 * Manages a queue of document processing jobs, controlling concurrency and tracking progress.
 */
export class PipelineManager {
  private jobMap: Map<string, PipelineJob> = new Map();
  private jobQueue: string[] = [];
  private activeWorkers: Set<string> = new Set();
  private isRunning = false;
  private concurrency: number;
  private callbacks: PipelineManagerCallbacks = {};
  private store: DocumentManagementService;
  private scraperService: ScraperService;

  constructor(
    store: DocumentManagementService,
    concurrency: number = DEFAULT_CONCURRENCY,
  ) {
    this.store = store;
    this.concurrency = concurrency;
    // ScraperService needs a registry. We create one internally for the manager.
    const registry = new ScraperRegistry();
    this.scraperService = new ScraperService(registry);
  }

  /**
   * Registers callback handlers for pipeline manager events.
   */
  setCallbacks(callbacks: PipelineManagerCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Starts the pipeline manager's worker processing.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("PipelineManager is already running.");
      return;
    }
    this.isRunning = true;
    logger.debug(`PipelineManager started with concurrency ${this.concurrency}.`);
    this._processQueue(); // Start processing any existing jobs
  }

  /**
   * Stops the pipeline manager and attempts to gracefully shut down workers.
   * Currently, it just stops processing new jobs. Cancellation of active jobs
   * needs explicit `cancelJob` calls.
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn("PipelineManager is not running.");
      return;
    }
    this.isRunning = false;
    logger.debug("PipelineManager stopping. No new jobs will be started.");
    // Note: Does not automatically cancel active jobs.
  }

  /**
   * Enqueues a new document processing job.
   */
  async enqueueJob(
    library: string,
    version: string,
    options: ScraperOptions,
  ): Promise<string> {
    const jobId = uuidv4();
    const abortController = new AbortController();
    let resolveCompletion!: () => void;
    let rejectCompletion!: (reason?: unknown) => void;

    const completionPromise = new Promise<void>((resolve, reject) => {
      resolveCompletion = resolve;
      rejectCompletion = reject;
    });

    const job: PipelineJob = {
      id: jobId,
      library,
      version,
      options,
      status: PipelineJobStatus.QUEUED,
      progress: null,
      error: null,
      createdAt: new Date(),
      startedAt: null,
      finishedAt: null,
      abortController,
      completionPromise,
      resolveCompletion,
      rejectCompletion,
    };

    this.jobMap.set(jobId, job);
    this.jobQueue.push(jobId);
    logger.info(`📝 Job enqueued: ${jobId} for ${library}@${version}`);

    await this.callbacks.onJobStatusChange?.(job);

    // Trigger processing if manager is running
    if (this.isRunning) {
      this._processQueue();
    }

    return jobId;
  }

  /**
   * Retrieves the current state of a specific job.
   */
  async getJob(jobId: string): Promise<PipelineJob | undefined> {
    return this.jobMap.get(jobId);
  }

  /**
   * Retrieves the current state of all jobs (or a subset based on status).
   */
  async getJobs(status?: PipelineJobStatus): Promise<PipelineJob[]> {
    const allJobs = Array.from(this.jobMap.values());
    if (status) {
      return allJobs.filter((job) => job.status === status);
    }
    return allJobs;
  }

  /**
   * Returns a promise that resolves when the specified job completes, fails, or is cancelled.
   */
  async waitForJobCompletion(jobId: string): Promise<void> {
    const job = this.jobMap.get(jobId);
    if (!job) {
      throw new PipelineStateError(`Job not found: ${jobId}`);
    }
    await job.completionPromise;
  }

  /**
   * Attempts to cancel a queued or running job.
   */
  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobMap.get(jobId);
    if (!job) {
      logger.warn(`Attempted to cancel non-existent job: ${jobId}`);
      return;
    }

    switch (job.status) {
      case PipelineJobStatus.QUEUED:
        // Remove from queue and mark as cancelled
        this.jobQueue = this.jobQueue.filter((id) => id !== jobId);
        job.status = PipelineJobStatus.CANCELLED;
        job.finishedAt = new Date();
        logger.info(`🚫 Job cancelled (was queued): ${jobId}`);
        await this.callbacks.onJobStatusChange?.(job);
        job.rejectCompletion(new PipelineStateError("Job cancelled before starting"));
        break;

      case PipelineJobStatus.RUNNING:
        // Signal cancellation via AbortController
        job.status = PipelineJobStatus.CANCELLING;
        job.abortController.abort();
        logger.info(`🚫 Signalling cancellation for running job: ${jobId}`);
        await this.callbacks.onJobStatusChange?.(job);
        // The worker is responsible for transitioning to CANCELLED and rejecting
        break;

      case PipelineJobStatus.COMPLETED:
      case PipelineJobStatus.FAILED:
      case PipelineJobStatus.CANCELLED:
      case PipelineJobStatus.CANCELLING:
        logger.warn(
          `Job ${jobId} cannot be cancelled in its current state: ${job.status}`,
        );
        break;

      default:
        logger.error(`Unhandled job status for cancellation: ${job.status}`);
        break;
    }
  }

  // --- Private Methods ---

  /**
   * Processes the job queue, starting new workers if capacity allows.
   */
  private _processQueue(): void {
    if (!this.isRunning) return;

    while (this.activeWorkers.size < this.concurrency && this.jobQueue.length > 0) {
      const jobId = this.jobQueue.shift();
      if (!jobId) continue; // Should not happen, but safety check

      const job = this.jobMap.get(jobId);
      if (!job || job.status !== PipelineJobStatus.QUEUED) {
        logger.warn(`Skipping job ${jobId} in queue (not found or not queued).`);
        continue;
      }

      this.activeWorkers.add(jobId);
      job.status = PipelineJobStatus.RUNNING;
      job.startedAt = new Date();
      logger.info(`🚀 Starting job: ${jobId}`);
      this.callbacks.onJobStatusChange?.(job); // Fire and forget status update

      // Start the actual job execution asynchronously
      this._runJob(job).catch((error) => {
        // Catch unexpected errors during job setup/execution not handled by _runJob itself
        logger.error(`Unhandled error during job ${jobId} execution: ${error}`);
        if (
          job.status !== PipelineJobStatus.FAILED &&
          job.status !== PipelineJobStatus.CANCELLED
        ) {
          job.status = PipelineJobStatus.FAILED;
          job.error = error instanceof Error ? error : new Error(String(error));
          job.finishedAt = new Date();
          this.callbacks.onJobStatusChange?.(job); // Fire and forget
          job.rejectCompletion(job.error);
        }
        this.activeWorkers.delete(jobId);
        this._processQueue(); // Check if another job can start
      });
    }
  }

  /**
   * Executes a single pipeline job by delegating to a PipelineWorker.
   * Handles final status updates and promise resolution/rejection.
   */
  private async _runJob(job: PipelineJob): Promise<void> {
    const { id: jobId, abortController } = job;
    const signal = abortController.signal; // Get signal for error checking

    // Instantiate a worker for this job.
    // Dependencies (store, scraperService) are held by the manager.
    const worker = new PipelineWorker(this.store, this.scraperService);

    try {
      // Delegate the actual work to the worker
      await worker.executeJob(job, this.callbacks);

      // If executeJob completes without throwing, and we weren't cancelled meanwhile...
      if (signal.aborted) {
        // Check signal again in case cancellation happened *during* the very last await in executeJob
        throw new CancellationError("Job cancelled just before completion");
      }

      // Mark as completed
      job.status = PipelineJobStatus.COMPLETED;
      job.finishedAt = new Date();
      logger.info(`✅ Manager: Job completed: ${jobId}`);
      await this.callbacks.onJobStatusChange?.(job);
      job.resolveCompletion();
    } catch (error) {
      // Handle errors thrown by the worker, including CancellationError
      if (error instanceof CancellationError || signal.aborted) {
        // Explicitly check for CancellationError or if the signal was aborted
        job.status = PipelineJobStatus.CANCELLED;
        job.finishedAt = new Date();
        // Use the caught error if it's a CancellationError, otherwise create a new one
        job.error =
          error instanceof CancellationError
            ? error
            : new CancellationError("Job cancelled by signal");
        logger.info(`🚫 Job execution cancelled: ${jobId}: ${job.error.message}`);
        await this.callbacks.onJobStatusChange?.(job);
        job.rejectCompletion(job.error);
      } else {
        // Handle other errors
        job.status = PipelineJobStatus.FAILED;
        job.error = error instanceof Error ? error : new Error(String(error));
        job.finishedAt = new Date();
        logger.error(`❌ Job failed: ${jobId}: ${job.error}`);
        await this.callbacks.onJobStatusChange?.(job);
        job.rejectCompletion(job.error);
      }
    } finally {
      // Ensure worker slot is freed and queue processing continues
      this.activeWorkers.delete(jobId);
      this._processQueue();
    }
  }
}
