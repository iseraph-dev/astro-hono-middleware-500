import { Hono } from 'hono';
import { middleware, pages } from 'astro/hono';

const app = new Hono();

// Composable path: run user middleware (src/middleware.ts), then page rendering.
app.use(middleware());
app.use(pages());

// Contrast: the all-in-one handler DOES render 500.astro for a middleware throw.
// Replace the two `app.use(...)` lines above with the following and rebuild:
//
//   import { astro } from 'astro/hono';
//   app.use(astro());

export default app;
