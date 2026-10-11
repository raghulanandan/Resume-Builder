// Local development server. On Vercel, api/index.js is used instead.
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDb } from "./db.js";

const PORT = Number(process.env.PORT) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/resume-builder";

try {
  await connectDb(MONGODB_URI);
  console.log("Connected to MongoDB");
} catch (err) {
  console.error(`Could not connect to MongoDB at ${MONGODB_URI}: ${err.message}`);
  console.error("Start it with `docker compose up -d` from the project root, or set MONGODB_URI in backend/.env.");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

async function shutdown() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
