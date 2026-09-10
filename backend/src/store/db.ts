import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { GRADES, type ProblemEvent, problemEventSchema } from "shared";
import { z } from "zod";
import { ETag } from "../io/etag.ts";
import { problemsDir } from "../paths.ts";
import { Queue } from "./queue.ts";

// On-disk columns. Only review events include a grade.
const eventRowBase = [z.string().min(1), z.string().min(1), z.string().min(1)] as const;
const eventRowSchema = z.union([
  z.tuple([...eventRowBase, z.literal("review"), z.enum(GRADES)]),
  z.tuple([...eventRowBase, z.enum(["start", "stop"])]),
]);
type EventRow = z.infer<typeof eventRowSchema>;

function toRow(event: ProblemEvent): EventRow {
  if (event.type === "review") {
    return [event.commandId, event.problemId, new Date(event.occurredAt).toISOString(), event.type, event.grade];
  } else {
    return [event.commandId, event.problemId, new Date(event.occurredAt).toISOString(), event.type];
  }
}

function fromRow(value: unknown): ProblemEvent {
  const [commandId, problemId, occurredAt, type, grade] = eventRowSchema.parse(value);
  return Object.freeze(
    problemEventSchema.parse(
      type === "review"
        ? { commandId, problemId, occurredAt: Date.parse(occurredAt), type, grade }
        : { commandId, problemId, occurredAt: Date.parse(occurredAt), type },
    ),
  );
}

type Snapshot = {
  readonly etag: ETag;
  readonly history: ProblemEvent[];
  readonly error?: Error;
};

/** Serializes reads and writes so queued operations see committed history. */
export abstract class Db {
  readonly #queue: Queue = new Queue();

  static open(filePath = process.env.DB_PATH ?? path.join(problemsDir, "reviews.jsonl")): Db {
    return filePath === ":memory:" ? new MemoryDb() : new FsDb(filePath);
  }

  protected abstract readEvents(): Promise<readonly ProblemEvent[]>;
  protected abstract writeEvents(history: readonly ProblemEvent[]): Promise<void>;

  save(): Promise<void> {
    return this.#queue.enqueue(async () => await this.writeEvents(await this.readEvents()));
  }

  events(): Promise<readonly ProblemEvent[]> {
    return this.#queue.enqueue(async () => [...(await this.readEvents())]);
  }

  /** Assumes a valid event whose caller respects the readonly ProblemEvent contract. */
  append(event: ProblemEvent): Promise<ProblemEvent> {
    return this.#queue.enqueue(async () => {
      const history = await this.readEvents();
      if (history.some((previous) => previous.commandId === event.commandId)) {
        throw new Error(`duplicate command id: ${event.commandId}`);
      }
      await this.writeEvents([...history, event]);
      return event;
    });
  }
}

export class MemoryDb extends Db {
  #history: readonly ProblemEvent[] = [];

  protected async readEvents(): Promise<readonly ProblemEvent[]> {
    return this.#history;
  }

  protected async writeEvents(history: readonly ProblemEvent[]): Promise<void> {
    this.#history = history;
  }
}

/** One server owns a file. Events become visible only after a successful atomic save. */
export class FsDb extends Db {
  readonly #filePath: string;
  #snapshot: Snapshot = { etag: ETag.notFound, history: [] };

  constructor(filePath: string) {
    super();
    this.#filePath = path.resolve(filePath);
  }

  protected async readEvents(): Promise<readonly ProblemEvent[]> {
    const etag = await ETag.read(this.#filePath);
    if (etag.equal(ETag.notFound)) {
      this.#snapshot = { etag, history: [] };
      return this.#snapshot.history;
    }
    if (!etag.equal(this.#snapshot.etag)) {
      this.#snapshot = await this.#readSnapshot(etag);
    }
    if (this.#snapshot.error) {
      throw this.#snapshot.error;
    } else {
      return this.#snapshot.history;
    }
  }

  async #readSnapshot(etag: ETag): Promise<Snapshot> {
    const contents = await readFile(this.#filePath, { encoding: "utf8" });
    const history: ProblemEvent[] = [];
    const commandIds = new Set<string>();
    for (const [index, line] of contents.split("\n").entries()) {
      if (line !== "") {
        try {
          const event = fromRow(JSON.parse(line));
          if (commandIds.has(event.commandId)) {
            throw new Error(`duplicate command id: ${event.commandId}`);
          }
          commandIds.add(event.commandId);
          history.push(event);
        } catch (err) {
          return {
            etag,
            history: [],
            error: new Error(`Invalid JSONL database at ${this.#filePath}:${index + 1}`, { cause: err }),
          };
        }
      }
    }
    return { etag, history };
  }

  protected async writeEvents(history: ProblemEvent[]): Promise<void> {
    const contents = history.map((event) => JSON.stringify(toRow(event)) + "\n").join("");
    const temporaryPath = `${this.#filePath}.${randomUUID()}.tmp`;
    await mkdir(path.dirname(temporaryPath), { recursive: true });
    try {
      await writeFile(temporaryPath, contents, { encoding: "utf8", flag: "wx", flush: true });
      const etag = await ETag.read(temporaryPath);
      await rename(temporaryPath, this.#filePath);
      this.#snapshot = { etag, history };
    } catch (err) {
      await rm(temporaryPath, { force: true });
      throw err;
    }
  }
}
