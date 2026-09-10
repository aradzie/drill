import assert from "node:assert/strict";
import { test } from "node:test";
import { Pager } from "./pager.ts";

test("Pager.of paginates by size and slices the given items", () => {
  const items = Array.from({ length: 25 }, (_, i) => i);
  const pager = Pager.of(items.length);

  assert.equal(pager.numPages, 3);
  assert.equal(pager.pageIndex, 0);
  assert.deepEqual(pager.slice(items), items.slice(0, 10));
});

test("Pager.of clamps an out-of-range pageIndex", () => {
  assert.equal(Pager.of(25, 99).pageIndex, 2);
  assert.equal(Pager.of(25, -5).pageIndex, 0);
  assert.equal(Pager.of(0, 5).pageIndex, 0);
});

test("goto/next/prev move between pages and clamp at the edges", () => {
  const items = Array.from({ length: 25 }, (_, i) => i);
  let pager = Pager.of(items.length);

  pager = pager.next();
  assert.equal(pager.pageIndex, 1);
  assert.deepEqual(pager.slice(items), items.slice(10, 20));

  pager = pager.goto(2);
  assert.equal(pager.pageIndex, 2);
  assert.deepEqual(pager.slice(items), items.slice(20, 25));

  assert.equal(pager.next().pageIndex, 2);
  assert.equal(pager.goto(0).prev().pageIndex, 0);
});

test("slice reflects whatever items are passed in, not a stored snapshot", () => {
  const pager = Pager.of(25, 1);
  const before = Array.from({ length: 25 }, (_, i) => i);
  const after = Array.from({ length: 25 }, (_, i) => i * 10);

  assert.deepEqual(pager.slice(before), [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  assert.deepEqual(pager.slice(after), [100, 110, 120, 130, 140, 150, 160, 170, 180, 190]);
});
