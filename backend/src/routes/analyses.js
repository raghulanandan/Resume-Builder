import { Router } from "express";
import mongoose from "mongoose";
import multer from "multer";
import Analysis from "../models/Analysis.js";
import { scoreResume } from "../lib/score.js";
import { extractText } from "../lib/pdf.js";

// Vercel rejects request bodies over 4.5 MB, so keep uploads under that.
const MAX_SIZE = 4 * 1024 * 1024;
const JOB_MIN = 50;
const JOB_MAX = 20000;

// Files are kept in memory only long enough to read their text.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: 1 },
});

const router = Router();

// POST /api/analyses  (multipart form: PDF in "resume", text in "jobDescription")
router.post("/", upload.single("resume"), async (req, res, next) => {
  try {
    const file = req.file;
    const jobDescription = (req.body.jobDescription || "").trim();
    if (!file) return res.status(400).json({ error: "Choose a PDF file to upload." });
    if (file.buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ error: "Please upload a PDF file." });
    }
    if (jobDescription.length < JOB_MIN) {
      return res.status(400).json({ error: `Paste the job description. It needs at least ${JOB_MIN} characters.` });
    }
    if (jobDescription.length > JOB_MAX) {
      return res.status(400).json({ error: `The job description is too long. Keep it under ${JOB_MAX.toLocaleString("en-US")} characters.` });
    }

    let text;
    try {
      text = await extractText(file.buffer);
    } catch (err) {
      console.warn("Could not read PDF:", err.message);
      return res.status(422).json({ error: "This PDF couldn't be opened. It may be damaged or password-protected." });
    }
    if (text.trim().length < 50) {
      return res.status(422).json({
        error: "We couldn't find any text in this PDF. It may be a scanned image. Export your resume as a PDF from your editor and try again.",
      });
    }

    const saved = await Analysis.create({
      ...(await scoreResume(text, jobDescription)),
      fileName: file.originalname,
      fileSize: file.size,
      jobDescription,
    });
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses?limit=20  (most recent first)
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const items = await Analysis.find().sort({ createdAt: -1 }).limit(limit);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/analyses/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Analysis not found." });
    const item = await Analysis.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Analysis not found." });
    res.json(item);
  } catch (err) {
    next(err);
  }
});

export default router;
