import { useContext } from "react";
import { type EventsApi, EventsContext } from "./EventsContext.ts";

export function useEvents(): EventsApi {
  const context = useContext(EventsContext);
  if (!context) throw new Error(import.meta.env.DEV ? "useEvents must be used inside EventsProvider" : undefined);
  return context;
}
