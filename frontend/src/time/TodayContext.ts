import { createContext } from "react";
import type { LocalDate } from "shared";

export const TodayContext = createContext<LocalDate | undefined>(undefined);
