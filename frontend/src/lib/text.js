// Wording, limits and formatting helpers for the comparison UI.

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const JOB_MIN = 50;
export const JOB_MAX = 20000;

// Shown one by one while a comparison is running.
export const STAGES = [
  "Uploading your resume",
  "Reading the job description",
  "Matching skills and keywords",
  "Adding up the score",
];

export function verdictFor(score) {
  if (score >= 80) return "Strong match";
  if (score >= 60) return "Good match";
  if (score >= 40) return "Partial match";
  return "Weak match";
}

export function summaryFor({ skills }) {
  const asked = skills.matched.length + skills.missing.length;
  return asked
    ? `Has ${skills.matched.length} of the ${asked} skills the job asks for`
    : "The job doesn't name any of the skills we check for, so its keywords were used instead";
}

export function insightFor({ score, skills, keywords }) {
  let msg = `${verdictFor(score)}. `;
  if (skills.matched.length) msg += `Your resume shows ${skills.matched.slice(0, 3).join(", ")}, which the job asks for. `;
  if (skills.missing.length) msg += `It doesn't mention ${skills.missing.slice(0, 3).join(", ")}. `;
  else if (skills.matched.length) msg += "It covers every skill the job names. ";
  if (keywords.missing.length) msg += `Terms from the job like ${keywords.missing.slice(0, 3).join(", ")} are also missing.`;
  return msg.trim();
}

export function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
