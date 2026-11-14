import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

await connectDB();
const server = createApp().listen(env.PORT, () => {
  console.log(`API ready on http://localhost:${env.PORT}/api`);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down…`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
