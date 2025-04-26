import type { ScraperService } from "../scraper";
import type { ScraperProgress } from "../scraper/types";
import type { DocumentManagementService } from "../store";
import { logger } from "../utils/logger";
import { CancellationError } from "./errors";
import type { PipelineJob, PipelineManagerCallbacks } from "./types";

/**
 * Executes a single document processing job.
 * Handles scraping, storing documents, and reporting progress/errors via callbacks.
 */
export class PipelineWorker {
  // Dependencies are passed in, making the worker stateless regarding specific jobs
  private readonly store: DocumentManagementService;
  private readonly scraperService: ScraperService;

  // Constructor accepts dependencies needed for execution
  constructor(store: DocumentManagementService, scraperService: ScraperService) {
    this.store = store;
    this.scraperService = scraperService;
  }

  /**
   * Executes the given pipeline job.
   * @param job - The job to execute.
   * @param callbacks - Callbacks provided by the manager for reporting.
   */
  async executeJob(job: PipelineJob, callbacks: PipelineManagerCallbacks): Promise<void> {
    const { id: jobId, library, version, options, abortController } = job;
    const signal = abortController.signal;

    logger.debug(`[${jobId}] Worker starting job for ${library}@${version}`);

    try {
      // --- Core Job Logic ---
      await this.scraperService.scrape(
        options,
        async (progress: ScraperProgress) => {
          // Check for cancellation signal before processing each document
          if (signal.aborted) {
            throw new CancellationError("Job cancelled during scraping progress");
          }

          // Update job object directly (manager holds the reference)
          job.progress = progress;
          // Report progress via manager's callback
          await callbacks.onJobProgress?.(job, progress);

          if (progress.document) {
            try {
              // TODO: Pass signal to store.addDocument if it supports it
              await this.store.addDocument(library, version, {
                pageContent: progress.document.content,
                metadata: progress.document.metadata,
              });
              logger.debug(
                `[${jobId}] Stored document: ${progress.document.metadata.url}`,
              );
            } catch (docError) {
              logger.error(
                `[${jobId}] Failed to store document ${progress.document.metadata.url}: ${docError}`,
              );
              // Report document-specific errors via manager's callback
              await callbacks.onJobError?.(
                job,
                docError instanceof Error ? docError : new Error(String(docError)),
                progress.document,
              );
              // Decide if a single document error should fail the whole job
              // For now, we log and continue. To fail, re-throw here.
            }
          }
        },
        signal, // Pass signal to scraper service
      );
      // --- End Core Job Logic ---

      // Check signal one last time after scrape finishes
      if (signal.aborted) {
        throw new CancellationError("Job cancelled shortly after scraping finished");
      }

      // If successful and not cancelled, the manager will handle status update
      logger.info(`[${jobId}] Worker finished job successfully.`);
    } catch (error) {
      // Re-throw error to be caught by the manager in _runJob
      logger.warn(`[${jobId}] Worker encountered error: ${error}`);
      throw error;
    }
    // Note: The manager (_runJob) is responsible for updating final job status (COMPLETED/FAILED/CANCELLED)
    // and resolving/rejecting the completion promise based on the outcome here.
  }

  // --- Old methods removed ---
  // process()
  // stop()
  // setCallbacks()
  // handleScrapingProgress()
}
