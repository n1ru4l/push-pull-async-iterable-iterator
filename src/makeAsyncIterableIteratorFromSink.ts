import { makePushPullAsyncIterableIterator } from "./makePushPullAsyncIterableIterator";
import { Sink } from "./Sink";

export const makeAsyncIterableIteratorFromSink = <
  TValue = unknown,
  TError = unknown
>(
  make: (sink: Sink<TValue, TError>) => () => void
): AsyncIterableIterator<TValue> => {
  const [push, asyncIterator] = makePushPullAsyncIterableIterator<TValue>();
  let dispose: () => void = () => undefined;

  const sink: Sink<TValue, TError> = {
    next: (value: TValue) => {
      push(value);
    },
    complete: () => {
      dispose();
      asyncIterator.return?.();
    },
    error: (err: TError) => {
      asyncIterator.throw?.(err);
    }
  };

  dispose = make(sink);
  return asyncIterator;
};
