import type { Stats } from "node:fs";
import { stat } from "node:fs/promises";

/**
 * A file change token based on modification time and size.
 * Equal tags do not guarantee identical contents.
 */
export class ETag {
  static readonly notFound = new ETag(-1, -1);

  static async read(path: string): Promise<ETag> {
    try {
      return ETag.fromStats(await stat(path));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return ETag.notFound;
      } else {
        throw err;
      }
    }
  }

  static fromStats({ mtimeMs, size }: Stats): ETag {
    return new ETag(mtimeMs, size);
  }

  readonly #mtime: number;
  readonly #size: number;

  constructor(mtime: number, size: number) {
    this.#mtime = mtime;
    this.#size = size;
  }

  equal(that: ETag): boolean {
    return this.#mtime === that.#mtime && this.#size === that.#size;
  }
}
