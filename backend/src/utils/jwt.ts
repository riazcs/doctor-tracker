import { SignJWT, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import type { Role } from '../models/User.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ISSUER = 'doctor-tracker';

export interface SessionClaims {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export async function signSession(claims: SessionClaims) {
  return new SignJWT({ email: claims.email, name: claims.name, role: claims.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: ['HS256'] });
  return payload as unknown as SessionClaims;
}
