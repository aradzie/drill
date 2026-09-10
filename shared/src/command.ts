import { z } from "zod";
import { type ProblemAction, problemActionSchema, type ProblemEvent, problemEventSchema } from "./problem.ts";
import { deriveProblemState, type ProblemState, problemStateSchema } from "./state.ts";
import type { DeepReadonly } from "./types.ts";

export class CommandError extends Error {
  readonly code: "invalid" | "conflict";

  constructor(code: "invalid" | "conflict", message: string) {
    super(message);
    this.name = "CommandError";
    this.code = code;
  }
}

/** A request to append a `ProblemEvent`, validated against current state before acceptance. */
export type ProblemCommand = DeepReadonly<{
  commandId: string;
  problemId: string;
  /** The command ID of the latest event the client has seen for this problem, or null if it has none. */
  expectedCommandId: string | null;
  action: ProblemAction;
}>;

export const problemCommandSchema: z.ZodType<ProblemCommand> = z.object({
  commandId: z.string().min(1),
  problemId: z.string().min(1),
  expectedCommandId: z.string().nullable(),
  action: problemActionSchema,
});

export type CommandResult = DeepReadonly<
  | { outcome: "appended"; event: ProblemEvent }
  | { outcome: "duplicate"; event: ProblemEvent }
  | { outcome: "unchanged"; state: ProblemState }
>;

export const commandResultSchema: z.ZodType<CommandResult> = z.discriminatedUnion("outcome", [
  z.object({ outcome: z.literal("appended"), event: problemEventSchema }),
  z.object({ outcome: z.literal("duplicate"), event: problemEventSchema }),
  z.object({ outcome: z.literal("unchanged"), state: problemStateSchema }),
]);

export function applyCommand(events: readonly ProblemEvent[], command: ProblemCommand): CommandResult {
  const existing = events.find((event) => event.commandId === command.commandId);
  if (existing) {
    if (matchesCommandPayload(existing, command)) {
      return { outcome: "duplicate", event: existing };
    } else {
      throw new CommandError("conflict", "command id reused for a different problem or action");
    }
  }

  const state = deriveProblemState(events, command.problemId);
  if (command.expectedCommandId !== state.lastCommandId) {
    throw new CommandError("conflict", "stale state; reload and retry");
  }

  if (!willChangeState(state, command.action)) {
    return { outcome: "unchanged", state };
  }

  return {
    outcome: "appended",
    event: {
      commandId: command.commandId,
      problemId: command.problemId,
      occurredAt: Date.now(),
      ...command.action,
    },
  };
}

function matchesCommandPayload(event: ProblemEvent, command: ProblemCommand): boolean {
  if (event.problemId !== command.problemId || event.type !== command.action.type) {
    return false;
  }
  if (event.type === "review" && command.action.type === "review") {
    return event.grade === command.action.grade;
  }
  return true;
}

function willChangeState(state: ProblemState, action: ProblemAction): boolean {
  switch (action.type) {
    case "start":
      return state.inProgressSince == null;
    case "stop":
      return state.inProgressSince != null;
    case "review":
      return true;
  }
}
