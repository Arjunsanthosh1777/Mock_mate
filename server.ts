import 'dotenv/config';
import dns from 'node:dns';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';

dns.setDefaultResultOrder('ipv4first');
import { getDatabase } from './server/db/database.ts';
import { apiRouter } from './server/routes/api.ts';

async function startServer(): Promise<void> {
  // Initialize SQLite schema on startup
  getDatabase();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Mount REST API routes
  app.use('/api', apiRouter);

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = isProduction ? Number(process.env.PORT) || 3000 : 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`MOCKMATE server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MOCKMATE server:', err);
  process.exit(1);
});
