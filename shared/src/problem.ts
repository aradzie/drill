import { z } from "zod";
import type { DeepReadonly } from "./types.ts";

export type ErrorMessage = DeepReadonly<{
  path: string;
  line: number;
  message: string;
}>;

export type Grade =
  | "fail" //
  | "very_hard"
  | "hard"
  | "good"
  | "easy";
export const GRADES = Object.freeze<Grade[]>([
  "fail", //
  "very_hard",
  "hard",
  "good",
  "easy",
]);

export type Problem = DeepReadonly<{
  id: string;
  deck: string;
  tags: string[];
  body: string;
  answer: string;
  hint: string | null;
}>;

export const problemSchema: z.ZodType<Problem> = z.object({
  id: z.string(),
  deck: z.string(),
  tags: z.array(z.string()),
  body: z.string(),
  answer: z.string(),
  hint: z.string().nullable(),
});

/** What the user asks the application to do to a problem right now. */
export type ProblemAction = DeepReadonly<
  | { type: "review"; grade: Grade } //
  | { type: "start" }
  | { type: "stop" }
>;

export const problemActionSchema: z.ZodType<ProblemAction> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("review"), grade: z.enum(GRADES as [Grade, ...Grade[]]) }),
  z.object({ type: z.literal("start") }),
  z.object({ type: z.literal("stop") }),
]);

/** An accepted action recorded in history. Identified by `commandId`; the server assigns `occurredAt`. */
export type ProblemEvent = DeepReadonly<{
  commandId: string;
  problemId: string;
  occurredAt: number;
}> &
  ProblemAction;

const problemEventBaseSchema = z.object({
  commandId: z.string(),
  problemId: z.string(),
  occurredAt: z.number(),
});

export const problemEventSchema: z.ZodType<ProblemEvent> = z.discriminatedUnion("type", [
  problemEventBaseSchema.extend({
    type: z.literal("review"),
    grade: z.enum(GRADES as [Grade, ...Grade[]]),
  }),
  problemEventBaseSchema.extend({ type: z.literal("start") }),
  problemEventBaseSchema.extend({ type: z.literal("stop") }),
]);
