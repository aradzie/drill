import { useContext } from "react";
import { type ProblemsApi, ProblemsContext } from "./ProblemsContext.ts";

export function useProblems(): ProblemsApi {
  const context = useContext(ProblemsContext);
  if (!context) throw new Error(import.meta.env.DEV ? "useProblems must be used inside ProblemsProvider" : undefined);
  return context;
}
