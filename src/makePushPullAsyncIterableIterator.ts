type Deferred<T = void> = {
  resolve: (value: T) => void;
  reject: (value: unknown) => void;
  promise: Promise<T>;
};

function createDeferred<T = void>(): Deferred<T> {
  const d = {} as Deferred<T>;
  d.promise = new Promise<T>((resolve, reject) => {
    d.resolve = resolve;
    d.reject = reject;
  });
  return d;
}

type PushPullAsyncGenerator<T> = AsyncGenerator<T, void> & {
  push(value: T): void;
};

export type PushPullAsyncIterableIterator<T> = {
  /* Push a new value that will be published on the AsyncIterableIterator. */
  pushValue: (value: T) => void;
  /* AsyncIterableIterator that publishes the values pushed on the stack with pushValue. */
  asyncIterableIterator: PushPullAsyncGenerator<T>;
};

const enum StateType {
  running = "running",
  error = "error",
  finished = "finished"
}

type RunningState = {
  type: StateType.running;
};

type ErrorState = {
  type: StateType.error;
  error: unknown;
};

type FinishedState = {
  type: StateType.finished;
};

type State = RunningState | ErrorState | FinishedState;

const nextTick = globalThis.setImmediate ?? globalThis.setTimeout;

/**
 * makePushPullAsyncIterableIterator
 *
 * The iterable will publish values until return or throw is called.
 * Afterwards it is in the completed state and cannot be used for publishing any further values.
 * It will handle back-pressure and keep pushed values until they are consumed by a source.
 */
export function makePushPullAsyncIterableIterator<T>(): PushPullAsyncGenerator<
  T
> {
  let state = {
    type: StateType.running
  } as State;
  const listeners: Array<Deferred<IteratorResult<T, void>>> = [];
  const values: Array<T> = [];

  let scheduledFlush = false;
  function enqueueFlush() {
    if (scheduledFlush) {
      return;
    }
    scheduledFlush = true;
    nextTick(flush);
  }

  function flush() {
    scheduledFlush = false;
    // first we flush all pending values and listeners
    while (values.length > 0 && listeners.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const value = values.shift()!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const waiter = listeners.shift()!;
      waiter.resolve({ done: false, value: value });
    }

    // flush pending listener in error and finished state
    if (listeners.length > 0) {
      let waiter: Deferred<IteratorResult<T, void>>;
      if (state.type === StateType.error) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        while ((waiter = listeners.shift()!)) {
          waiter.reject(state.error);
        }
      }
      if (state.type === StateType.finished) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        while ((waiter = listeners.shift()!)) {
          waiter.resolve({ done: true, value: undefined });
        }
      }
    }
  }

  const source: PushPullAsyncGenerator<T> = {
    [Symbol.asyncIterator]: () => source,
    next() {
      if (values.length === 0) {
        if (state.type === StateType.error) {
          return Promise.reject(state.error);
        }
        if (state.type === StateType.finished) {
          return Promise.resolve({ done: true, value: undefined });
        }
      }

      const d = createDeferred<IteratorResult<T, void>>();
      listeners.push(d);
      enqueueFlush();
      return d.promise;
    },
    return() {
      if (state.type === StateType.running) {
        state = {
          type: StateType.finished
        };
        enqueueFlush();
      }
      return Promise.resolve({ done: true, value: undefined });
    },
    throw(error) {
      if (state.type === StateType.running) {
        state = {
          type: StateType.error,
          error
        };
        enqueueFlush();
      }
      return Promise.resolve({ done: true, value: undefined });
    },
    push(value: T) {
      if (state.type === StateType.running) {
        values.push(value);
        enqueueFlush();
      }
    }
  };

  return source;
}
