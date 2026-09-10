import type { LocalDate } from "./localdate.ts";
import type { Problem, ProblemEvent } from "./problem.ts";
import { buildQueue, isDue, isNew, isOpen, type ProblemEntry } from "./state.ts";
import { computeStats, type Stats } from "./stats.ts";

export type ListName =
  | "new" //
  | "due"
  | "in-progress"
  | "reviewed";

export const LIST_NAMES = Object.freeze<ListName[]>([
  "new", //
  "due",
  "in-progress",
  "reviewed",
]);

export type Collection = {
  readonly entries: readonly ProblemEntry[];
  readonly stats: Stats;
} & Record<ListName, readonly ProblemEntry[]>;

export function buildCollection(
  problems: readonly Problem[],
  events: readonly ProblemEvent[],
  now: LocalDate,
  prepareEntry: (entry: ProblemEntry) => ProblemEntry = (entry) => entry,
): Collection {
  const entries = Object.freeze(buildQueue(problems, events).map(prepareEntry));
  const stats = computeStats(entries, events);
  return Object.freeze({
    entries,
    stats,
    ["new"]: Object.freeze(entries.filter(({ state }) => isNew(state))),
    ["due"]: Object.freeze(entries.filter(({ state }) => isDue(state, now))),
    ["in-progress"]: Object.freeze(
      entries
        .filter(({ state }) => isOpen(state)) //
        .sort((a, b) => a.state.inProgressSince! - b.state.inProgressSince!),
    ),
    ["reviewed"]: Object.freeze(
      entries
        .filter(({ state }) => state.status === "active")
        .sort((a, b) => b.lastReview!.occurredAt - a.lastReview!.occurredAt),
    ),
  });
}
