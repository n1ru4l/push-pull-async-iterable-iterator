# `@n1ru4l/push-pull-async-iterable-iterator`

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm version](https://img.shields.io/npm/v/@n1ru4l/push-pull-async-iterable-iterator)](https://www.npmjs.com/package/@n1ru4l/push-pull-async-iterable-iterator)
[![npm downloads](https://img.shields.io/npm/dm/@n1ru4l/push-pull-async-iterable-iterator)](https://www.npmjs.com/package/@n1ru4l/push-pull-async-iterable-iterator)
[![Dependents](https://img.shields.io/librariesio/dependents/npm/@n1ru4l/push-pull-async-iterable-iterator)](https://www.npmjs.com/browse/depended/@n1ru4l/push-pull-async-iterable-iterator)
[![Build Status](https://img.shields.io/github/workflow/status/n1ru4l/push-pull-async-iterable-iterator/CI)](https://github.com/n1ru4l/push-pull-async-iterable-iterator/actions)

Create an AsyncIterableIterator from anything (on any modern platform) while handling back-pressure!

```bash
yarn install -E @n1ru4l/push-pull-async-iterable-iterator
```

**Standalone Usage**

```ts
import { makePushPullAsyncIterableIterator } from "@n1ru4l/push-pull-async-iterable-iterator";

const {
  pushValue,
  asyncIterableIterator
} = makePushPullAsyncIterableIterator();
pushValue(1);
pushValue(2);
pushValue(3);

// prints 1, 2, 3
for await (const value of asyncIterableIterator) {
  console.log(value);
}
```

**Check if something is an AsyncIterable**

```ts
import { isAsyncIterable } from "@n1ru4l/push-pull-async-iterable-iterator";

if (isAsyncIterable(something)) {
  for await (const value of something) {
    console.log(value);
  }
}
```

_Note:_ On Safari iOS [`Symbol.asyncIterator` is not available](https://caniuse.com/mdn-javascript_builtins_symbol_asynciterator), therefore all async iterators used must be build using [AsyncGenerators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of#Iterating_over_async_generators).
If a AsyncIterable that is NO AsyncGenerator is passed to `isAsyncIterable` on the Safari iOS environment, it will throw an error.

**Wrap a Sink**

```ts
import { makeAsyncIterableIteratorFromSink } from "@n1ru4l/push-pull-async-iterable-iterator";
// let's use some GraphQL client :)
import { createClient } from "graphql-ws/lib/use/ws";

const client = createClient({
  url: "ws://localhost:3000/graphql"
});

const asyncIterableIterator = makeAsyncIterableIteratorFromSink(sink => {
  const dispose = client.subscribe(
    {
      query: "{ hello }"
    },
    {
      next: sink.next,
      error: sink.error,
      complete: sink.complete
    }
  );
  return () => dispose();
});

for await (const value of asyncIterableIterator) {
  console.log(value);
}
```

**Apply an AsyncIterableIterator to a sink**

```tsx
import Observable from "zen-observable";
import {
  makePushPullAsyncIterableIterator,
  applyAsyncIterableIteratorToSink
} from "@n1ru4l/push-pull-async-iterable-iterator";

const { asyncIterableIterator } = makePushPullAsyncIterableIterator();

const observable = new Observable(sink => {
  const dispose = applyAsyncIterableIteratorToSink(asyncIterableIterator, sink);
  // dispose will be called when the observable subscription got destroyed
  // the dispose call will ensure that the async iterator is completed.
  return () => dispose();
});

const subscription = observable.subscribe({
  next: console.log,
  complete: () => console.log("done."),
  error: () => console.log("error.")
});

const interval = setInterval(() => {
  iterator.push("hi");
}, 1000);

setTimeout(() => {
  subscription.unsubscribe();
  clearInterval(interval);
}, 5000);
```

**Put it all together**

```tsx
import { Observable, RequestParameters, Variables } from "relay-runtime";
import { createClient } from "graphql-ws/lib/use/ws";
import {
  makeAsyncIterableFromSink,
  applyAsyncIterableIteratorToSink
} from "@n1ru4l/push-pull-async-iterable-iterator";
import { createApplyLiveQueryPatch } from "@n1ru4l/graphql-live-query-patch";

const client = createClient({
  url: "ws://localhost:3000/graphql"
});

export const execute = (request: RequestParameters, variables: Variables) => {
  if (!request.text) {
    throw new Error("Missing document.");
  }
  const query = request.text;

  return Observable.create<GraphQLResponse>(sink => {
    // Create our asyncIterator from a Sink
    const executionResultIterator = makeAsyncIterableFromSink(wsSink => {
      const dispose = client.subscribe({ query }, wsSink);
      return () => dispose();
    });

    const applyLiveQueryPatch = createApplyLiveQueryPatch();

    // apply some middleware to our asyncIterator
    const compositeIterator = applyLiveQueryPatch(executionResultIterator);

    // Apply our async iterable to the relay sink
    // unfortunately relay cannot consume an async iterable right now.
    const dispose = applyAsyncIterableIteratorToSink(compositeIterator, sink);
    // dispose will be called by relay when the observable is disposed
    // the dispose call will ensure that the async iterator is completed.
    return () => dispose();
  });
};
```

---

## TSDX User Guide

Congrats! You just saved yourself hours of work by bootstrapping this project with TSDX. Let’s get you oriented with what’s here and how to use it.

> This TSDX setup is meant for developing libraries (not apps!) that can be published to NPM. If you’re looking to build a Node app, you could use `ts-node-dev`, plain `ts-node`, or simple `tsc`.

> If you’re new to TypeScript, checkout [this handy cheatsheet](https://devhints.io/typescript)

### Commands

TSDX scaffolds your new library inside `/src`.

To run TSDX, use:

```bash
npm start # or yarn start
```

This builds to `/dist` and runs the project in watch mode so any edits you save inside `src` causes a rebuild to `/dist`.

To do a one-off build, use `npm run build` or `yarn build`.

To run tests, use `npm test` or `yarn test`.

### Configuration

Code quality is set up for you with `prettier`, `husky`, and `lint-staged`. Adjust the respective fields in `package.json` accordingly.

#### Jest

Jest tests are set up to run with `npm test` or `yarn test`.

#### Bundle Analysis

[`size-limit`](https://github.com/ai/size-limit) is set up to calculate the real cost of your library with `npm run size` and visualize the bundle with `npm run analyze`.

##### Setup Files

This is the folder structure we set up for you:

```txt
/src
  index.tsx       # EDIT THIS
/test
  blah.test.tsx   # EDIT THIS
.gitignore
package.json
README.md         # EDIT THIS
tsconfig.json
```

#### Rollup

TSDX uses [Rollup](https://rollupjs.org) as a bundler and generates multiple rollup configs for various module formats and build settings. See [Optimizations](#optimizations) for details.

#### TypeScript

`tsconfig.json` is set up to interpret `dom` and `esnext` types, as well as `react` for `jsx`. Adjust according to your needs.

### Continuous Integration

#### GitHub Actions

Two actions are added by default:

- `main` which installs deps w/ cache, lints, tests, and builds on all pushes against a Node and OS matrix
- `size` which comments cost comparison of your library on every pull request using [`size-limit`](https://github.com/ai/size-limit)

### Optimizations

Please see the main `tsdx` [optimizations docs](https://github.com/palmerhq/tsdx#optimizations). In particular, know that you can take advantage of development-only optimizations:

```js
// ./types/index.d.ts
declare var __DEV__: boolean;

// inside your code...
if (__DEV__) {
  console.log("foo");
}
```

You can also choose to install and use [invariant](https://github.com/palmerhq/tsdx#invariant) and [warning](https://github.com/palmerhq/tsdx#warning) functions.

### Module Formats

CJS, ESModules, and UMD module formats are supported.

The appropriate paths are configured in `package.json` and `dist/index.js` accordingly. Please report if any issues are found.

### Named Exports

Per Palmer Group guidelines, [always use named exports.](https://github.com/palmerhq/typescript#exports) Code split inside your React app instead of your React library.

### Including Styles

There are many ways to ship styles, including with CSS-in-JS. TSDX has no opinion on this, configure how you like.

For vanilla CSS, you can include it at the root directory and add it to the `files` section in your `package.json`, so that it can be imported separately by your users and run through their bundler's loader.

### Publishing to NPM

We recommend using [np](https://github.com/sindresorhus/np).
