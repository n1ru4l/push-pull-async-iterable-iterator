import { PushPullAsyncIterableIterator } from "..";

it(`"PushPullAsyncIterableIterator" exists`, () => {
  expect(PushPullAsyncIterableIterator).toBeDefined();
});

it("can be created", () => {
  new PushPullAsyncIterableIterator();
});

it("can publish some values", async () => {
  const iterator = new PushPullAsyncIterableIterator();
  iterator.push(1);
  iterator.push(2);
  iterator.push(3);

  let next = await iterator.next();
  expect(next.value).toEqual(1);
  next = await iterator.next();
  expect(next.value).toEqual(2);
  next = await iterator.next();
  expect(next.value).toEqual(3);
});

it("can publish a value for a waiting handler", async () => {
  const iterator = new PushPullAsyncIterableIterator();
  const nextP = iterator.next();
  iterator.push(1);
  const next = await nextP;
  expect(next.value).toEqual(1);
});
