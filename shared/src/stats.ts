import { LocalDate } from "./localdate.ts";
import type { ProblemEvent } from "./problem.ts";
import type { ProblemEntry } from "./state.ts";

export type ProblemStateCounts = {
  readonly total: number;
  readonly new: number;
  readonly active: number;
};

/** Counts current statuses; active problems have at least one review. */
export function countProblemStates(entries: Iterable<ProblemEntry>): ProblemStateCounts {
  const counts = { new: 0, active: 0 };
  for (const { state } of entries) {
    counts[state.status] += 1;
  }
  return {
    ...counts,
    total: counts.new + counts.active,
  };
}

export function computeStats(entries: readonly ProblemEntry[], events: readonly ProblemEvent[]) {
  let reviewCount = 0;
  const reviewedProblemIds = new Set<string>();
  for (const event of events) {
    if (event.type === "review") {
      reviewCount += 1;
      reviewedProblemIds.add(event.problemId);
    }
  }
  return Object.freeze<Stats>({
    totalProblemCount: entries.length,
    reviewedProblemCount: reviewedProblemIds.size,
    reviewCount,
    reviewsByDate: ReviewsByDate.from(events),
  });
}

export type Stats = {
  readonly totalProblemCount: number;
  readonly reviewedProblemCount: number;
  readonly reviewCount: number;
  readonly reviewsByDate: ReviewsByDate;
};

/** Groups review events by their local occurrence date, e.g. for an activity calendar. */
export class ReviewsByDate implements Iterable<[LocalDate, readonly ProblemEvent[]]> {
  readonly #data = new Map<number, { date: LocalDate; events: ProblemEvent[] }>();

  static from(events: Iterable<ProblemEvent>): ReviewsByDate {
    const result = new ReviewsByDate();
    for (const event of events) {
      result.add(event);
    }
    return result;
  }

  static of(...events: ProblemEvent[]): ReviewsByDate {
    return ReviewsByDate.from(events);
  }

  *[Symbol.iterator](): IterableIterator<[LocalDate, readonly ProblemEvent[]]> {
    for (const { date, events } of this.#data.values()) {
      yield [date, events];
    }
  }

  add(event: ProblemEvent): void {
    if (event.type !== "review") return;
    const date = new LocalDate(event.occurredAt);
    let entry = this.#data.get(date.timestamp);
    if (entry == null) {
      this.#data.set(date.timestamp, (entry = { date, events: [] }));
    }
    entry.events.push(event);
  }

  get(date: LocalDate): readonly ProblemEvent[] {
    return this.#data.get(date.timestamp)?.events ?? emptyEvents;
  }
}

const emptyEvents = Object.freeze<ProblemEvent[]>([]);

export type EntriesByDeckEntry = {
  /** Full deck path, including its ancestors. */
  readonly deck: string;
  /** Problems in this deck or any descendant deck, in input order. */
  readonly entries: readonly ProblemEntry[];
  /** Immediate subdecks in first-encounter order; top-level decks for the root. */
  readonly children: readonly EntriesByDeckEntry[];
};

/** Groups problems by deck ancestry; iteration yields top-level decks in first-encounter order. */
export class EntriesByDeck implements Iterable<EntriesByDeckEntry> {
  static from(entries: Iterable<ProblemEntry>): EntriesByDeck {
    const result = new EntriesByDeck();
    for (const entry of entries) {
      result.add(entry);
    }
    return result;
  }

  readonly #root = { deck: "", entries: [] as ProblemEntry[], children: [] as EntriesByDeckEntry[] };
  readonly #data = new Map<string, { deck: string; entries: ProblemEntry[]; children: EntriesByDeckEntry[] }>([
    ["", this.#root],
  ]);

  /** The empty-path root contains every problem and all top-level decks. */
  get root(): EntriesByDeckEntry {
    return this.#root;
  }

  [Symbol.iterator](): IterableIterator<EntriesByDeckEntry> {
    return this.#root.children.values();
  }

  add(entry: ProblemEntry): void {
    this.#root.entries.push(entry);
    const segments = [];
    let parent = this.#root;
    for (const directory of entry.problem.deck.split("::")) {
      segments.push(directory);
      const path = segments.join("::");
      let group = this.#data.get(path);
      if (group == null) {
        group = { deck: path, entries: [], children: [] };
        this.#data.set(path, group);
        parent.children.push(group);
      }
      if (group !== this.#root) {
        group.entries.push(entry);
      }
      parent = group;
    }
  }

  /** Looks up a full deck path; throws if the deck is absent. */
  get(path: string): EntriesByDeckEntry {
    const group = this.#data.get(path);
    if (group == null) {
      throw new Error(`Unknown deck: ${path}`);
    }
    return group;
  }
}
