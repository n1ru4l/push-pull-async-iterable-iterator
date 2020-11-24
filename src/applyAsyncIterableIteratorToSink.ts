import { Sink } from "./Sink";

export function applyAsyncIterableIteratorToSink<
  TValue = unknown,
  TError = unknown
>(
  asyncIterableIterator: AsyncIterableIterator<TValue>,
  sink: Sink<TValue, TError>
): () => void {
  const run = async () => {
    try {
      for await (const value of asyncIterableIterator) {
        sink.next(value);
      }
      sink.complete();
    } catch (err) {
      sink.error(err);
    }
  };
  run();

  return () => {
    asyncIterableIterator.return?.();
  };
}
