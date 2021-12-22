/**
 * Attaches a cleanup handler to a AsyncIterable.
 *
 * @param source The source that should have a return handler attached
 * @param onReturn The return handler that should be attached
 * @returns
 */
export function withHandlers<TValue, TError = unknown>(
  source: AsyncIterable<TValue>,
  onReturn: () => void,
  onThrow?: (err: TError) => void
): AsyncGenerator<TValue, void, unknown> {
  const stream = (async function* withReturnSource() {
    yield* source;
  })();
  const originalReturn = stream.return.bind(stream);

  stream.return = (...args) => {
    onReturn();
    return originalReturn(...args);
  };

  if (onThrow) {
    const originalThrow = stream.throw.bind(stream);
    stream.throw = (err: TError) => {
      onThrow(err);
      return originalThrow(err);
    };
  }

  return stream;
}
