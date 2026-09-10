import { buildCollection } from "shared";
import { prepareSearch } from "../filter/prepare-search.ts";
import { useToday } from "../time/useToday.ts";
import { useEvents } from "./useEvents.ts";
import { useProblems } from "./useProblems.ts";

export function useCollection() {
  const { problems } = useProblems();
  const { events } = useEvents();
  const today = useToday();
  return buildCollection(problems, events, today, prepareSearch);
}
