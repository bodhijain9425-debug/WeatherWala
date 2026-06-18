import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost');
              const apiPath = urlObj.pathname.slice(5); // remove '/api/'
              const filePath = path.resolve(__dirname, `./api/${apiPath}.ts`);

              if (fs.existsSync(filePath)) {
                const protocol = req.headers['x-forwarded-proto'] || 'http';
                const host = req.headers.host || 'localhost:5173';
                const fullUrl = `${protocol}://${host}${req.url}`;

                const webReq = new Request(fullUrl, {
                  method: req.method,
                  headers: req.headers as any,
                });

                const module = await server.ssrLoadModule(`./api/${apiPath}.ts`);
                if (module && module.default) {
                  const response = await module.default(webReq);
                  res.statusCode = response.status;
                  response.headers.forEach((value, key) => {
                    res.setHeader(key, value);
                  });
                  const body = await response.text();
                  res.end(body);
                  return;
                }
              }
            } catch (err: any) {
              console.error('Local API Middleware Error:', err);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
              return;
            }
          }
          next();
          return;
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
