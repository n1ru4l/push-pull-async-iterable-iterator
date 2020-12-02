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

/**
 * makePushPullAsyncIterableIterator
 *
 * The iterable will publish values until return ot throw is called.
 * Afterwards it is in the completed state and cannot be used for publishing any further values.
 * It will handle back-pressure and keep pushed values until they are consumed by a source.
 */

export function makePushPullAsyncIterableIterator<T>() {
  let isRunning = true;
  const pushQueue: Array<T> = [];

  let d = createDeferred<"FINISH" | "NEW_VALUE">();

  const iterator = (async function* PushPullAsyncIterableIterator(): AsyncIterableIterator<
    T
  > {
    while (isRunning) {
      if (pushQueue.length > 0) {
        yield pushQueue.shift()!;
      } else {
        const res = await d.promise;
        if (res === "FINISH") {
          return;
        }
      }
    }
  })();

  function push(value: T) {
    if (isRunning === false) {
      // TODO: Should this throw?
      return;
    }

    pushQueue.push(value);
    d.resolve("NEW_VALUE");
    d = createDeferred();
  }

  const oReturn = iterator["return"]?.bind(iterator);
  iterator["return"] = (...args) => {
    isRunning = false;
    d.resolve("FINISH");
    return (
      oReturn?.(...args) ?? Promise.resolve({ done: true, value: undefined })
    );
  };
  const oThrow = iterator["throw"]?.bind(iterator);
  iterator["throw"] = (...args) => {
    isRunning = false;
    d.resolve("FINISH");
    return (
      oThrow?.(...args) ?? Promise.resolve({ done: true, value: undefined })
    );
  };

  return [push, iterator] as const;
}
