// Mock analyzer: matches resume text against a skill list and a few structure checks.

export const SKILLS = [
  { name: "JavaScript", patterns: ["javascript", "\\bjs\\b", "es6"] },
  { name: "TypeScript", patterns: ["typescript"] },
  { name: "HTML", patterns: ["\\bhtml5?\\b"] },
  { name: "CSS", patterns: ["\\bcss3?\\b", "sass", "scss", "tailwind"] },
  { name: "React", patterns: ["react(\\.js|js)?\\b"] },
  { name: "Node.js", patterns: ["node(\\.js|js)?\\b"] },
  { name: "Python", patterns: ["python"] },
  { name: "Java", patterns: ["\\bjava\\b"] },
  { name: "SQL", patterns: ["\\bsql\\b", "mysql", "postgres", "sqlite"] },
  { name: "Git", patterns: ["\\bgit\\b", "github", "gitlab"] },
  { name: "REST APIs", patterns: ["\\brest(ful)?\\b", "\\bapis?\\b"] },
  { name: "Cloud (AWS/Azure/GCP)", patterns: ["\\baws\\b", "azure", "\\bgcp\\b", "google cloud"] },
  { name: "Docker", patterns: ["docker", "kubernetes", "\\bk8s\\b"] },
  { name: "Testing", patterns: ["\\bjest\\b", "unit test", "testing", "cypress", "pytest"] },
  { name: "CI/CD", patterns: ["ci/cd", "\\bci\\b", "jenkins", "github actions"] },
  { name: "Agile", patterns: ["agile", "scrum", "kanban", "jira"] },
  { name: "Communication", patterns: ["communication", "presentation"] },
  { name: "Leadership", patterns: ["lead(ership|ing)?\\b", "mentor"] },
  { name: "Problem Solving", patterns: ["problem[- ]solving", "analytical"] },
  { name: "Teamwork", patterns: ["team ?work", "collaborat"] },
];

// Shown one by one while a resume is being analyzed.
export const STAGES = [
  "Reading the PDF",
  "Looking for skills",
  "Checking sections and contact details",
  "Adding up the score",
];

const SECTIONS = [
  { label: "Experience", pattern: "experience" },
  { label: "Education", pattern: "education" },
  { label: "Skills", pattern: "skills" },
  { label: "Projects", pattern: "projects" },
  { label: "Summary", pattern: "summary|objective|profile" },
];

export function analyze(text) {
  const lower = text.toLowerCase();
  const present = [];
  const missing = [];
  SKILLS.forEach((skill) => {
    const found = skill.patterns.some((p) => new RegExp(p, "i").test(lower));
    (found ? present : missing).push(skill.name);
  });

  const missingSections = SECTIONS.filter((s) => !new RegExp(`\\b(${s.pattern})\\b`, "i").test(lower)).map((s) => s.label);
  const sectionsFound = SECTIONS.length - missingSections.length;
  const words = lower.split(/\s+/).filter(Boolean).length;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(text);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(text);
  const hasNumbers = (text.match(/\d+%|\$\d|\d+\+/g) || []).length;

  // Skills 60 pts, structure 20, contact 10, length & impact 10.
  const skillScore = (present.length / SKILLS.length) * 60;
  const sectionScore = (sectionsFound / SECTIONS.length) * 20;
  const contactScore = (hasEmail ? 5 : 0) + (hasPhone ? 5 : 0);
  const lengthScore = words >= 250 && words <= 1000 ? 5 : words >= 150 ? 3 : 1;
  const impactScore = Math.min(hasNumbers, 5);

  const score = Math.round(skillScore + sectionScore + contactScore + lengthScore + impactScore);
  return {
    score: Math.min(score, 100),
    present,
    missing,
    breakdown: [
      { label: "Skills", value: skillScore, max: 60 },
      { label: "Structure", value: sectionScore, max: 20 },
      { label: "Contact", value: contactScore, max: 10 },
      { label: "Length & impact", value: lengthScore + impactScore, max: 10 },
    ],
    tips: buildTips({ missing, missingSections, hasEmail, hasPhone, hasNumbers, words }),
  };
}

function buildTips({ missing, missingSections, hasEmail, hasPhone, hasNumbers, words }) {
  const tips = [];
  if (!hasEmail || !hasPhone) {
    const parts = [!hasEmail && "an email address", !hasPhone && "a phone number"].filter(Boolean);
    tips.push(`Add ${parts.join(" and ")} at the top so recruiters can reach you.`);
  }
  if (missingSections.length) {
    tips.push(`Add clear section headings for: ${missingSections.join(", ")}.`);
  }
  if (hasNumbers < 3) {
    tips.push("Back up your results with numbers, e.g. “cut page load time by 40%” or “led a team of 5”.");
  }
  if (words < 250) tips.push("Your resume looks short. Add more detail about what you did and what came of it.");
  else if (words > 1000) tips.push("Your resume is long. Cut it down to the most relevant 1–2 pages.");
  if (missing.length) {
    tips.push(`If you have them, mention ${missing.slice(0, 3).join(", ")}. These skills are in high demand.`);
  }
  return tips.length ? tips : ["Your resume covers the basics well. Tailor it to each job description to stand out."];
}

export function sampleResult() {
  const present = ["JavaScript", "HTML", "CSS", "React", "Git", "Communication", "Teamwork", "Problem Solving"];
  const missing = SKILLS.map((s) => s.name).filter((n) => !present.includes(n));
  return {
    score: 68,
    present,
    missing,
    sample: true,
    breakdown: [
      { label: "Skills", value: 24, max: 60 },
      { label: "Structure", value: 20, max: 20 },
      { label: "Contact", value: 10, max: 10 },
      { label: "Length & impact", value: 6, max: 10 },
    ],
    tips: [
      "Back up your results with numbers, e.g. “cut page load time by 40%” or “led a team of 5”.",
      `If you have them, mention ${missing.slice(0, 3).join(", ")}. These skills are in high demand.`,
    ],
  };
}

export function verdictFor(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Weak";
}

export function insightFor({ score, present, missing, sample }) {
  if (sample) {
    return "This PDF may be a scanned image, so these are example results. Upload a PDF where you can select the text to see your real score.";
  }
  const strong = present.slice(0, 3).join(", ");
  const gaps = missing.slice(0, 3).join(", ");
  let msg = `${verdictFor(score)}. `;
  msg += strong ? `It's strongest on ${strong}. ` : "It mentions few of the skills recruiters search for. ";
  msg += gaps ? `The biggest gaps are ${gaps}.` : "It covers every skill we check for.";
  return msg;
}

export function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
