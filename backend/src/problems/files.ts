import { glob, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { ETag } from "../io/etag.ts";
import { ParseError } from "./error.ts";
import { type LoadState, SourceFile } from "./state.ts";

export async function findFiles(directory: string, state: LoadState): Promise<void> {
  try {
    const dirStats = await stat(directory);
    if (dirStats.isDirectory()) {
      for await (const file of glob("**/*.note", { cwd: directory })) {
        const path = join(directory, file);
        try {
          const stats = await stat(path);
          if (stats.isFile()) {
            const text = await readFile(path, "utf8");
            state.addFile(new SourceFile(path, ETag.fromStats(stats), text));
          }
        } catch (err) {
          state.addError(new ParseError(path, 0, String(err)));
        }
      }
    }
  } catch (err) {
    state.addError(new ParseError(directory, 0, String(err)));
  }
}
