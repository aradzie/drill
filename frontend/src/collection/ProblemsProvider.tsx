import { type ReactNode, useCallback, useEffect, useState } from "react";
import type { Problem } from "shared";
import { fetchProblems } from "../api/problems.ts";
import { asApiError, type ResourceStatus } from "../api/resource.ts";
import { type ProblemsApi, ProblemsContext } from "./ProblemsContext.ts";

export function ProblemsProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [status, setStatus] = useState<ResourceStatus>("loading");
  const [error, setError] = useState<ProblemsApi["error"]>(null);

  const load = useCallback(async () => {
    try {
      setProblems(await fetchProblems());
      setError(null);
      setStatus("ready");
    } catch (error) {
      setError(asApiError(error, "failed to load problems"));
      setStatus("error");
    }
  }, []);

  const reload = async () => {
    setStatus("loading");
    setError(null);
    await load();
  };

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (error) {
    throw error;
  }

  return <ProblemsContext value={{ problems, status, error, reload }}>{children}</ProblemsContext>;
}
