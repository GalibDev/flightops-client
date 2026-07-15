import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalWithMongoose = global as typeof globalThis & { mongoose?: Cache };
const cached = globalWithMongoose.mongoose ?? { conn: null, promise: null };
globalWithMongoose.mongoose = cached;

export async function connectDB() {
  if (!MONGODB_URI) return null;
  if (cached.conn) return cached.conn;

  try {
    cached.promise ??= mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection failed", error);
    return null;
  }
}
