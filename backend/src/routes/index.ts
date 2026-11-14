import { Router } from 'express';
import mongoose from 'mongoose';
import * as stats from '../controllers/stats.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authRouter } from './auth.routes.js';
import { doctorRouter } from './doctor.routes.js';
import { patientRouter } from './patient.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'up' : 'down' });
});
apiRouter.use('/auth', authRouter);

// Everything below requires an authenticated session.
apiRouter.use(requireAuth);
apiRouter.use('/doctors', doctorRouter);
apiRouter.use('/patients', patientRouter);
apiRouter.get('/stats', stats.dashboard);
