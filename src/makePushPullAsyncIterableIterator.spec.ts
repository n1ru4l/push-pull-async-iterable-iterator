import { makePushPullAsyncIterableIterator } from "./makePushPullAsyncIterableIterator";

it(`"PushPullAsyncIterableIterator" exists`, () => {
  expect(makePushPullAsyncIterableIterator).toBeDefined();
});

it("can be created", () => {
  makePushPullAsyncIterableIterator();
});

it("can publish some values", async () => {
  const source = makePushPullAsyncIterableIterator();
  source.push(1);
  source.push(2);
  source.push(3);

  let next = await source.next();
  expect(next.value).toEqual(1);
  next = await source.next();
  expect(next.value).toEqual(2);
  next = await source.next();
  expect(next.value).toEqual(3);
});

it("can publish a value for a waiting handler", async () => {
  const source = makePushPullAsyncIterableIterator();
  const nextP = source.next();
  source.push(1);
  const next = await nextP;
  expect(next.value).toEqual(1);
});

it("rejects errors", async () => {
  const source = makePushPullAsyncIterableIterator();
  const nextP = source.next();
  source.throw(new Error("Something got thrown.")).catch(() => undefined);
  try {
    await nextP;
    fail("should throw");
  } catch (err) {
    expect((err as Error).message).toEqual("Something got thrown.");
  }
});

it("publishes remaining values in buffer before rejecting remaining subscribers", async () => {
  const source = makePushPullAsyncIterableIterator();
  source.push("a");
  source.push("b");
  source.throw(new Error("Noop."));
  const value1 = await source.next();
  expect(value1.value).toEqual("a");
  const value2 = await source.next();
  expect(value2.value).toEqual("b");
  try {
    await source.next();
    fail("should throw");
  } catch (err) {
    expect(err).toMatchInlineSnapshot(`[Error: Noop.]`);
  }
});

it("rejects error for every new subscriber", async () => {
  const source = makePushPullAsyncIterableIterator();
  source.throw(new Error("Something got thrown."));

  let error1: unknown;
  let error2: unknown;
  try {
    await source.next();
    fail("should throw");
  } catch (err) {
    error1 = err;
  }
  try {
    await source.next();
    fail("should throw");
  } catch (err) {
    error2 = err;
  }
  expect(error1).toBe(error2);
  expect(error1).toMatchInlineSnapshot(`[Error: Something got thrown.]`);
});
