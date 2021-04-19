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
  let dispose = make({
    next: (value: TValue) => {
      pushValue(value);
    },
    complete: () => {
      asyncIterableIterator.return!();
    },
    error: (err: TError) => {
      asyncIterableIterator.throw!(err);
    }
  });
  const originalReturn = asyncIterableIterator.return!;
  let returnValue: ReturnType<typeof originalReturn> | undefined = undefined;
  asyncIterableIterator.return = () => {
    if (returnValue === undefined) {
      dispose();
      returnValue = originalReturn();
    }
    return returnValue;
  };
  return asyncIterableIterator;
};
