import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local file");
}

/**
 * Global cache to prevent multiple connections in development (hot-reload).
 * In production Next.js, each serverless function gets a fresh module scope.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 1000,
    };


    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {

      return m;
    }).catch((err) => {

      cached.promise = null; // Reset promise on failure
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
