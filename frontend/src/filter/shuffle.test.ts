import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQueue } from "shared";
import { shuffleProblems } from "./shuffle.ts";

const entries = buildQueue(
  Array.from({ length: 30 }, (_, i) => ({
    id: `problem-${i}`,
    deck: "calculus",
    tags: [],
    body: "Problem",
    answer: "Answer",
    hint: null,
  })),
  [],
);

test("shuffling is repeatable, preserves entries, and does not mutate the input", () => {
  const original = [...entries];
  const shuffled = shuffleProblems(entries, 123);
  assert.deepEqual(shuffled, shuffleProblems(entries, 123));
  assert.deepEqual(new Set(shuffled), new Set(entries));
  assert.deepEqual(entries, original);
  assert.notDeepEqual(shuffled, entries);
  assert.notDeepEqual(shuffled, shuffleProblems(entries, 456));
});

test("filtering and removing problems preserve the remaining relative order", () => {
  const subset = entries.filter((_, i) => i % 3 !== 0);
  const retained = new Set(subset);
  assert.deepEqual(
    shuffleProblems(subset, 123),
    shuffleProblems(entries, 123).filter((entry) => retained.has(entry)),
  );
  assert.deepEqual(shuffleProblems(entries.toReversed(), 123), shuffleProblems(entries, 123));
});
