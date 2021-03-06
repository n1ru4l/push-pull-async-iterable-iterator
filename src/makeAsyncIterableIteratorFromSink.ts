import { makePushPullAsyncIterableIterator } from "./makePushPullAsyncIterableIterator";
import { Sink } from "./Sink";

export const makeAsyncIterableIteratorFromSink = <
  TValue = unknown,
  TError = unknown
>(
  make: (sink: Sink<TValue, TError>) => () => void
): AsyncIterableIterator<TValue> => {
  const {
    pushValue,
    asyncIterableIterator
  } = makePushPullAsyncIterableIterator<TValue>();
  let dispose: () => void = () => undefined;

  const sink: Sink<TValue, TError> = {
    next: (value: TValue) => {
      pushValue(value);
    },
    complete: () => {
      asyncIterableIterator.return?.();
    },
    error: (err: TError) => {
      asyncIterableIterator.throw?.(err);
    }
  };

  dispose = make(sink);
  const originalReturn = asyncIterableIterator?.return;
  asyncIterableIterator.return = () => {
    dispose();
    return originalReturn?.() ?? Promise.resolve({ done: true, value: undefined })
  }
  return asyncIterableIterator
};
