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
  const source = makePushPullAsyncIterableIterator();
  const observable = new Observable(sink => {
    const dispose = applyAsyncIterableIteratorToSink(source, sink);
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

  source.push(1);
  source.push(2);
  source.push(3);
  source.return();
});
