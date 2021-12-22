export function isAsyncIterable(
  input: unknown
): input is
  | AsyncIterator<unknown>
  | AsyncIterableIterator<unknown>
  | AsyncGenerator {
  return (
    typeof input === "object" && input !== null && Symbol.asyncIterator in input
  );
}
