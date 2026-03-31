import mongoose from "mongoose";

const connectDB = async () => {
  // Check if already connected
  if (mongoose.connections[0]?.readyState === 1) {
    return; // already connected
  }
  
  try {
    // If connection is in progress, wait for it
    if (mongoose.connections[0]?.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once("connected", resolve);
        mongoose.connection.once("error", resolve);
      });
      if (mongoose.connections[0]?.readyState === 1) {
        return;
      }
    }
    
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

    await mongoose.connect(process.env.MONGODB_URI, connectOptions);
    
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error;
  }
};

export { connectDB };