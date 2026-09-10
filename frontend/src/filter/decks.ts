import { EntriesByDeck, type EntriesByDeckEntry, type ProblemEntry } from "shared";

export type DeckOption = {
  readonly path: string;
  readonly label: string;
  readonly depth: number;
};

/** A dropdown selection of one deck (or none); a selected deck matches itself and all its subdecks. */
export class DeckSet {
  static from(entries: Iterable<ProblemEntry>): DeckSet {
    const tree = EntriesByDeck.from(entries);
    const options: DeckOption[] = [];
    const visit = (children: readonly EntriesByDeckEntry[], depth: number) => {
      for (const child of children) {
        options.push({ path: child.deck, label: child.deck.split("::").at(-1)!, depth });
        visit(child.children, depth + 1);
      }
    };
    visit(tree.root.children, 0);
    return new DeckSet(options, "");
  }

  readonly #options: readonly DeckOption[];
  readonly #selected: string;

  private constructor(options: readonly DeckOption[], selected: string) {
    this.#options = options;
    this.#selected = selected;
  }

  get options(): readonly DeckOption[] {
    return this.#options;
  }

  get selected(): string {
    return this.#selected;
  }

  get hasSelected(): boolean {
    return this.#selected !== "";
  }

  select(path: string): DeckSet {
    return new DeckSet(this.#options, path);
  }

  clearSelected(): DeckSet {
    return new DeckSet(this.#options, "");
  }

  matches(deck: string): boolean {
    return this.#selected === "" || deck === this.#selected || deck.startsWith(`${this.#selected}::`);
  }
}
