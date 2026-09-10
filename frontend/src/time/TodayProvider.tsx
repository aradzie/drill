import { type ReactNode, useEffect, useState } from "react";
import { LocalDate } from "shared";
import { TodayContext } from "./TodayContext.ts";
import { watchToday } from "./watch-today.ts";

export function TodayProvider({ children }: { children: ReactNode }) {
  const [today, setToday] = useState(() => LocalDate.now());

  useEffect(() => {
    return watchToday((next) => {
      setToday((previous) => (previous.timestamp === next.timestamp ? previous : next));
    });
  }, []);

  return <TodayContext value={today}>{children}</TodayContext>;
}
