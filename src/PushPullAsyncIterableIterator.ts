export class PushPullAsyncIterableIterator<T>
  implements AsyncIterableIterator<T> {
  private pushQueue: T[] = [];
  private pullQueue: [
    (value: IteratorResult<T>) => void,
    (value: unknown) => void
  ][] = [];
  private isRunning: boolean = true;
  private errorValue: unknown;

  public async next(): Promise<IteratorResult<T>> {
    return new Promise((resolve, reject) => {
      if (this.pushQueue.length !== 0) {
        if (this.errorValue) {
          reject(this.errorValue);
          this.isRunning = false;
          this.pullQueue.length = 0;
          this.pushQueue.length = 0;
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

  public [Symbol.asyncIterator]() {
    return this;
  }

  public push(value: T) {
    if (this.pullQueue.length > 0) {
      const [resolve, reject] = this.pullQueue.shift()!;
      if (this.errorValue) {
        reject(this.errorValue);
        this.isRunning = false;
        this.pullQueue.length = 0;
        this.pushQueue.length = 0;
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

  public throw(value: unknown): Promise<IteratorResult<T>> {
    this.errorValue = value;
    return Promise.resolve({
      done: true,
      value: undefined,
    });
  }
}
