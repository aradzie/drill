import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LocalDate } from "./localdate.ts";
import type { ProblemEvent } from "./problem.ts";
import { initialProblemState, type ProblemEntry } from "./state.ts";
import { EntriesByDeck, ReviewsByDate } from "./stats.ts";

function review(id: number, occurredAt: number): ProblemEvent {
  return {
    commandId: `cmd-${id}`,
    problemId: "problem-1",
    occurredAt,
    type: "review",
    grade: "good",
  };
}

describe("ReviewsByDate", () => {
  it("creates groups from readonly arrays and generators", () => {
    const first = review(1, new Date(2026, 3, 17, 9).getTime());
    const second = review(2, new Date(2026, 3, 18, 9).getTime());
    const third = review(3, new Date(2026, 3, 17, 15).getTime());
    const source: readonly ProblemEvent[] = [first, second, third];
    function* generate() {
      yield* source;
    }

    for (const input of [source, generate()]) {
      const reviews = ReviewsByDate.from(input);
      assert.deepEqual(
        [...reviews],
        [
          [new LocalDate(2026, 4, 17), [first, third]],
          [new LocalDate(2026, 4, 18), [second]],
        ],
      );
    }
  });

  it("creates groups from individual review arguments", () => {
    const first = review(1, new Date(2026, 3, 17, 9).getTime());
    const second = review(2, new Date(2026, 3, 17, 15).getTime());

    assert.deepEqual([...ReviewsByDate.of(first, second)], [[new LocalDate(2026, 4, 17), [first, second]]]);
  });

  it("creates independent empty instances from empty inputs", () => {
    const from = ReviewsByDate.from([]);
    const of = ReviewsByDate.of();
    assert.deepEqual([...from], []);
    assert.deepEqual([...of], []);

    from.add(review(1, new Date(2026, 3, 17, 9).getTime()));
    assert.deepEqual([...of], []);
  });

  it("ignores non-review events", () => {
    const reviews = new ReviewsByDate();
    reviews.add({
      commandId: "cmd-1",
      problemId: "problem-1",
      occurredAt: new Date(2026, 3, 17, 9).getTime(),
      type: "start",
    });
    assert.deepEqual([...reviews], []);
  });

  it("groups reviews by their local review date", () => {
    const reviews = new ReviewsByDate();
    const april17 = new LocalDate(2026, 4, 17);
    const april18 = new LocalDate(2026, 4, 18);
    const first = review(1, new Date(2026, 3, 17, 9).getTime());
    const second = review(2, new Date(2026, 3, 17, 15).getTime());
    const third = review(3, new Date(2026, 3, 18, 9).getTime());

    reviews.add(first);
    reviews.add(second);
    reviews.add(third);

    assert.deepEqual(reviews.get(april17), [first, second]);
    assert.deepEqual(reviews.get(april18), [third]);
    assert.deepEqual(reviews.get(new LocalDate(2026, 4, 19)), []);
  });

  it("iterates dates in first-review order", () => {
    const reviews = new ReviewsByDate();
    const april18 = review(1, new Date(2026, 3, 18, 9).getTime());
    const april17 = review(2, new Date(2026, 3, 17, 9).getTime());

    reviews.add(april18);
    reviews.add(april17);

    assert.deepEqual(
      [...reviews].map(([date, entries]) => [date.value, entries]),
      [
        ["2026-04-18", [april18]],
        ["2026-04-17", [april17]],
      ],
    );
  });
});

function problemEntry(id: string, deck: string): ProblemEntry {
  return {
    problem: { id, deck, tags: [], body: "Question", answer: "Answer", hint: null },
    state: initialProblemState(),
    events: [],
    lastReview: null,
    searchFields: [],
  };
}

describe("EntriesByDeck", () => {
  it("includes descendant problems in each ancestor and preserves the tree and input order", () => {
    const nested = problemEntry("nested", "a::b::c");
    const direct = problemEntry("direct", "a");
    const sibling = problemEntry("sibling", "a::d");
    const other = problemEntry("other", "x::b");
    const repeated = problemEntry("repeated", "a::b::c");
    const source: readonly ProblemEntry[] = [nested, direct, sibling, other, repeated];
    function* generate() {
      yield* source;
    }

    for (const input of [source, generate()]) {
      const decks = EntriesByDeck.from(input);
      assert.strictEqual(decks.get(""), decks.root);
      assert.deepEqual(decks.root, { deck: "", entries: source, children: [...decks] });
      assert.deepEqual(
        [...decks],
        [
          {
            deck: "a",
            entries: [nested, direct, sibling, repeated],
            children: [
              {
                deck: "a::b",
                entries: [nested, repeated],
                children: [{ deck: "a::b::c", entries: [nested, repeated], children: [] }],
              },
              { deck: "a::d", entries: [sibling], children: [] },
            ],
          },
          {
            deck: "x",
            entries: [other],
            children: [{ deck: "x::b", entries: [other], children: [] }],
          },
        ],
      );
      assert.strictEqual(decks.get("a::b"), decks.get("a").children[0]);
      assert.deepEqual(decks.get("a::b::c").entries, [nested, repeated]);
      assert.deepEqual(decks.get("x::b").entries, [other]);
    }
  });

  it("updates existing groups when adding problems and creates each child only once", () => {
    const direct = problemEntry("direct", "a");
    const nested = problemEntry("nested", "a::b");
    const another = problemEntry("another", "a::b");
    const decks = EntriesByDeck.from([direct]);
    const root = decks.get("a");

    decks.add(nested);
    decks.add(another);

    assert.strictEqual(decks.get("a"), root);
    assert.deepEqual(root.entries, [direct, nested, another]);
    assert.deepEqual(root.children, [{ deck: "a::b", entries: [nested, another], children: [] }]);
    assert.deepEqual([...decks], [root]);
    assert.deepEqual(decks.root.entries, [direct, nested, another]);
    assert.deepEqual(decks.root.children, [root]);
  });

  it("creates independent empty instances and rejects missing paths without creating groups", () => {
    const first = EntriesByDeck.from([]);
    const second = new EntriesByDeck();
    assert.deepEqual(first.root, { deck: "", entries: [], children: [] });
    assert.strictEqual(first.get(""), first.root);
    assert.deepEqual([...first], []);
    assert.throws(() => first.get("missing"), { message: "Unknown deck: missing" });
    assert.deepEqual([...first], []);

    first.add(problemEntry("first", "a::b"));
    assert.throws(() => first.get("b"), { message: "Unknown deck: b" });
    assert.deepEqual([...second], []);
    assert.deepEqual(second.root, { deck: "", entries: [], children: [] });
  });

  it("puts empty-deck problems directly in the root without creating a child", () => {
    const entry = problemEntry("root", "");
    const decks = EntriesByDeck.from([entry]);

    assert.deepEqual(decks.root, { deck: "", entries: [entry], children: [] });
    assert.strictEqual(decks.get(""), decks.root);
    assert.deepEqual([...decks], []);
  });
});
