import type { ProblemEntry } from "shared";
import { DeckSet } from "./decks.ts";
import { entryMatches, normalizeSearchText, type Query } from "./search.ts";
import { TagSet } from "./tags.ts";

export class Filter {
  static from(entries: Iterable<ProblemEntry>): Filter {
    return new Filter().withDecks(DeckSet.from(entries)).withTags(TagSet.from(entries));
  }

  #decks = DeckSet.from([]);
  #tags = TagSet.from([]);
  #query: Query = { text: "" };

  get decks(): DeckSet {
    return this.#decks;
  }

  get tags(): TagSet {
    return this.#tags;
  }

  get query(): Query {
    return this.#query;
  }

  get isActive(): boolean {
    return this.#decks.hasSelected || this.#tags.hasToggled || this.#query.text !== "";
  }

  withDecks(decks: DeckSet): Filter {
    const filter = new Filter();
    filter.#decks = decks;
    filter.#tags = this.#tags;
    filter.#query = this.#query;
    return filter;
  }

  withTags(tags: TagSet): Filter {
    const filter = new Filter();
    filter.#decks = this.#decks;
    filter.#tags = tags;
    filter.#query = this.#query;
    return filter;
  }

  withQuery(query: Query): Filter {
    const filter = new Filter();
    filter.#decks = this.#decks;
    filter.#tags = this.#tags;
    filter.#query = query;
    return filter;
  }

  reset(): Filter {
    return new Filter().withDecks(this.#decks.clearSelected()).withTags(this.#tags.clearToggled());
  }

  filter(entries: readonly ProblemEntry[]): ProblemEntry[] {
    const result: ProblemEntry[] = [];
    const test = this.#predicate();
    for (const entry of entries) {
      if (test(entry)) {
        result.push(entry);
      }
    }
    return result;
  }

  #predicate(): (entry: ProblemEntry) => boolean {
    const decks = this.#decks;
    const tags = this.#tags;
    const query = { text: normalizeSearchText(this.#query.text) };
    return (entry) => decks.matches(entry.problem.deck) && tags.every(entry.problem.tags) && entryMatches(entry, query);
  }
}
