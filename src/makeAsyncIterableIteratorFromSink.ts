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
  const dispose = make({
    next: (value: TValue) => {
      pushValue(value);
    },
    complete: () => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      asyncIterableIterator.return!();
    },
    error: (err: TError) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      asyncIterableIterator.throw!(err);
    }
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
