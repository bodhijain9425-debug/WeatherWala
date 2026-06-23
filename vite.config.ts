import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev-only middleware that proxies /api/* to our edge function modules.
 *
 * In production (Vercel) the files under /api are picked up automatically
 * as Edge Functions — Vercel handles the routing for us. Locally, Vite has
 * no concept of that convention, so we re-create it: load the module on
 * demand with `ssrLoadModule` (so it gets fresh TS->JS transforms and HMR),
 * build a standard `Request`, call its default-exported handler, and pipe
 * the `Response` back through Node's `http` API.
 */
function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'weatherwala-api-middleware',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        try {
          // /api/weather-grid?layer=temperature -> api/weather-grid.ts
          const [routePath] = req.url.split('?');
          const routeName = routePath.replace('/api/', '');
          const modulePath = `/api/${routeName}.ts`;

          const mod = await server.ssrLoadModule(modulePath);
          const handler = mod.default as (request: Request) => Promise<Response>;

          if (typeof handler !== 'function') {
            res.statusCode = 500;
            res.end(`No default export handler found in ${modulePath}`);
            return;
          }

          // Reconstruct a standard Request from Node's IncomingMessage
          const host = req.headers.host ?? 'localhost';
          const url = new URL(req.url, `http://${host}`);
          const request = new Request(url, { method: req.method, headers: req.headers as HeadersInit });

          const response = await handler(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        } catch (err) {
          console.error('[api-middleware]', err);
          res.statusCode = 500;
          res.end(String(err));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiMiddlewarePlugin()],
});
