const NO_ERROR_SYMBOL = Symbol("NO_ERROR_SYMBOL");

/**
 * PushPullAsyncIterableIterator
 *
 * The iterable will publish values until return ot throw is called.
 * Afterwards it is in the completed state and cannot be used for publishing any further values.
 * It will handle back-pressure and keep pushed values until they are consumed by a source.
 */
export class PushPullAsyncIterableIterator<T>
  implements AsyncIterableIterator<T> {
  private pushQueue: T[] = [];
  private pullQueue: [
    (value: IteratorResult<T>) => void,
    (value: unknown) => void
  ][] = [];
  private isRunning: boolean = true;
  private errorValue: unknown = NO_ERROR_SYMBOL;

  /**
   * Consume the next available value published on the iterable.
   * It will resolve with a value immediately (if any is present in the queue).
   * Otherwise, if no value is present, the subscriber will receive the next value once it is available.
   */
  public async next(): Promise<IteratorResult<T>> {
    return new Promise((resolve, reject) => {
      if (this.pushQueue.length !== 0 || this.isRunning === false) {
        if (this.errorValue !== NO_ERROR_SYMBOL) {
          this._handleError(reject);
          return;
        }

        resolve(
          this.isRunning
            ? { value: this.pushQueue.shift()!, done: false }
            : { value: undefined, done: true }
        );
      } else {
        this.pullQueue.push([resolve, reject]);
      }
    });
  }

  /**
   * Complete a iterable. All pending consumer will receive a complete IteratorResult.
   * The iterable cannot be used to publish any more values after completing it.
   */
  public async return(): Promise<IteratorResult<T>> {
    if (this.isRunning) {
      this.isRunning = false;
      for (const [resolve] of this.pullQueue) {
        resolve({ value: undefined, done: true });
      }
      this.pullQueue.length = 0;
      this.pushQueue.length = 0;
    }
    return { value: undefined, done: true };
  }

  /**
   * Throw a value and complete the iterable. After calling throw the next consumer will receive the error.
   * All further consumers will receive a complete IteratorResult.
   */
  public throw(value: unknown): Promise<IteratorResult<T>> {
    if (this.isRunning) {
      this.errorValue = value;
    }

    return Promise.resolve({
      done: true,
      value: undefined
    });
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  private _handleError(reject: (err: unknown) => void) {
    reject(this.errorValue);
    this.isRunning = false;
    this.pullQueue.length = 0;
    this.pushQueue.length = 0;
    this.errorValue = NO_ERROR_SYMBOL;
  }

  /**
   * Push new values into the iterator. If any consumers are present it will be forwarded to the consumers.
   * Otherwise, the value will be saved until it is consumed.
   */
  public push(value: T) {
    if (this.isRunning === false) {
      // TODO: Should this throw?
      return;
    }

    if (this.pullQueue.length > 0) {
      const [resolve, reject] = this.pullQueue.shift()!;
      if (this.errorValue !== NO_ERROR_SYMBOL) {
        this._handleError(reject);
        return;
      }
      resolve(
        this.isRunning
          ? { value, done: false }
          : { value: undefined, done: true }
      );
    } else {
      this.pushQueue.push(value);
    }
  }
}
