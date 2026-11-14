import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as auth from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again in 15 minutes.' } },
});

export const authRouter = Router()
  .post('/login', loginLimiter, auth.login)
  .post('/logout', auth.logout)
  .get('/me', requireAuth, auth.me);
