import type { RequestHandler } from 'express';
import type {} from '../types/express.js'; // adds req.user to Express's Request type
import { env } from '../config/env.js';
import type { Role } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifySession } from '../utils/jwt.js';

/** Authentication: requires a valid session cookie (or Bearer token for API clients). */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token: string | undefined =
    req.cookies?.[env.cookieName] ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);
  if (!token) throw ApiError.unauthorized();

  try {
    const claims = await verifySession(token);
    req.user = { id: claims.sub, email: claims.email, name: claims.name, role: claims.role };
  } catch {
    throw ApiError.unauthorized('Session expired or invalid. Please sign in again.');
  }
  next();
};

/** Authorization: restricts a route to the given roles. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden();
    next();
  };
