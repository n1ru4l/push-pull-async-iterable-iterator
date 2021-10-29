---
"@n1ru4l/push-pull-async-iterable-iterator": minor
---

Change usage of type `AsyncIterableIterator` to `AsyncGenerator`.

This library and other libraries such as graphql-js typed what should be `AsyncGenerator` as `AsyncIterableIterator`.

The main difference between those two types is that on the former the `return` method is not optional. This resulted in confusion when using TypeScript as the `return` method is actually always present.

Here are the TypeScript type definitions for comparison.

```ts
interface AsyncGenerator<T = unknown, TReturn = any, TNext = unknown>
  extends AsyncIterator<T, TReturn, TNext> {
  // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
  next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
  return(
    value: TReturn | PromiseLike<TReturn>
  ): Promise<IteratorResult<T, TReturn>>;
  throw(e: any): Promise<IteratorResult<T, TReturn>>;
  [Symbol.asyncIterator](): AsyncGenerator<T, TReturn, TNext>;
}
```

```ts
interface AsyncIterator<T, TReturn = any, TNext = undefined> {
  // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
  next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
  return?(
    value?: TReturn | PromiseLike<TReturn>
  ): Promise<IteratorResult<T, TReturn>>;
  throw?(e?: any): Promise<IteratorResult<T, TReturn>>;
}

interface AsyncIterableIterator<T> extends AsyncIterator<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
```

Unfortunately, the name of this library is now a bit misleading. `@n1ru4l/push-pull-async-generator` might be the be the better pick. For now I will not deprecate and rename it.
