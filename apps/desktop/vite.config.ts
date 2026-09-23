import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';

function realQuotaApiPlugin() {
  return {
    name: 'real-quota-api',
    configureServer(server: any) {
      server.middlewares.use('/api/quota', (_req: any, res: any) => {
        try {
          const raw = execSync('npx tokscale usage --json', { encoding: 'utf8' });
          res.setHeader('Content-Type', 'application/json');
          res.end(raw);
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/models', (_req: any, res: any) => {
        try {
          const raw = execSync('npx tokscale models --json --today', { encoding: 'utf8' });
          res.setHeader('Content-Type', 'application/json');
          res.end(raw);
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), realQuotaApiPlugin()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true
  }
});
