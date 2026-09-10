import { ApiError } from "./client.ts";

export type ResourceStatus = "loading" | "ready" | "error";

export function asApiError(error: unknown, operation: string): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(`${operation}: ${error instanceof Error ? error.message : "unknown error"}`, 0);
}
