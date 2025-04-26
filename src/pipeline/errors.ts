export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = this.constructor.name;
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export class DocumentProcessingError extends PipelineError {
  constructor(
    message: string,
    public readonly documentId: string,
    cause?: Error,
  ) {
    super(`Failed to process document ${documentId}: ${message}`, cause);
  }
}

export class PipelineStateError extends PipelineError {}

/**
 * Error indicating that an operation was cancelled.
 */
export class CancellationError extends PipelineError {
  constructor(message = "Operation cancelled") {
    super(message);
  }
}
