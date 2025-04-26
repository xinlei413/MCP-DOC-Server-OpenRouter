import type { PipelineManager } from "../pipeline/PipelineManager";
import type { PipelineJob, PipelineJobStatus } from "../pipeline/types";
import type { JobInfo } from "./GetJobInfoTool"; // Import JobInfo

/**
 * Input parameters for the ListJobsTool.
 */
export interface ListJobsInput {
  /** Optional status to filter jobs by. */
  status?: PipelineJobStatus;
}

/**
 * Response structure for the ListJobsTool.
 */
export interface ListJobsToolResponse {
  jobs: JobInfo[];
}

/**
 * Tool for listing pipeline jobs managed by the PipelineManager.
 * Allows filtering jobs by their status.
 */
export class ListJobsTool {
  private manager: PipelineManager; // Change property name and type

  /**
   * Creates an instance of ListJobsTool.
   * @param manager The PipelineManager instance.
   */
  constructor(manager: PipelineManager) {
    // Change constructor parameter
    this.manager = manager;
  }

  /**
   * Executes the tool to retrieve a list of pipeline jobs.
   * @param input - The input parameters, optionally including a status filter.
   * @returns A promise that resolves with the list of simplified job objects.
   * @throws {PipelineStateError} If the pipeline manager is somehow unavailable.
   */
  async execute(input: ListJobsInput): Promise<ListJobsToolResponse> {
    const jobs = await this.manager.getJobs(input.status);

    // Transform jobs into simplified objects
    const simplifiedJobs: JobInfo[] = jobs.map(
      (job: PipelineJob): JobInfo => ({
        id: job.id,
        library: job.library,
        version: job.version,
        status: job.status,
        createdAt: job.createdAt.toISOString(),
        startedAt: job.startedAt?.toISOString() ?? null,
        finishedAt: job.finishedAt?.toISOString() ?? null,
        error: job.error?.message ?? null,
      }),
    );

    return { jobs: simplifiedJobs };
  }
}
