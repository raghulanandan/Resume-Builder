// Picks how a resume is scored: the AI (labd) when it's available, otherwise
// keyword matching. Either way the result has the same shape, plus `engine`
// saying which one produced it.
import { aiCompare } from "./aiCompare.js";
import { compare } from "./compare.js";

export async function scoreResume(resumeText, jobText) {
  if (process.env.LABD_API_KEY) {
    try {
      return { ...(await aiCompare(resumeText, jobText)), engine: "ai" };
    } catch (err) {
      console.warn("AI comparison failed, using keyword matching instead:", err.message);
    }
  }
  return { ...compare(resumeText, jobText), engine: "keywords" };
}
