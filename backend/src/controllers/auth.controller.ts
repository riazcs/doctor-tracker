import type { CookieOptions, Request, Response } from 'express';
import { env } from '../config/env.js';
import * as authService from '../services/auth.service.js';
import { parse } from '../utils/validate.js';
import { loginBody } from '../validators/auth.validators.js';

const cookieOptions: CookieOptions = {
  httpOnly: true, // not readable from JS => not stealable via XSS
  secure: env.isProd,
  sameSite: 'lax', // not sent on cross-site POSTs => CSRF mitigation
  path: '/',
};

export async function login(req: Request, res: Response) {
  const { email, password } = parse(loginBody, req.body);
  const { token, user } = await authService.login(email, password);
  res.cookie(env.cookieName, token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 8 });
  res.json({ data: user });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.cookieName, cookieOptions);
  res.status(204).end();
}

export function me(req: Request, res: Response) {
  res.json({ data: req.user });
}
