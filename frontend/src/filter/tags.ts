import type { ProblemEntry } from "shared";

export class TagSet implements Iterable<string> {
  readonly #tags: ReadonlySet<string>;
  readonly #selected: ReadonlySet<string>;

  static from(entries: Iterable<ProblemEntry>): TagSet {
    const tags = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags) {
        tags.add(tag);
      }
    }
    return new TagSet(new Set([...tags].sort()), new Set());
  }

  private constructor(tags: ReadonlySet<string>, selected: ReadonlySet<string>) {
    this.#tags = tags;
    this.#selected = selected;
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.#tags.values();
  }

  has(tag: string): boolean {
    return this.#tags.has(tag);
  }

  isSelected(tag: string): boolean {
    return this.#selected.has(tag);
  }

  toggleSelected(tag: string, add: boolean = true): TagSet {
    if (!this.#tags.has(tag)) {
      return this;
    }
    if (add) {
      const next = new Set<string>(this.#selected);
      if (this.#selected.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return new TagSet(this.#tags, next);
    } else {
      const next = new Set<string>();
      if (!this.#selected.has(tag) || this.#selected.size > 1) {
        next.add(tag);
      }
      return new TagSet(this.#tags, next);
    }
  }

  get hasSelected(): boolean {
    return this.#selected.size > 0;
  }

  clearSelected(): TagSet {
    return new TagSet(this.#tags, new Set());
  }

  every(entry: ProblemEntry): boolean {
    for (const tag of this.#selected) {
      if (!entry.tags.includes(tag)) {
        return false;
      }
    }
    return true;
  }
}
