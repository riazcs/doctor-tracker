import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { apiRouter } from './routes/index.js';

export function createApp({ lazyDB = false } = {}) {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // Serverless: no start-up hook exists, so connect on first request (cached afterwards).
  if (lazyDB) {
    app.use(async (_req, _res, next) => {
      await connectDB(); // Express 5 forwards a rejection to errorHandler
      next();
    });
  }

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

/** Default export for Vercel's Express runtime, which imports the app instead of running server.ts. */
export default createApp({ lazyDB: true });
