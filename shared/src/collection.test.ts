import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCollection } from "./collection.ts";
import { LocalDate } from "./localdate.ts";
import type { Problem, ProblemEvent } from "./problem.ts";

function problem(id: string): Problem {
  return { id, deck: "", tags: [], body: "Question", answer: "Answer", hint: null };
}

function review(problemId: string, commandId: string, occurredAt: number): ProblemEvent {
  return { commandId, problemId, occurredAt, type: "review", grade: "easy" };
}

describe("buildCollection reviewed list", () => {
  it("lists active problems most-recently-reviewed first, regardless of due date", () => {
    const problems = [problem("p1"), problem("p2"), problem("p3")];
    const events: ProblemEvent[] = [
      review("p1", "cmd-1", 1000),
      review("p2", "cmd-2", 3000),
      review("p1", "cmd-3", 2000),
    ];
    const collection = buildCollection(problems, events, LocalDate.now());
    assert.deepEqual(
      collection["reviewed"].map((entry) => entry.problem.id),
      ["p2", "p1"],
    );
  });

  it("excludes never-reviewed problems", () => {
    const problems = [problem("p1"), problem("p2")];
    const events: ProblemEvent[] = [review("p1", "cmd-1", 1000)];
    const collection = buildCollection(problems, events, LocalDate.now());
    assert.deepEqual(
      collection["reviewed"].map((entry) => entry.problem.id),
      ["p1"],
    );
  });
});
