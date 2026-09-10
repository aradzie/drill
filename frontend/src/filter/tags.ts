import type { ProblemEntry } from "shared";

export class TagSet implements Iterable<string> {
  readonly #tags: ReadonlySet<string>;
  readonly #toggled: ReadonlySet<string>;

  static from(entries: Iterable<ProblemEntry>): TagSet {
    const tags = new Set<string>();
    const toggled = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.problem.tags) {
        tags.add(tag);
      }
    }
    return new TagSet(new Set([...tags].sort()), toggled);
  }

  private constructor(tags: ReadonlySet<string>, toggled: ReadonlySet<string>) {
    this.#tags = tags;
    this.#toggled = toggled;
  }

  [Symbol.iterator](): IterableIterator<string> {
    return this.#tags.values();
  }

  has(tag: string): boolean {
    return this.#tags.has(tag);
  }

  toggle(tag: string, add: boolean = true): TagSet {
    if (add) {
      const next = new Set<string>(this.#toggled);
      if (this.#toggled.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return new TagSet(this.#tags, next);
    } else {
      const next = new Set<string>();
      if (!this.#toggled.has(tag)) {
        next.add(tag);
      }
      return new TagSet(this.#tags, next);
    }
  }

  get hasToggled(): boolean {
    return this.#toggled.size > 0;
  }

  clearToggled(): TagSet {
    return new TagSet(this.#tags, new Set());
  }

  isToggled(tag: string): boolean {
    return this.#toggled.has(tag);
  }

  some(tags: readonly string[]): boolean {
    for (const tag of this.#toggled) {
      if (tags.includes(tag)) {
        return true;
      }
    }
    return false;
  }

  every(tags: readonly string[]): boolean {
    for (const tag of this.#toggled) {
      if (!tags.includes(tag)) {
        return false;
      }
    }
    return true;
  }
}
