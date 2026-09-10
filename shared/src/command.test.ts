import assert from "node:assert/strict";
import { test } from "node:test";
import { applyCommand, CommandError } from "./command.ts";
import type { ProblemEvent } from "./problem.ts";
import { deriveProblemState, initialProblemState } from "./state.ts";

test("start produces an event identified by its command id without changing the supplied history", () => {
  const result = applyCommand([], {
    commandId: "start",
    problemId: "p1",
    expectedCommandId: null,
    action: { type: "start" },
  });
  assert.equal(result.outcome, "appended");
  assert.equal(result.event.commandId, "start");
  assert.equal(result.event.problemId, "p1");
  assert.equal(result.event.type, "start");
  assert.equal(Object.hasOwn(result.event, "id"), false);
});

test("starting an already-open problem is a noop that preserves the original state", () => {
  const events: ProblemEvent[] = [{ commandId: "start", problemId: "p2", occurredAt: 1000, type: "start" }];
  const result = applyCommand(events, {
    commandId: "start-again",
    problemId: "p2",
    expectedCommandId: "start",
    action: { type: "start" },
  });
  assert.deepEqual(result, {
    outcome: "unchanged",
    state: { ...initialProblemState(), inProgressSince: 1000, lastCommandId: "start" },
  });
});

test("stopping a problem that is not in progress is a noop", () => {
  assert.deepEqual(
    applyCommand([], {
      commandId: "stop",
      problemId: "p",
      expectedCommandId: null,
      action: { type: "stop" },
    }),
    { outcome: "unchanged", state: initialProblemState() },
  );
});

test("retrying an accepted command with the same command id returns the original event", () => {
  const original: ProblemEvent = { commandId: "start", problemId: "p3", occurredAt: 1000, type: "start" };
  const retry = applyCommand([original], {
    commandId: "start",
    problemId: "p3",
    expectedCommandId: null,
    action: { type: "start" },
  });
  assert.deepEqual(retry, { outcome: "duplicate", event: original });
});

test("a stale expectedCommandId is rejected as a conflict", () => {
  const events: ProblemEvent[] = [{ commandId: "start", problemId: "p4", occurredAt: 1000, type: "start" }];
  assert.throws(
    () =>
      applyCommand(events, {
        commandId: "stop",
        problemId: "p4",
        expectedCommandId: null,
        action: { type: "stop" },
      }),
    (err) => err instanceof CommandError && err.code === "conflict",
  );
});

test("an easy review graduates the problem and a later fail brings it back soon", () => {
  const easy = applyCommand([], {
    commandId: "easy",
    problemId: "p6",
    expectedCommandId: null,
    action: { type: "review", grade: "easy" },
  });
  assert.equal(easy.outcome, "appended");
  const history = [easy.event];
  const easyState = deriveProblemState(history, "p6");
  assert.equal(easyState.status, "active");
  assert.equal(easyState.nextReviewAt, null);

  const fail = applyCommand(history, {
    commandId: "fail",
    problemId: "p6",
    expectedCommandId: "easy",
    action: { type: "review", grade: "fail" },
  });
  assert.equal(fail.outcome, "appended");
  history.push(fail.event);
  assert.deepEqual(
    history.map((event) => event.type),
    ["review", "review"],
  );
  const failedState = deriveProblemState(history, "p6");
  assert.equal(failedState.status, "active");
  assert.equal(failedState.scheduler.repetitions, 0);
});

test("command id reuse with different problem, action or grade is a conflict", () => {
  const command = {
    commandId: "review",
    problemId: "p",
    expectedCommandId: null,
    action: { type: "review", grade: "good" },
  } as const;
  const first = applyCommand([], command);
  assert.equal(first.outcome, "appended");
  const events = [first.event];
  for (const conflicting of [
    { ...command, problemId: "other" },
    { ...command, action: { type: "start" } as const },
    { ...command, action: { type: "review", grade: "fail" } as const },
  ]) {
    assert.throws(
      () => applyCommand(events, conflicting),
      (err: unknown) => err instanceof CommandError && err.code === "conflict",
    );
  }
  assert.deepEqual(applyCommand(events, command), { outcome: "duplicate", event: first.event });
});

test("expected command ids are scoped to the problem and stale non-null tokens conflict", () => {
  const command = { commandId: "first", problemId: "p", expectedCommandId: null, action: { type: "start" } } as const;
  const first = applyCommand([], command);
  assert.equal(first.outcome, "appended");
  const events = [first.event];
  const other = applyCommand(events, { ...command, commandId: "other", problemId: "q" });
  assert.equal(other.outcome, "appended");
  events.push(other.event);
  const stop = applyCommand(events, {
    ...command,
    commandId: "stop",
    expectedCommandId: "first",
    action: { type: "stop" },
  });
  assert.equal(stop.outcome, "appended");
  events.push(stop.event);
  assert.throws(
    () => applyCommand(events, { ...command, commandId: "stale", expectedCommandId: "first" }),
    (err: unknown) => err instanceof CommandError && err.code === "conflict",
  );
  assert.deepEqual(applyCommand(events, command), { outcome: "duplicate", event: first.event });
});
