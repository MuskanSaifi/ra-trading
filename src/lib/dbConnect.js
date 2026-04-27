import mongoose from "mongoose";

const globalKey = "__ratradingMongoose";

/**
 * Cache the connection/promise on the Node global to avoid:
 * - opening multiple connections in dev (fast refresh)
 * - attaching repeated event listeners during parallel SSG workers
 */
const cached = globalThis[globalKey] || { conn: null, promise: null };
globalThis[globalKey] = cached;

const connectDB = async () => {
  try {
    if (cached.conn) return;

    const connectOptions = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Maintain minimum 2 connections for better performance
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      // Note: bufferMaxEntries and bufferCommands are not supported in Mongoose 8.x
      // Buffering is handled automatically by Mongoose
    };
    // If URI has no database path, MongoDB may use "test" — set MONGODB_DB=ratrading (or your DB name)
    const dbName = process.env.MONGODB_DB?.trim();
    if (dbName) {
      connectOptions.dbName = dbName;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(process.env.MONGODB_URI, connectOptions);
    }

    cached.conn = await cached.promise;

    if (process.env.NODE_ENV !== "production") {
      console.log("✅ MongoDB Connected");
    }
  } catch (error) {
    cached.promise = null;
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error;
  }
};

export { connectDB };