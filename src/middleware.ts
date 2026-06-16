import { defineMiddleware } from 'astro:middleware';

// Throws for `/boom` to show that an error thrown by Astro middleware on the
// composable `astro/hono` path is not turned into the custom 500.astro: it
// escapes to the host framework (Hono) instead.
export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname === '/boom') {
		throw new Error('boom from middleware');
	}
	return next();
});
