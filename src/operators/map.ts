/**
 * Map the events published by an AsyncIterable.
 */
export const map = <T, O>(map: (input: T) => Promise<O> | O) =>
  async function* mapGenerator(
    asyncIterable: AsyncIterable<T>
  ): AsyncGenerator<O, void, unknown> {
    for await (const value of asyncIterable) {
      yield map(value);
    }
  };
