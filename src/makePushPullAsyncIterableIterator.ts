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

const SYMBOL_FINISHED = Symbol();
const SYMBOL_NEW_VALUE = Symbol();

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

  let newValueD = createDeferred<typeof SYMBOL_NEW_VALUE>();
  const finishedD = createDeferred<typeof SYMBOL_FINISHED | unknown>();

  const asyncIterableIterator = (async function* PushPullAsyncIterableIterator(): AsyncIterableIterator<
    T
  > {
    while (true) {
      if (values.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        yield values.shift()!;
      } else {
        const result = await Promise.race([
          newValueD.promise,
          finishedD.promise
        ]);

        if (result === SYMBOL_FINISHED) {
          break;
        }
        if (result !== SYMBOL_NEW_VALUE) {
          throw result;
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
    newValueD.resolve(SYMBOL_NEW_VALUE);
    newValueD = createDeferred();
  }

  // We monkey patch the original generator for clean-up
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalReturn = asyncIterableIterator.return!.bind(
    asyncIterableIterator
  );

  asyncIterableIterator.return = (
    ...args
  ): Promise<IteratorResult<T, void>> => {
    isRunning = false;
    finishedD.resolve(SYMBOL_FINISHED);
    return originalReturn(...args);
  };

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const originalThrow = asyncIterableIterator.throw!.bind(
    asyncIterableIterator
  );
  asyncIterableIterator.throw = (err): Promise<IteratorResult<T, void>> => {
    isRunning = false;
    finishedD.resolve(err);
    return originalThrow(err);
  };

  return {
    pushValue,
    asyncIterableIterator
  };
}
