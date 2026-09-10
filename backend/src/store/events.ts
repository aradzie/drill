import { applyCommand, type CommandResult, type ProblemCommand, type ProblemEvent } from "shared";
import type { Db } from "./db.ts";
import { Queue } from "./queue.ts";

export class EventStore {
  readonly #queue: Queue = new Queue();
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async events(): Promise<readonly ProblemEvent[]> {
    return await this.#db.events();
  }

  /** Serialize validation through persistence so concurrent commands see committed history. */
  processCommand(command: ProblemCommand): Promise<CommandResult> {
    return this.#queue.enqueue(() => this.#applyCommand(command));
  }

  async #applyCommand(command: ProblemCommand): Promise<CommandResult> {
    const result = applyCommand(await this.#db.events(), command);
    if (result.outcome === "appended") {
      return { outcome: "appended", event: await this.#db.append(result.event) };
    } else {
      return result;
    }
  }
}
