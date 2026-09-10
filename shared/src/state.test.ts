import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Problem, ProblemAction, ProblemEvent } from "./problem.ts";
import { applyEvent, buildQueue, initialProblemState } from "./state.ts";

let nextId = 1;

function event(problemId: string, action: ProblemAction, occurredAt: number): ProblemEvent {
  return { commandId: `cmd-${nextId++}`, problemId, occurredAt, ...action };
}

function fold(events: ProblemEvent[]) {
  let state = initialProblemState();
  for (const event of events) {
    state = applyEvent(state, event);
  }
  return state;
}

describe("reducer scenarios", () => {
  it("normal learning", () => {
    const t0 = Date.parse("2026-01-01");
    const events = [
      event("p1", { type: "review", grade: "fail" }, t0),
      event("p1", { type: "review", grade: "fail" }, t0 + 1),
      event("p1", { type: "review", grade: "hard" }, t0 + 2),
      event("p1", { type: "review", grade: "good" }, t0 + 3),
      event("p1", { type: "review", grade: "easy" }, t0 + 4),
    ];
    const state = fold(events);
    assert.equal(state.status, "active");
    // The final easy grade graduates the problem out of automatic scheduling.
    assert.equal(state.nextReviewAt, null);
  });

  it("stop a new problem without grading returns it to new", () => {
    const state = fold([event("p1", { type: "start" }, 1), event("p1", { type: "stop" }, 2)]);
    assert.equal(state.status, "new");
    assert.equal(state.inProgressSince, null);
  });

  it("stopping preserves the due date", () => {
    const t0 = Date.parse("2026-01-01");
    let state = fold([event("p1", { type: "review", grade: "good" }, t0)]);
    const dueAt = state.nextReviewAt;
    state = applyEvent(state, event("p1", { type: "start" }, t0 + 1000));
    state = applyEvent(state, event("p1", { type: "stop" }, t0 + 2000));
    assert.equal(state.nextReviewAt, dueAt);
    assert.equal(state.status, "active");
  });

  it("an easy grade graduates the problem without changing status", () => {
    const state = fold([event("p1", { type: "review", grade: "easy" }, 1)]);
    assert.equal(state.status, "active");
    assert.equal(state.nextReviewAt, null);
  });

  it("failing an easy problem brings it back soon", () => {
    const state = fold([
      event("p1", { type: "review", grade: "easy" }, 1),
      event("p1", { type: "review", grade: "fail" }, 2),
    ]);
    assert.equal(state.scheduler.repetitions, 0);
    assert.equal(state.scheduler.interval, 2);
  });
});

describe("buildQueue lastReview", () => {
  const problems: Problem[] = [{ id: "p1", deck: "", tags: [], body: "", answer: "", hint: null }];

  it("is null when there is no review", () => {
    const [entry] = buildQueue(problems, [event("p1", { type: "start" }, 1)]);
    assert.equal(entry.lastReview, null);
  });

  it("reflects the most recent review by time, not history order", () => {
    const events = [
      event("p1", { type: "review", grade: "fail" }, 2),
      event("p1", { type: "review", grade: "easy" }, 1),
    ];
    const [entry] = buildQueue(problems, events);
    assert.deepEqual(entry.lastReview, { occurredAt: 2, grade: "fail" });
  });
});

describe("command identity", () => {
  it("tracks the latest command for every event type in supplied order", () => {
    let state = initialProblemState();
    assert.equal(state.lastCommandId, null);
    const actions: ProblemAction[] = [
      { type: "start" },
      { type: "stop" },
      { type: "review", grade: "good" },
      { type: "review", grade: "easy" },
    ];
    for (const [index, action] of actions.entries()) {
      const next = { ...event("p", action, 1000 - index), commandId: `cmd-${actions.length - index}` };
      state = applyEvent(state, next);
      assert.equal(state.lastCommandId, next.commandId);
    }
  });
});
