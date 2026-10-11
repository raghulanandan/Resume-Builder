// Vercel entry point: every request is routed here (see vercel.json) and handed to Express.
import app from "../src/app.js";
import { connectDb } from "../src/db.js";

export default async function handler(req, res) {
  try {
    await connectDb();
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "The database is unavailable. Try again in a moment." }));
  }
  return app(req, res);
}
