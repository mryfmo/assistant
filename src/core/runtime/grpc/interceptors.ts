import { type RuntimeLogger, createRuntimeLogger } from "../logging/logger";

export type GrpcRequestMetadata = {
  request_id?: string;
  workflow_id?: string;
  task_id?: string;
  worker_id?: string;
};

export type RequestContextInterceptorOptions<Req, Res> = {
  eventType: string;
  extractMetadata: (request: Req) => GrpcRequestMetadata;
  handler: (request: Req) => Promise<Res> | Res;
  logger?: RuntimeLogger;
};

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown runtime handler error.";
}

function assertRequestId(value: string | undefined, eventType: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Invalid ${eventType} request: request_id is required.`);
  }

  return value;
}

function fallbackValue(value: string | undefined, fallback: string): string {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }

  return value;
}

export function withRuntimeRequestContext<Req, Res>(
  options: RequestContextInterceptorOptions<Req, Res>,
): (request: Req) => Promise<Res> {
  const logger = options.logger ?? createRuntimeLogger();

  return async (request: Req): Promise<Res> => {
    const metadata = options.extractMetadata(request);
    const requestId = assertRequestId(metadata.request_id, options.eventType);
    const workflowId = fallbackValue(metadata.workflow_id, `${options.eventType}:workflow`);
    const taskId = fallbackValue(metadata.task_id, `${options.eventType}:task`);

    logger.emit({
      level: "info",
      eventType: `${options.eventType}.request_received`,
      message: `${options.eventType} request accepted by runtime interceptor.`,
      context: {
        workflowId,
        taskId,
        requestId,
        workerId: metadata.worker_id,
      },
    });

    try {
      const response = await options.handler(request);

      logger.emit({
        level: "info",
        eventType: `${options.eventType}.request_completed`,
        message: `${options.eventType} request completed by runtime interceptor.`,
        context: {
          workflowId,
          taskId,
          requestId,
          workerId: metadata.worker_id,
        },
      });

      return response;
    } catch (error) {
      logger.emit({
        level: "error",
        eventType: `${options.eventType}.request_failed`,
        message: parseErrorMessage(error),
        context: {
          workflowId,
          taskId,
          requestId,
          workerId: metadata.worker_id,
        },
      });

      throw error;
    }
  };
}
