import { z } from "zod";
import type { LocalDate } from "./localdate.ts";
import type { Grade, Problem, ProblemEvent } from "./problem.ts";
import { applyGrade, initialSchedulerState, type SchedulerState, schedulerStateSchema } from "./scheduler.ts";
import type { DeepReadonly } from "./types.ts";

export type ProblemStatus =
  | "new" //
  | "active";

export const PROBLEM_STATUSES = Object.freeze<ProblemStatus[]>([
  "new", //
  "active",
]);

/** Derived, not stored — computed from a problem's event history. */
export type ProblemState = DeepReadonly<{
  status: ProblemStatus;
  scheduler: SchedulerState;
  inProgressSince: number | null;
  nextReviewAt: number | null;
  lastCommandId: string | null;
}>;

export const problemStateSchema: z.ZodType<ProblemState> = z.object({
  status: z.enum(PROBLEM_STATUSES as [ProblemStatus, ...ProblemStatus[]]),
  scheduler: schedulerStateSchema,
  inProgressSince: z.number().nullable(),
  nextReviewAt: z.number().nullable(),
  lastCommandId: z.string().nullable(),
});

export function initialProblemState(): ProblemState {
  return {
    status: "new",
    scheduler: initialSchedulerState,
    inProgressSince: null,
    nextReviewAt: null,
    lastCommandId: null,
  };
}

export function deriveProblemState(events: Iterable<ProblemEvent>, problemId: string): ProblemState {
  let state = initialProblemState();
  for (const event of events) {
    if (event.problemId === problemId) {
      state = applyEvent(state, event);
    }
  }
  return state;
}

export type ProblemEntry = DeepReadonly<{
  problem: Problem;
  state: ProblemState;
  events: ProblemEvent[];
  /** The most recent review among `events` by time, or null if never reviewed. */
  lastReview: LastReview | null;
  searchFields: string[];
}>;

export type LastReview = DeepReadonly<{
  occurredAt: number;
  grade: Grade;
}>;

export function isNew(state: ProblemState): boolean {
  return state.status === "new" && !isOpen(state);
}

export function isDue(state: ProblemState, now: LocalDate): boolean {
  if (isOpen(state)) return false;
  if (state.status !== "active") return false;
  return state.nextReviewAt != null && state.nextReviewAt <= now.plusDays(1).timestamp;
}

export function isOpen(state: ProblemState): boolean {
  return state.inProgressSince != null;
}

/** True for a reviewed problem graduated out of automatic scheduling (see `GRADUATION_THRESHOLD`). */
export function isGraduated(state: ProblemState): boolean {
  return state.status === "active" && state.nextReviewAt == null;
}

/** Folds one event into a problem's state. Pure: does not read the clock. */
export function applyEvent(state: ProblemState, event: ProblemEvent): ProblemState {
  switch (event.type) {
    case "start":
      return {
        ...state,
        inProgressSince: event.occurredAt,
        lastCommandId: event.commandId,
      };
    case "stop":
      return {
        ...state,
        inProgressSince: null,
        lastCommandId: event.commandId,
      };
    case "review": {
      const result = applyGrade(state.scheduler, event.grade, event.occurredAt);
      return {
        status: "active",
        scheduler: result.state,
        inProgressSince: null,
        nextReviewAt: result.nextReviewAt,
        lastCommandId: event.commandId,
      };
    }
  }
}

type QueueEntry = {
  state: ProblemState;
  events: ProblemEvent[];
  lastReview: LastReview | null;
};

function initialQueueEntry(): QueueEntry {
  return { state: initialProblemState(), events: [], lastReview: null };
}

export function buildQueue(problems: readonly Problem[], events: readonly ProblemEvent[]): ProblemEntry[] {
  const entries = new Map<string, QueueEntry>();
  for (const event of events) {
    let entry = entries.get(event.problemId);
    if (entry == null) {
      entries.set(event.problemId, (entry = initialQueueEntry()));
    }
    entry.state = applyEvent(entry.state, event);
    entry.events.push(event);
    if (event.type === "review" && (entry.lastReview == null || event.occurredAt > entry.lastReview.occurredAt)) {
      entry.lastReview = { occurredAt: event.occurredAt, grade: event.grade };
    }
  }
  return problems.map((problem) => {
    const { state, events, lastReview } = entries.get(problem.id) ?? initialQueueEntry();
    return {
      problem,
      state,
      events,
      lastReview,
      searchFields: [],
    };
  });
}
