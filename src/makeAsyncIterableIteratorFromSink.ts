import { withHandlers } from "./withHandlers";
import { makePushPullAsyncIterableIterator } from "./makePushPullAsyncIterableIterator";
import { Sink } from "./Sink";

export const makeAsyncIterableIteratorFromSink = <
  TValue = unknown,
  TError = unknown
>(
  make: (sink: Sink<TValue, TError>) => () => void
): AsyncIterableIterator<TValue> => {
  const source = makePushPullAsyncIterableIterator<TValue>();
  const dispose = make({
    next(value: TValue) {
      source.push(value);
    },
    complete() {
      source.return();
    },
    error(err: TError) {
      source.throw(err);
    }
  });

  return withHandlers(source, () => {
    dispose();
  });
};
