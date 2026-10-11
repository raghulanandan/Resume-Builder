import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import analysesRouter from "./routes/analyses.js";

const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? "ok" : "degraded", database: connected ? "connected" : "disconnected" });
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
