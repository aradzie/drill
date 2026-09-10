export class Pager {
  static readonly pageSize = 10;

  readonly #numPages: number;
  readonly #pageIndex: number;
  readonly #pageSize: number;

  constructor(numPages: number, pageIndex: number = 0, pageSize: number = Pager.pageSize) {
    if (numPages === 0) {
      pageIndex = 0;
    } else {
      pageIndex = Math.min(pageIndex, numPages - 1);
      pageIndex = Math.max(pageIndex, 0);
    }
    this.#numPages = numPages;
    this.#pageIndex = pageIndex;
    this.#pageSize = pageSize;
  }

  static of(itemCount: number, pageIndex: number = 0, pageSize: number = Pager.pageSize): Pager {
    return new Pager(Math.ceil(itemCount / pageSize), pageIndex, pageSize);
  }

  get numPages(): number {
    return this.#numPages;
  }

  get pageIndex(): number {
    return this.#pageIndex;
  }

  get pageSize(): number {
    return this.#pageSize;
  }

  slice<T>(items: readonly T[]): readonly T[] {
    return items.slice(this.#pageIndex * this.#pageSize, this.#pageIndex * this.#pageSize + this.#pageSize);
  }

  goto(pageIndex: number): Pager {
    if (this.#pageIndex !== pageIndex) {
      return new Pager(this.#numPages, pageIndex, this.#pageSize);
    } else {
      return this;
    }
  }

  next(): Pager {
    if (this.#pageIndex < this.#numPages - 1) {
      return new Pager(this.#numPages, this.#pageIndex + 1, this.#pageSize);
    } else {
      return this;
    }
  }

  prev(): Pager {
    if (this.#pageIndex > 0) {
      return new Pager(this.#numPages, this.#pageIndex - 1, this.#pageSize);
    } else {
      return this;
    }
  }

  map<T>(cb: (index: number) => T): T[] {
    const list = [];
    for (let i = 0; i < this.#numPages; i++) {
      list.push(cb(i));
    }
    return list;
  }

  intervals(delta: number = 5): [number, number][] {
    const numPages = this.#numPages;
    const pageIndex = this.#pageIndex;
    if (numPages === 0) {
      return [];
    }
    const b1 = 0;
    const e1 = Math.min(delta, numPages);
    const b2 = Math.max(0, pageIndex - delta);
    const e2 = Math.min(pageIndex + delta + 1, numPages);
    const b3 = Math.max(0, numPages - delta);
    const e3 = numPages;
    if (e1 + 1 < b2 && e2 + 1 < b3) {
      return [
        [b1, e1],
        [b2, e2],
        [b3, e3],
      ];
    }
    if (e1 + 1 < b2) {
      return [
        [b1, e1],
        [b2, e3],
      ];
    }
    if (e2 + 1 < b3) {
      return [
        [b1, e2],
        [b3, e3],
      ];
    }
    return [[b1, e3]];
  }
}
