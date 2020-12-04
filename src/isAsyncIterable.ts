export function isAsyncIterable(
  input: unknown
): input is AsyncIterator<unknown> | AsyncIterableIterator<unknown> {
  return (
    typeof input === "object" &&
    input !== null &&
    // The AsyncGenerator check is for Safari on iOS which currently does not have
    // Symbol.asyncIterator implemented
    // That means every custom AsyncIterable must be built using a AsyncGeneratorFunction (async function * () {})
    ((input as any)[Symbol.toStringTag] === "AsyncGenerator" ||
      (Symbol.asyncIterator && Symbol.asyncIterator in input))
  );
}
