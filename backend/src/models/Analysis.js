import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    matched: [String],
    missing: [String],
  },
  { _id: false }
);

// One saved resume-to-job comparison. Only the results and the job description
// are stored, never the resume PDF itself.
const analysisSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true, maxlength: 255 },
    fileSize: { type: Number, required: true },
    jobDescription: { type: String, required: true, maxlength: 20000 },
    score: { type: Number, required: true, min: 0, max: 100 },
    // Which scorer produced this result: the labd AI, or keyword matching as a fallback.
    engine: { type: String, enum: ["ai", "keywords"], required: true },
    summary: { type: String, maxlength: 600 },
    skills: {
      type: new mongoose.Schema({ matched: [String], missing: [String], extra: [String] }, { _id: false }),
      required: true,
    },
    keywords: { type: matchSchema, required: true },
    breakdown: [
      {
        _id: false,
        label: String,
        value: Number,
        max: Number,
      },
    ],
    tips: [String],
  },
  { timestamps: true }
);

analysisSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

export default mongoose.model("Analysis", analysisSchema);
