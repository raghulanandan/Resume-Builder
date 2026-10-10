// Resume Builder – client-side mock analyzer.
// Reads the PDF text in the browser (pdf.js) and matches it against a skill list.
// If the text can't be read (e.g. a scanned PDF), it falls back to sample results.

const SKILLS = [
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
const MAX_SIZE = 5 * 1024 * 1024;
const STAGE_MS = 450;

const $ = (id) => document.getElementById(id);
const dropzone = $("dropzone");
const fileInput = $("file-input");

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

// --- Upload handling ---
fileInput.addEventListener("change", () => fileInput.files[0] && handleFile(fileInput.files[0]));

dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

$("reset-btn").addEventListener("click", reset);

let runId = 0;

async function handleFile(file) {
  reset();
  const id = runId;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return showError("Please upload a PDF file.");
  if (file.size > MAX_SIZE) return showError("That file is larger than 5 MB. Please upload a smaller PDF.");

  $("file-name").textContent = file.name;
  $("file-size").textContent = formatSize(file.size);
  $("file-info").classList.remove("hidden");
  dropzone.classList.add("hidden");
  $("loading").classList.remove("hidden");

  const textPromise = extractText(file).catch((err) => {
    console.warn("Could not read PDF text, using sample results.", err);
    return "";
  });
  // Step through the stages so the loading state is visible in the mock.
  const [text] = await Promise.all([textPromise, runStages(id)]);
  if (id !== runId) return; // the file was removed or replaced mid-analysis

  $("loading").classList.add("hidden");
  renderResults(text.trim().length > 50 ? analyze(text) : sampleResult(), file.name);
}

async function extractText(file) {
  if (!window.pdfjsLib) throw new Error("pdf.js not loaded");
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n");
}

async function runStages(id) {
  const items = [...$("stages").children];
  items.forEach((li) => li.classList.remove("active", "done"));
  for (const li of items) {
    if (id !== runId) return;
    li.classList.add("active");
    await new Promise((r) => setTimeout(r, STAGE_MS));
    li.classList.replace("active", "done");
  }
}

// --- Scoring ---
function analyze(text) {
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

function sampleResult() {
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

// --- Rendering ---
function renderResults({ score, present, missing, sample, breakdown, tips }, fileName) {
  const label = verdictFor(score);
  $("result-title").textContent = fileName;
  $("score-value").textContent = score;
  $("score-verdict").textContent = label;
  $("score-summary").textContent = sample
    ? "Sample results. We couldn't read the text in this PDF."
    : `${present.length} of ${SKILLS.length} key skills found`;
  $("insight-text").textContent = insightFor(score, label, present, missing, sample);

  renderBreakdown(breakdown);
  renderTips(tips);
  renderChips($("present-list"), present, "chip-good", "None of the skills we check for were found.");
  renderChips($("missing-list"), missing, "chip-bad", "Nothing missing. Every skill we check for is there.");
  $("present-count").textContent = present.length;
  $("missing-count").textContent = missing.length;

  const results = $("results");
  results.classList.remove("hidden", "marked");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
  // Start the pen and highlighter once the sheet is on screen.
  setTimeout(() => results.classList.add("marked"), 350);
}

function renderChips(list, items, cls, emptyText) {
  list.innerHTML = "";
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "chip-empty";
    li.textContent = emptyText;
    list.appendChild(li);
    return;
  }
  items.forEach((name, i) => {
    const li = document.createElement("li");
    li.className = `chip ${cls}`;
    li.style.animationDelay = `${0.9 + i * 0.08}s`;
    li.textContent = name;
    list.appendChild(li);
  });
}

function renderBreakdown(rows) {
  const box = $("breakdown");
  box.innerHTML = "";
  rows.forEach(({ label, value, max }) => {
    const row = document.createElement("div");
    row.innerHTML = '<div class="bar-meta"><span></span><span class="bar-num"></span></div><div class="bar"><div class="bar-fill"></div></div>';
    row.querySelector(".bar-meta span").textContent = label;
    row.querySelector(".bar-num").textContent = `${Math.round(value)} / ${max}`;
    row.querySelector(".bar-fill").style.width = `${(value / max) * 100}%`;
    box.appendChild(row);
  });
}

function renderTips(tips) {
  const list = $("tips");
  list.innerHTML = "";
  tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    list.appendChild(li);
  });
}

function insightFor(score, label, present, missing, sample) {
  if (sample) {
    return "This PDF may be a scanned image, so these are example results. Upload a PDF where you can select the text to see your real score.";
  }
  const strong = present.slice(0, 3).join(", ");
  const gaps = missing.slice(0, 3).join(", ");
  let msg = `${label}. `;
  msg += strong ? `It's strongest on ${strong}. ` : "It mentions few of the skills recruiters search for. ";
  msg += gaps ? `The biggest gaps are ${gaps}.` : "It covers every skill we check for.";
  return msg;
}

function verdictFor(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Weak";
}

function reset() {
  runId++;
  fileInput.value = "";
  dropzone.classList.remove("hidden");
  $("results").classList.remove("marked");
  ["file-info", "loading", "results", "error"].forEach((id) => $(id).classList.add("hidden"));
}

function showError(msg) {
  $("error").textContent = msg;
  $("error").classList.remove("hidden");
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
