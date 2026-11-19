import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQueue } from "shared";
import { Filter } from "./filter.ts";

// buildQueue leaves entry tags empty; the collection fills them in from the problem.
const entries = buildQueue(
  [
    { id: "a", deck: "calculus::limits", tags: ["chain-rule", "optimization"], body: "A", answer: "x", hint: null },
    { id: "b", deck: "algebra", tags: ["optimization"], body: "B", answer: "x", hint: null },
  ],
  [],
).map((entry) => ({ ...entry, tags: [...entry.problem.tags] }));
const base = Filter.from(entries);

test("selection survives a round trip through search params", () => {
  const filter = base
    .withDecks(base.decks.select("calculus::limits"))
    .withTags(base.tags.toggleSelected("chain-rule").toggleSelected("optimization"))
    .withQuery({ text: "two words" });
  const params = new URLSearchParams(filter.toSearchParams().toString());
  const restored = base.withSearchParams(params);
  assert.equal(restored.decks.selected, "calculus::limits");
  assert.ok(restored.tags.isSelected("chain-rule") && restored.tags.isSelected("optimization"));
  assert.equal(restored.query.text, "two words");
});

test("an unfiltered selection serializes to nothing", () => {
  assert.equal(base.toSearchParams().toString(), "");
  assert.equal(base.withSearchParams(new URLSearchParams()).isActive, false);
});

test("unknown decks and tags are ignored and repeated tags are not toggled off", () => {
  const filter = base.withSearchParams(new URLSearchParams("deck=nope&tag=nope&tag=optimization&tag=optimization"));
  assert.equal(filter.decks.hasSelected, false);
  assert.ok(filter.tags.isSelected("optimization"));
  assert.equal(filter.toSearchParams().toString(), "tag=optimization");
});
