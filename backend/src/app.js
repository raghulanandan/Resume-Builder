// The Express app. Vercel uses this file as the backend's entrypoint; locally,
// src/server.js imports it and listens on a port.
import express from "express";
import multer from "multer";
import analysesRouter from "./routes/analyses.js";
import { connectDb } from "./db.js";

const app = express();

app.use(express.json());

// Connects on first use and reuses the connection after that, so this works
// both on a long-running server and in a serverless function.
async function ensureDb() {
  try {
    await connectDb();
    return true;
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    return false;
  }
}

app.get("/api/health", async (_req, res) => {
  const connected = await ensureDb();
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "degraded", database: connected ? "connected" : "disconnected" });
});

app.use("/api/analyses", async (_req, res, next) => {
  if (await ensureDb()) return next();
  res.status(503).json({ error: "The database is unavailable. Try again in a moment." });
});
app.use("/api/analyses", analysesRouter);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "That file is larger than 4 MB. Please upload a smaller PDF." : "Upload one PDF in the “resume” field.";
    return res.status(400).json({ error: message });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server. Try again in a moment." });
});

export default app;
