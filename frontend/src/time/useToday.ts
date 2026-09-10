import { useContext } from "react";
import type { LocalDate } from "shared";
import { TodayContext } from "./TodayContext.ts";

export function useToday(): LocalDate {
  const today = useContext(TodayContext);
  if (!today) throw new Error(import.meta.env.DEV ? "useToday must be used inside TodayProvider" : undefined);
  return today;
}
