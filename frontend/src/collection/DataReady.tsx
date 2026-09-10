import type { ReactNode } from "react";
import { Loading } from "../ui/Loading.tsx";
import { useEvents } from "./useEvents.ts";
import { useProblems } from "./useProblems.ts";

export function DataReady({ children }: { children: ReactNode }) {
  const { status: problemsStatus } = useProblems();
  const { status: eventsStatus } = useEvents();

  if (problemsStatus === "loading" || eventsStatus === "loading") {
    return <Loading />;
  }

  return children;
}
