import { z } from "zod";
import { LocalDate } from "./localdate.ts";
import { type Grade, GRADES } from "./problem.ts";
import type { DeepReadonly } from "./types.ts";

const START_EASE = 2.0;
const MIN_EASE = 1.3;
const MAX_EASE = 2.8;
const FAIL_INTERVAL_DAYS = 2;

/** The current run of consecutive identical grades. */
export type Streak = DeepReadonly<{
  grade: Grade;
  count: number;
}>;

export type SchedulerState = DeepReadonly<{
  repetitions: number;
  interval: number;
  ease: number;
  streak: Streak | null;
}>;

const streakSchema = z.object({
  grade: z.enum(GRADES as [Grade, ...Grade[]]),
  count: z.number(),
});

export const schedulerStateSchema = z.object({
  repetitions: z.number(),
  interval: z.number(),
  ease: z.number(),
  streak: streakSchema.nullable(),
});

export const initialSchedulerState = Object.freeze<SchedulerState>({
  repetitions: 0,
  interval: 0,
  ease: START_EASE,
  streak: null,
});

type PassGrade = Exclude<Grade, "fail">;

const EASE_DELTA: Record<Grade, number> = {
  fail: -0.2,
  very_hard: -0.1,
  hard: -0.05,
  good: 0.05,
  easy: 0.15,
};

/** Base interval in days for a passing grade, scaled by the resulting ease. */
const BASE_INTERVAL_DAYS: Record<PassGrade, number> = {
  very_hard: 5,
  hard: 7,
  good: 30,
  easy: 90,
};

/**
 * Consecutive identical grades required to graduate a problem out of automatic scheduling.
 * A grade absent from this table never graduates a problem, however long its streak.
 */
const GRADUATION_THRESHOLD: Partial<Record<Grade, number>> = {
  good: 2,
  easy: 1,
};

export type GradeResult = {
  state: SchedulerState;
  /** Null when the review graduates the problem out of automatic scheduling. */
  nextReviewAt: number | null;
};

/** Computes the next interval for a review grade. Problems have no separate mastery status. */
export function applyGrade(current: SchedulerState, grade: Grade, gradedAt: number): GradeResult {
  let repetitions: number;
  let ease: number;
  let interval: number;
  if (grade === "fail") {
    repetitions = 0;
    ease = Math.max(MIN_EASE, current.ease + EASE_DELTA.fail);
    interval = FAIL_INTERVAL_DAYS;
  } else {
    repetitions = current.repetitions + 1;
    ease = Math.min(MAX_EASE, current.ease + EASE_DELTA[grade]);
    interval = BASE_INTERVAL_DAYS[grade] * ease;
  }
  const streak: Streak =
    current.streak?.grade === grade ? { grade, count: current.streak.count + 1 } : { grade, count: 1 };
  const graduated = streak.count >= (GRADUATION_THRESHOLD[grade] ?? Infinity);
  return {
    state: { interval, ease, repetitions, streak },
    nextReviewAt: graduated ? null : new LocalDate(gradedAt).plusDays(Math.round(interval)).timestamp,
  };
}
