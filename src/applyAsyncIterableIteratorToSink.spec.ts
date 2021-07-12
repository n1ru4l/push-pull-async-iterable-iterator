import {
  makePushPullAsyncIterableIterator,
  applyAsyncIterableIteratorToSink
} from ".";
import Observable from "zen-observable";

it("'applyAsyncIterableIteratorToSink' exists", () => {
  expect(applyAsyncIterableIteratorToSink).toBeDefined();
});

it("can be created", done => {
  // In the real-world you would create this iterator inside Observable constructor function.
  const {
    pushValue,
    asyncIterableIterator
  } = makePushPullAsyncIterableIterator();
  const observable = new Observable(sink => {
    const dispose = applyAsyncIterableIteratorToSink(
      asyncIterableIterator,
      sink
    );
    return dispose;
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

  pushValue(1);
  pushValue(2);
  pushValue(3);
  process.nextTick(() => {
    asyncIterableIterator.return?.();
  });
});
