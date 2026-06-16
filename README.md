# astro-hono-middleware-500

Reproduction for [withastro/astro#17092](https://github.com/withastro/astro/issues/17092).

On the composable `astro/hono` path (`app.use(middleware())` + `app.use(pages())`), errors from
the Astro middleware layer are not turned into the custom error pages. They escape to the host
framework (Hono), which answers with its default plain-text `Internal Server Error`. Two related
gaps:

1. A throw in `src/middleware.ts` should render the custom `500.astro`, but escapes to Hono.
2. An unmatched request, when the custom `404.astro` is prerendered (or absent), should render the
   `404.astro`. Instead the middleware layer throws on the missing route and escapes to Hono.

This is the middleware counterpart of [withastro/astro#16952][16952] (render-time errors in
`pages()`), which was fixed in [#17041][17041]. That PR fixed the `pages()` side and called the
middleware case out as out of scope. The all-in-one `astro()` handler renders both error pages
correctly, so the gap is specific to composing `middleware()` separately.

[16952]: https://github.com/withastro/astro/issues/16952
[17041]: https://github.com/withastro/astro/pull/17041

## Routes

- `/` - returns 200.
- `/page-throws` - throws during page render. With #17041 this renders the custom `500.astro`,
  which confirms the `pages()` fix is present.
- `/boom` - a real page, but `src/middleware.ts` throws before it renders. Should render
  `500.astro`; instead returns Hono's plain-text `Internal Server Error` (gap 1).
- `/does-not-exist` - an unmatched route. `src/pages/404.astro` is prerendered, so the request has
  no `routeData` and the middleware layer throws on the missing route. Should render the custom
  `404.astro`; instead returns Hono's plain-text `Internal Server Error` (gap 2).

## Run

```bash
npm install
npm run build
npm start            # node ./dist/server/entry.mjs, listens on http://localhost:4321
```

Then:

```bash
curl -i http://localhost:4321/                # 200
curl -i http://localhost:4321/page-throws     # 500, custom 500.astro  (fixed by #17041)
curl -i http://localhost:4321/boom            # 500, Hono "Internal Server Error"  (gap 1)
curl -i http://localhost:4321/does-not-exist  # 500, Hono "Internal Server Error"  (gap 2)
```

## Contrast with the all-in-one handler

Swapping `src/fetch.ts` to the all-in-one `astro()` handler renders both custom error pages for the
same requests (`/boom` -> `500.astro`, `/does-not-exist` -> `404.astro`):

```ts
import { Hono } from 'hono';
import { astro } from 'astro/hono';

const app = new Hono();
app.use(astro());
export default app;
```

So middleware errors and unmatched routes can be handled; the gap is specific to composing
`middleware()` separately.

## Version note

Both middleware gaps (`/boom`, `/does-not-exist`) reproduce on any current version, including the
public `astro@7.0.0-beta.4`: the composable `middleware()` path has no error handling, so the
errors escape to Hono.

#17041 only changed the `pages()` path, so to also see that page render errors are now handled
(`/page-throws` serving `500.astro`) while the middleware gaps remain, use a build that includes
#17041: `main`, or the first beta published after `7.0.0-beta.4`. On `7.0.0-beta.4` all three error
routes hit Hono's default 500.
