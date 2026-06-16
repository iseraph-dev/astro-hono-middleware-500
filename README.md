# astro-hono-middleware-500

Minimal reproduction: on the composable `astro/hono` path, an error thrown by
`src/middleware.ts` is not rendered as the custom `500.astro`. It escapes to the host
framework (Hono), which answers with its default plain-text `Internal Server Error`.

This is the middleware counterpart of [withastro/astro#16952][16952] (render-time errors
in `pages()`), which was fixed in [#17041][17041]. That PR called this middleware case out
as out of scope.

[16952]: https://github.com/withastro/astro/issues/16952
[17041]: https://github.com/withastro/astro/pull/17041

## Routes

- `/` - returns 200.
- `/page-throws` - throws during page render. With #17041 this correctly renders the
  custom `500.astro`, which confirms the fix is present.
- `/boom` - throws inside `src/middleware.ts`. This still returns Hono's plain-text
  `Internal Server Error` instead of the custom `500.astro` (the bug).

## Run

```bash
npm install
npm run build
npm start            # node ./dist/server/entry.mjs, listens on http://localhost:4321
```

Then:

```bash
curl -i http://localhost:4321/             # 200
curl -i http://localhost:4321/page-throws  # 500, custom 500.astro  (fixed by #17041)
curl -i http://localhost:4321/boom         # 500, Hono "Internal Server Error"  (the bug)
```

## Contrast with the all-in-one handler

Swapping `src/fetch.ts` to the all-in-one `astro()` handler makes the same middleware
throw render the custom `500.astro`:

```ts
import { Hono } from 'hono';
import { astro } from 'astro/hono';

const app = new Hono();
app.use(astro());
export default app;
```

So middleware errors can be handled; the gap is specific to composing `middleware()`
separately.

## Version note

The middleware case (`/boom`) reproduces on any current version, including the public
`astro@7.0.0-beta.4`: a throw in `src/middleware.ts` on the composable path always escapes
to Hono.

#17041 only changed the `pages()` path, so to *also* see that page render errors are now
handled (`/page-throws` serving `500.astro`) while middleware errors still are not, use a
build that includes #17041: `main`, or the first beta published after `7.0.0-beta.4`. On
`7.0.0-beta.4` both routes hit Hono's default 500.
