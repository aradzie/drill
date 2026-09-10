/** Runs operations in order, allowing later operations to run after a failure. */
export class Queue {
  #pending: Promise<void> = Promise.resolve();

  enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#pending.then(operation);
    this.#pending = result.then(
      () => {},
      () => {},
    );
    return result;
  }
}
