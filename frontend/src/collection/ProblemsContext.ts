import { createContext } from "react";
import type { Problem } from "shared";
import type { ApiError } from "../api/client.ts";
import type { ResourceStatus } from "../api/resource.ts";

export type ProblemsApi = {
  problems: readonly Problem[];
  status: ResourceStatus;
  error: ApiError | null;
  reload: () => Promise<void>;
};

export const ProblemsContext = createContext<ProblemsApi | undefined>(undefined);
