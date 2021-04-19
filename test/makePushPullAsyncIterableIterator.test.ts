import { makePushPullAsyncIterableIterator } from "../dist";

it(`"PushPullAsyncIterableIterator" exists`, () => {
  expect(makePushPullAsyncIterableIterator).toBeDefined();
});

it("can be created", () => {
  makePushPullAsyncIterableIterator();
});

it("can publish some values", async () => {
  const {
    pushValue,
    asyncIterableIterator
  } = makePushPullAsyncIterableIterator();
  pushValue(1);
  pushValue(2);
  pushValue(3);

  let next = await asyncIterableIterator.next();
  expect(next.value).toEqual(1);
  next = await asyncIterableIterator.next();
  expect(next.value).toEqual(2);
  next = await asyncIterableIterator.next();
  expect(next.value).toEqual(3);
});

it("can publish a value for a waiting handler", async () => {
  const {
    pushValue,
    asyncIterableIterator
  } = makePushPullAsyncIterableIterator();
  const nextP = asyncIterableIterator.next();
  pushValue(1);
  const next = await nextP;
  expect(next.value).toEqual(1);
});

it("can throw errors", async () => {
  const { asyncIterableIterator } = makePushPullAsyncIterableIterator();
  const nextP = asyncIterableIterator.next();
  asyncIterableIterator.throw!(new Error("Something got thrown."));
  try {
    await nextP;
    fail("should throw");
  } catch (err) {
    expect(err.message).toEqual("Something got thrown.");
  }
});
