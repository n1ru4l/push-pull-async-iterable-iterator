import { withHandlers } from "./withHandlers";

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

export type PushPullAsyncIterableIterator<T> = {
  /* Push a new value that will be published on the AsyncIterableIterator. */
  pushValue: (value: T) => void;
  /* AsyncIterableIterator that publishes the values pushed on the stack with pushValue. */
  asyncIterableIterator: AsyncGenerator<T, void>;
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
  let state = {
    type: StateType.running
  } as State;
  let next = createDeferred();
  const values: Array<T> = [];

  function pushValue(value: T) {
    if (state.type !== StateType.running) {
      return;
    }

    values.push(value);
    next.resolve();
    next = createDeferred();
  }

  const source = (async function* PushPullAsyncIterableIterator(): AsyncGenerator<
    T,
    void
  > {
    while (true) {
      if (values.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        yield values.shift()!;
      } else {
        if (state.type === StateType.error) {
          throw state.error;
        }
        if (state.type === StateType.finished) {
          return;
        }
        await next.promise;
      }
    }
  })();

  const stream = withHandlers(
    source,
    () => {
      if (state.type !== StateType.running) {
        return;
      }
      state = {
        type: StateType.finished
      };
      next.resolve();
    },
    (error: unknown) => {
      if (state.type !== StateType.running) {
        return;
      }
      state = {
        type: StateType.error,
        error
      };
      next.resolve();
    }
  );

  return {
    pushValue,
    asyncIterableIterator: stream
  };
}
