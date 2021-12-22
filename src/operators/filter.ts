/**
 * Filter the events published by an AsyncIterable.
 */
export function filter<T, U extends T>(
  filter: (input: T) => input is U
): (asyncIterable: AsyncIterable<T>) => AsyncGenerator<U, void, unknown>;
export function filter<T>(
  filter: (input: T) => boolean
): (asyncIterable: AsyncIterable<T>) => AsyncGenerator<T, void, unknown>;
export function filter(filter: (value: unknown) => boolean) {
  return async function* filterGenerator(
    asyncIterable: AsyncIterable<unknown>
  ): AsyncGenerator<unknown, void, unknown> {
    for await (const value of asyncIterable) {
      if (filter(value)) {
        yield value;
      }
    }
  };
}
