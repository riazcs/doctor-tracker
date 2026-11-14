import mongoose from 'mongoose';
import { env } from './env.js';

let connecting: Promise<void> | undefined;

/**
 * Idempotent: safe to call on every request. Serverless platforms (Vercel) reuse warm
 * instances, so the connection is opened once per instance and shared afterwards.
 */
export function connectDB() {
  connecting ??= (async () => {
    mongoose.set('strictQuery', true);
    // Build indexes automatically in dev; in production run `syncIndexes` as a deploy step instead.
    mongoose.set('autoIndex', !env.isProd);
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: process.env.VERCEL ? 5 : 20, // many short-lived instances => smaller pools
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  })().catch((err) => {
    connecting = undefined; // let the next request retry instead of caching the failure
    throw err;
  });
  return connecting;
}

export async function disconnectDB() {
  connecting = undefined;
  await mongoose.disconnect();
}
