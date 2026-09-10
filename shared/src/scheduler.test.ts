import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyGrade, initialSchedulerState, type SchedulerState } from "./scheduler.ts";

function grade(state: SchedulerState, grade: Parameters<typeof applyGrade>[1], at = 0): SchedulerState {
  return applyGrade(state, grade, at).state;
}

describe("graduation via streaks", () => {
  it("graduates immediately on an easy grade", () => {
    const result = applyGrade(initialSchedulerState, "easy", 0);
    assert.equal(result.nextReviewAt, null);
    assert.deepEqual(result.state.streak, { grade: "easy", count: 1 });
  });

  it("does not graduate on a single good grade", () => {
    const result = applyGrade(initialSchedulerState, "good", 0);
    assert.ok(result.nextReviewAt != null);
    assert.deepEqual(result.state.streak, { grade: "good", count: 1 });
  });

  it("graduates on a second consecutive good grade", () => {
    let state = grade(initialSchedulerState, "good");
    const result = applyGrade(state, "good", 0);
    assert.equal(result.nextReviewAt, null);
    assert.deepEqual(result.state.streak, { grade: "good", count: 2 });
  });

  it("a different grade in between resets the streak, so good-hard-good does not graduate", () => {
    let state = grade(initialSchedulerState, "good");
    state = grade(state, "hard");
    const result = applyGrade(state, "good", 0);
    assert.ok(result.nextReviewAt != null);
    assert.deepEqual(result.state.streak, { grade: "good", count: 1 });
  });

  it("a following good after the reset graduates the problem", () => {
    let state = grade(initialSchedulerState, "good");
    state = grade(state, "hard");
    state = grade(state, "good");
    const result = applyGrade(state, "good", 0);
    assert.equal(result.nextReviewAt, null);
  });

  it("very_hard and hard never graduate a problem, however long the streak", () => {
    let state = initialSchedulerState;
    let result = applyGrade(state, "very_hard", 0);
    for (let i = 0; i < 10; i++) {
      result = applyGrade(result.state, "very_hard", 0);
      assert.ok(result.nextReviewAt != null);
    }
  });

  it("failing after graduation resumes normal scheduling", () => {
    const graduated = grade(initialSchedulerState, "easy");
    const result = applyGrade(graduated, "fail", 0);
    assert.ok(result.nextReviewAt != null);
    assert.equal(result.state.repetitions, 0);
  });
});
