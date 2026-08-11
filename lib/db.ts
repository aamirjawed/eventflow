import mongoose from "mongoose";

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
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.warn("[DB Warning] MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI is missing");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: "eventflow",
      serverSelectionTimeoutMS: 4000,
      connectTimeoutMS: 4000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("[DB SUCCESS] Connected to MongoDB Atlas successfully");
        return m;
      })
      .catch((err) => {
        console.error("[DB ERROR] MongoDB connection failed (bad auth or network):", err.message || err);
        cached.promise = null; // Reset promise on failure
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}
