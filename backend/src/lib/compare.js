// Compares a resume with a job description using a skill list, job keywords and a few structure checks.

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

const SECTIONS = [
  { label: "Experience", pattern: "experience" },
  { label: "Education", pattern: "education" },
  { label: "Skills", pattern: "skills" },
  { label: "Projects", pattern: "projects" },
  { label: "Summary", pattern: "summary|objective|profile" },
];

// Common words and job-ad filler that say nothing about what the job needs.
const STOPWORDS = new Set(
  `a about above across after again against all also am an and any are as at be because been before being below
  between both but by can could did do does doing down during each either etc few for from further get had has have
  having he her here hers him his how i if in into is it its itself just like may me more most must my no nor not now
  of off on once only or other our ours out over own per same she should so some such than that the their them then
  there these they this those through to too under until up upon us very via was we were what when where which while
  who whom why will with within without would you your yours
  ability able applicant applicants apply benefits candidate candidates company day days description environment
  equal excellent experience experienced familiar familiarity good great help ideal including job join knowledge
  looking minimum new offer opportunity plus position preferred related required requirements responsibilities
  responsible role salary skills strong success successful team teams understanding using well work working year years
  build building create creating deliver develop developing drive ensure hire hiring junior make provide seeking senior
  support use write writing`
    .split(/\s+/)
    .filter(Boolean)
);

const KEYWORD_LIMIT = 15;
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function hasSkill(text, skill) {
  return skill.patterns.some((p) => new RegExp(p, "i").test(text));
}

// The most frequent meaningful words in the job description, leaving out
// anything already covered by the skill list.
function jobKeywords(jobText) {
  const counts = new Map();
  for (const raw of jobText.toLowerCase().match(/[a-z][a-z0-9+#.-]*/g) || []) {
    const word = raw.replace(/[.-]+$/, "");
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    if (SKILLS.some((skill) => hasSkill(word, skill))) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  // Map keeps first-seen order, and sort is stable, so ties stay in reading order.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, KEYWORD_LIMIT)
    .map(([word]) => word);
}

const ratio = (part, whole) => (whole ? part / whole : 0);

// Compares a resume with a job description. This is the piece the AI version
// will replace, so keep its input and output shape stable.
export function compare(resumeText, jobText) {
  const resume = resumeText.toLowerCase();

  const jobSkills = SKILLS.filter((s) => hasSkill(jobText, s));
  const matchedSkills = jobSkills.filter((s) => hasSkill(resume, s)).map((s) => s.name);
  const missingSkills = jobSkills.filter((s) => !hasSkill(resume, s)).map((s) => s.name);
  const extraSkills = SKILLS.filter((s) => !jobSkills.includes(s) && hasSkill(resume, s)).map((s) => s.name);

  const keywords = jobKeywords(jobText);
  const matchedKeywords = keywords.filter((k) => new RegExp(`\\b${escapeRegExp(k)}`, "i").test(resume));
  const missingKeywords = keywords.filter((k) => !matchedKeywords.includes(k));

  const missingSections = SECTIONS.filter((s) => !new RegExp(`\\b(${s.pattern})\\b`, "i").test(resume)).map((s) => s.label);
  const words = resume.split(/\s+/).filter(Boolean).length;
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resumeText);
  const hasPhone = /(\+?\d[\d\s().-]{8,}\d)/.test(resumeText);
  const hasNumbers = (resumeText.match(/\d+%|\$\d|\d+\+/g) || []).length;

  // Skills match 50 pts, keyword match 20, structure 15, contact 5, length & impact 10.
  // If the job lists none of the skills we know, its keywords carry the skill points too.
  const keywordRatio = ratio(matchedKeywords.length, keywords.length);
  const skillRatio = jobSkills.length ? ratio(matchedSkills.length, jobSkills.length) : keywordRatio;
  const skillScore = skillRatio * 50;
  const keywordScore = keywordRatio * 20;
  const sectionScore = ratio(SECTIONS.length - missingSections.length, SECTIONS.length) * 15;
  const contactScore = (hasEmail ? 2.5 : 0) + (hasPhone ? 2.5 : 0);
  const lengthScore = words >= 250 && words <= 1000 ? 5 : words >= 150 ? 3 : 1;
  const impactScore = Math.min(hasNumbers, 5);

  const score = Math.round(skillScore + keywordScore + sectionScore + contactScore + lengthScore + impactScore);
  return {
    score: Math.min(score, 100),
    skills: { matched: matchedSkills, missing: missingSkills, extra: extraSkills },
    keywords: { matched: matchedKeywords, missing: missingKeywords },
    breakdown: [
      { label: "Skills match", value: skillScore, max: 50 },
      { label: "Keyword match", value: keywordScore, max: 20 },
      { label: "Structure", value: sectionScore, max: 15 },
      { label: "Contact", value: contactScore, max: 5 },
      { label: "Length & impact", value: lengthScore + impactScore, max: 10 },
    ],
    tips: buildTips({ missingSkills, missingKeywords, missingSections, hasEmail, hasPhone, hasNumbers, words }),
  };
}

function buildTips({ missingSkills, missingKeywords, missingSections, hasEmail, hasPhone, hasNumbers, words }) {
  const tips = [];
  if (missingSkills.length) {
    tips.push(`The job asks for ${missingSkills.slice(0, 4).join(", ")}. If you have them, add them and show where you used them.`);
  }
  if (missingKeywords.length) {
    tips.push(`Where it's true for you, use the job's own words, such as ${missingKeywords.slice(0, 4).join(", ")}.`);
  }
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
  else if (words > 1000) tips.push("Your resume is long. Cut it down to what matters for this job.");
  return tips.length ? tips : ["Your resume covers what this job asks for. Put the most relevant experience first."];
}
