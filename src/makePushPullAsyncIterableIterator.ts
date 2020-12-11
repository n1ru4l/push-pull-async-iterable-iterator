type Deferred<T> = {
  resolve: (value: T) => void;
  reject: (value: unknown) => void;
  promise: Promise<T>;
};

function createDeferred<T>(): Deferred<T> {
  const d = {} as Deferred<T>;
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
}

export type PushPullAsyncIterableIterator<T> = {
  /* Push a new value that will be published on the AsyncIterableIterator. */
  pushValue: (value: T) => void;
  /* AsyncIterableIterator that publishes the values pushed on the stack with pushValue. */
  asyncIterableIterator: AsyncIterableIterator<T>;
};

/**
 * makePushPullAsyncIterableIterator
 *
 * The iterable will publish values until return or throw is called.
 * Afterwards it is in the completed state and cannot be used for publishing any further values.
 * It will handle back-pressure and keep pushed values until they are consumed by a source.
 */
export function makePushPullAsyncIterableIterator<
  T
>(): PushPullAsyncIterableIterator<T> {
  let isRunning = true;
  const values: Array<T> = [];

  let d = createDeferred<"finished" | "newValue">();

  const asyncIterableIterator = (async function* PushPullAsyncIterableIterator(): AsyncIterableIterator<
    T
  > {
    while (isRunning) {
      if (values.length > 0) {
        yield values.shift()!;
      } else {
        const res = await d.promise;
        if (res === "finished") {
          return;
        }
      }
    }
  })();

  function pushValue(value: T) {
    if (isRunning === false) {
      // TODO: Should this throw?
      return;
    }

    values.push(value);
    d.resolve("newValue");
    d = createDeferred();
  }

  // We monkey patch the original generator for clean-up
  const originalReturn = asyncIterableIterator["return"]?.bind(
    asyncIterableIterator
  );
  asyncIterableIterator["return"] = (
    ...args
  ): Promise<IteratorResult<T, void>> => {
    isRunning = false;
    d.resolve("finished");
    return (
      originalReturn?.(...args) ??
      Promise.resolve({ done: true, value: undefined })
    );
  };
  const originalThrow = asyncIterableIterator["throw"]?.bind(
    asyncIterableIterator
  );
  asyncIterableIterator["throw"] = (
    ...args
  ): Promise<IteratorResult<T, void>> => {
    isRunning = false;
    d.resolve("finished");
    return (
      originalThrow?.(...args) ??
      Promise.resolve({ done: true, value: undefined })
    );
  };

  return {
    pushValue,
    asyncIterableIterator
  };
}
