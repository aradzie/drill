import { createContext } from "react";
import type { Grade, ProblemEvent } from "shared";
import type { ApiError } from "../api/client.ts";
import type { ResourceStatus } from "../api/resource.ts";

export type EventsApi = {
  events: readonly ProblemEvent[];
  status: ResourceStatus;
  error: ApiError | null;
  isSubmitting: boolean;
  reload: () => Promise<void>;
  start: (problemId: string) => Promise<void>;
  stop: (problemId: string) => Promise<void>;
  review: (problemId: string, grade: Grade) => Promise<void>;
};

export const EventsContext = createContext<EventsApi | undefined>(undefined);
