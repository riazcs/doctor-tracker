import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  // Build indexes automatically in dev; in production run `syncIndexes` as a deploy step instead.
  mongoose.set('autoIndex', !env.isProd);
  await mongoose.connect(env.MONGODB_URI, { maxPoolSize: 20, serverSelectionTimeoutMS: 5000 });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
