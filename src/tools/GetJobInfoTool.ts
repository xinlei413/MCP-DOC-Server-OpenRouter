import type { PipelineManager } from "../pipeline/PipelineManager";
import type { PipelineJob, PipelineJobStatus } from "../pipeline/types";

/**
 * Input parameters for the GetJobInfoTool.
 */
export interface GetJobInfoInput {
  /** The ID of the job to retrieve info for. */
  jobId: string;
}

/**
 * Simplified information about a pipeline job for external use.
 */
export interface JobInfo {
  id: string;
  library: string;
  version: string;
  status: PipelineJobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

/**
 * Response structure for the GetJobInfoTool.
 */
export interface GetJobInfoToolResponse {
  job: JobInfo | null;
}

/**
 * Tool for retrieving simplified information about a specific pipeline job.
 */
export class GetJobInfoTool {
  private manager: PipelineManager;

  /**
   * Creates an instance of GetJobInfoTool.
   * @param manager The PipelineManager instance.
   */
  constructor(manager: PipelineManager) {
    this.manager = manager;
  }

  /**
   * Executes the tool to retrieve simplified info for a specific job.
   * @param input - The input parameters, containing the jobId.
   * @returns A promise that resolves with the simplified job info or null if not found.
   */
  async execute(input: GetJobInfoInput): Promise<GetJobInfoToolResponse> {
    const job = await this.manager.getJob(input.jobId);

    if (!job) {
      // Return null in the result if job not found
      return { job: null };
    }

    // Transform the job into a simplified object
    const jobInfo: JobInfo = {
      id: job.id,
      library: job.library,
      version: job.version,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      error: job.error?.message ?? null,
    };

    return { job: jobInfo };
  }
}
