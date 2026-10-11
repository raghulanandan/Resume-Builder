import mongoose from "mongoose";

let pending = null;

// Connects once and reuses the connection. Serverless functions call this on
// every request, so warm instances skip straight past it.
export function connectDb(uri = process.env.MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!uri) return Promise.reject(new Error("MONGODB_URI is not set"));
  pending ??= mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }).catch((err) => {
    pending = null; // let the next request try again
    throw err;
  });
  return pending;
}
