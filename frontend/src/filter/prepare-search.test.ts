import assert from "node:assert/strict";
import { test } from "node:test";
import { expandTags } from "./prepare-search.ts";

test("expandTags adds ancestors before each hierarchical tag", () => {
  assert.deepEqual(expandTags([]), []);
  assert.deepEqual(expandTags(["A/B/C"]), ["A", "A/B", "A/B/C"]);
  assert.deepEqual(expandTags(["X", "A/B"]), ["X", "A", "A/B"]);
});

test("expandTags keeps each tag once", () => {
  assert.deepEqual(expandTags(["A/B", "A/C", "A"]), ["A", "A/B", "A/C"]);
  assert.deepEqual(expandTags(["A/B", "A/B"]), ["A", "A/B"]);
});
