import Observable = require("zen-observable");
import {
  PushPullAsyncIterableIterator,
  applyAsyncIterableIteratorToSink
} from "../dist";

it("'applyAsyncIterableIteratorToSink' exists", () => {
  expect(applyAsyncIterableIteratorToSink).toBeDefined();
});

it("can be created", done => {
  // In the real-world you would create this iterator inside Observable constructor function.
  const iterator = new PushPullAsyncIterableIterator();
  const observable = new Observable(sink => {
    applyAsyncIterableIteratorToSink(iterator, sink);
    return () => iterator.return?.();
  });

  const values = [] as unknown[];

  observable.subscribe({
    next: value => {
      values.push(value);
    },
    error: err => {
      fail("Should not fail. " + err);
    },
    complete: () => {
      expect(values).toEqual([1, 2, 3]);
      done();
    }
  });

  iterator.push(1);
  iterator.push(2);
  iterator.push(3);
  process.nextTick(() => {
    iterator.return?.();
  });
});
