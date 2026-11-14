import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { signSession } from '../utils/jwt.js';

// Hash of a random value: unknown emails cost the same bcrypt work as wrong passwords (no user enumeration).
const DUMMY_HASH = bcrypt.hashSync(crypto.randomUUID(), 12);

export async function login(email: string, password: string) {
  const user = await User.findOne({ email }).select('+passwordHash').lean();
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');

  const profile = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  const token = await signSession({ sub: profile.id, name: profile.name, email: profile.email, role: profile.role });
  return { token, user: profile };
}
