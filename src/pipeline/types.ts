import type { ScraperOptions, ScraperProgress } from "../scraper/types";
import type { Document } from "../types"; // Use local Document type

/**
 * Represents the possible states of a pipeline job.
 */
export enum PipelineJobStatus {
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLING = "cancelling",
  CANCELLED = "cancelled",
}

/**
 * Represents a single document processing job within the pipeline.
 */
export interface PipelineJob {
  /** Unique identifier for the job. */
  id: string;
  /** The library name associated with the job. */
  library: string;
  /** The library version associated with the job. */
  version: string;
  /** Options provided for the scraper. */
  options: ScraperOptions;
  /** Current status of the job. */
  status: PipelineJobStatus;
  /** Detailed progress information. */
  progress: ScraperProgress | null;
  /** Error object if the job failed. */
  error: Error | null;
  /** Timestamp when the job was created. */
  createdAt: Date;
  /** Timestamp when the job started running. */
  startedAt: Date | null;
  /** Timestamp when the job finished (completed, failed, or cancelled). */
  finishedAt: Date | null;
  /** AbortController to signal cancellation. */
  abortController: AbortController;
  /** Promise that resolves/rejects when the job finishes. */
  completionPromise: Promise<void>;
  /** Resolver function for the completion promise. */
  resolveCompletion: () => void;
  /** Rejector function for the completion promise. */
  rejectCompletion: (reason?: unknown) => void;
}

/**
 * Defines the structure for callback functions used with the PipelineManager.
 * Allows external components to hook into job lifecycle events.
 */
export interface PipelineManagerCallbacks {
  /** Callback triggered when a job's status changes. */
  onJobStatusChange?: (job: PipelineJob) => Promise<void>;
  /** Callback triggered when a job makes progress. */
  onJobProgress?: (job: PipelineJob, progress: ScraperProgress) => Promise<void>;
  /** Callback triggered when a job encounters an error during processing (e.g., storing a doc). */
  onJobError?: (job: PipelineJob, error: Error, document?: Document) => Promise<void>;
}
