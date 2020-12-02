import { makePushPullAsyncIterableIterator } from "../dist";

it(`"PushPullAsyncIterableIterator" exists`, () => {
  expect(makePushPullAsyncIterableIterator).toBeDefined();
});

it("can be created", () => {
  makePushPullAsyncIterableIterator();
});

it("can publish some values", async () => {
  const [push, iterator] = makePushPullAsyncIterableIterator();
  push(1);
  push(2);
  push(3);

  let next = await iterator.next();
  expect(next.value).toEqual(1);
  next = await iterator.next();
  expect(next.value).toEqual(2);
  next = await iterator.next();
  expect(next.value).toEqual(3);
});

it("can publish a value for a waiting handler", async () => {
  const [push, iterator] = makePushPullAsyncIterableIterator();
  const nextP = iterator.next();
  push(1);
  const next = await nextP;
  expect(next.value).toEqual(1);
});
