// AI comparison of a resume with a job description, using labd.
// Returns the same shape as compare() in compare.js, plus a written summary.
import { chat } from "./labd.js";

// Fixed categories so scores are consistent between requests. The AI fills in
// the points; the server adds them up.
const CATEGORIES = [
  { label: "Skills match", max: 40, means: "how many of the skills and tools the job asks for the resume shows" },
  { label: "Experience relevance", max: 30, means: "how closely past roles, level and achievements fit this job" },
  { label: "Keywords and wording", max: 15, means: "whether the resume uses the job's own terms where they apply" },
  { label: "Resume quality", max: 15, means: "clear sections, contact details, measurable results, sensible length" },
];

// Keep the prompt a reasonable size; resumes rarely need more than this.
const RESUME_LIMIT = 15000;

function buildPrompt(resumeText, jobText) {
  const categories = CATEGORIES.map((c) => `- "${c.label}" (0 to ${c.max}): ${c.means}`).join("\n");
  return `You are an experienced recruiter. Compare the resume with the job description below.

Reply with one JSON object and nothing else: no code fences, no comments, no text before or after it. Use exactly this shape:
{
  "summary": "2 to 3 plain sentences to the candidate (use 'you'): how well they fit and the biggest gap",
  "skills": {
    "matched": ["skills or tools the job asks for that the resume shows"],
    "missing": ["skills or tools the job asks for that the resume does not show"],
    "extra": ["relevant skills on the resume that the job does not mention"]
  },
  "keywords": {
    "matched": ["important terms from the job description that appear in the resume"],
    "missing": ["important terms from the job description that do not appear in the resume"]
  },
  "breakdown": [${CATEGORIES.map((c) => `{ "label": "${c.label}", "value": 0 }`).join(", ")}],
  "tips": ["up to 5 specific changes to the resume for this job, most important first"]
}

Score each breakdown category within its range:
${categories}

Rules:
- Only use facts in the resume. Never assume a skill that isn't there.
- Use short names for skills and terms, e.g. "React", "Docker", "stakeholder management".
- Keep each list to at most 15 items.
- Tips must be actions the candidate can take, written in plain language.

JOB DESCRIPTION:
"""
${jobText}
"""

RESUME:
"""
${resumeText.slice(0, RESUME_LIMIT)}
"""`;
}

// Pulls the JSON object out of the reply, even if the model wrapped it in a code fence.
function parseJson(reply) {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("AI reply had no JSON object");
  return JSON.parse(reply.slice(start, end + 1));
}

function cleanList(value, maxItems = 15, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const text = item.trim().slice(0, maxLength);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length === maxItems) break;
  }
  return out;
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

// Checks the AI's answer and turns it into the app's result shape. Throws if
// the answer is unusable so the caller can fall back to keyword matching.
function toResult(raw) {
  if (!raw || typeof raw !== "object") throw new Error("AI reply was not an object");

  const values = new Map(
    (Array.isArray(raw.breakdown) ? raw.breakdown : [])
      .filter((b) => b && typeof b.label === "string")
      .map((b) => [b.label.trim().toLowerCase(), Number(b.value)])
  );
  const breakdown = CATEGORIES.map(({ label, max }) => {
    const value = values.get(label.toLowerCase());
    if (!Number.isFinite(value)) throw new Error(`AI reply is missing a score for "${label}"`);
    return { label, value: Math.min(Math.max(value, 0), max), max };
  });

  const summary = cleanText(raw.summary, 600);
  if (!summary) throw new Error("AI reply had no summary");

  return {
    score: Math.round(breakdown.reduce((sum, b) => sum + b.value, 0)),
    summary,
    skills: {
      matched: cleanList(raw.skills?.matched),
      missing: cleanList(raw.skills?.missing),
      extra: cleanList(raw.skills?.extra),
    },
    keywords: {
      matched: cleanList(raw.keywords?.matched),
      missing: cleanList(raw.keywords?.missing),
    },
    breakdown,
    tips: cleanList(raw.tips, 5, 300),
  };
}

export async function aiCompare(resumeText, jobText) {
  const reply = await chat([{ role: "user", content: buildPrompt(resumeText, jobText) }]);
  return toResult(parseJson(reply));
}
