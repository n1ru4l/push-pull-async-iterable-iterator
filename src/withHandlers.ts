/**
 * Attaches a cleanup handler to a AsyncIterable.
 *
 * @param source The source that should have a return handler attached
 * @param onReturn The return handler that should be attached
 * @returns
 */
export function withHandlers<TValue, TError = unknown>(
  source: AsyncIterable<TValue>,
  onReturn?: () => void,
  onThrow?: (err: TError) => void
): AsyncGenerator<TValue, void, unknown> {
  const asyncIterator = source[Symbol.asyncIterator]();
  const stream: AsyncGenerator<TValue, void, unknown> = {
    [Symbol.asyncIterator]() {
      return stream;
    },
    next: asyncIterator.next.bind(asyncIterator),
    return(...args) {
      onReturn?.();
      return (
        asyncIterator.return?.(...args) ??
        Promise.resolve({ done: true, value: undefined })
      );
    },
    throw(err) {
      onThrow?.(err);
      return (
        asyncIterator.throw?.(err) ??
        Promise.resolve({ done: true, value: undefined })
      );
    }
  };

  return stream;
}
