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

const SECTIONS = ["experience", "education", "skills", "projects", "summary|objective|profile"];
const MAX_SIZE = 5 * 1024 * 1024;
const GAUGE_LENGTH = 2 * Math.PI * 52;

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

async function handleFile(file) {
  reset();
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return showError("Please upload a PDF file.");
  if (file.size > MAX_SIZE) return showError("That file is larger than 5 MB. Please upload a smaller PDF.");

  $("file-name").textContent = file.name;
  $("file-size").textContent = formatSize(file.size);
  $("file-info").classList.remove("hidden");
  dropzone.classList.add("hidden");
  $("loading").classList.remove("hidden");

  let text = "";
  try {
    text = await extractText(file);
  } catch (err) {
    console.warn("Could not read PDF text, using sample results.", err);
  }

  // Short pause so the loading state is visible in the mock.
  await new Promise((r) => setTimeout(r, 700));
  $("loading").classList.add("hidden");
  renderResults(text.trim().length > 50 ? analyze(text) : sampleResult());
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

// --- Scoring ---
function analyze(text) {
  const lower = text.toLowerCase();
  const present = [];
  const missing = [];
  SKILLS.forEach((skill) => {
    const found = skill.patterns.some((p) => new RegExp(p, "i").test(lower));
    (found ? present : missing).push(skill.name);
  });

  const sectionsFound = SECTIONS.filter((s) => new RegExp(`\\b(${s})\\b`, "i").test(lower)).length;
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
  return { score: Math.min(score, 100), present, missing };
}

function sampleResult() {
  const present = ["JavaScript", "HTML", "CSS", "React", "Git", "Communication", "Teamwork", "Problem Solving"];
  const missing = SKILLS.map((s) => s.name).filter((n) => !present.includes(n));
  return { score: 68, present, missing, sample: true };
}

// --- Rendering ---
function renderResults({ score, present, missing, sample }) {
  const { label, color } = verdictFor(score);
  $("score-value").textContent = "0";
  $("score-verdict").textContent = label;
  $("score-verdict").style.color = color;
  $("score-summary").textContent = sample
    ? "We couldn't read text from this PDF, so these are sample results."
    : `${present.length} of ${SKILLS.length} key skills found.`;

  const fill = $("gauge-fill");
  fill.style.stroke = color;
  fill.style.strokeDashoffset = GAUGE_LENGTH;

  renderChips($("present-list"), present, "chip-good", "No matching skills found.");
  renderChips($("missing-list"), missing, "chip-bad", "Nothing missing. Nice work!");
  $("present-count").textContent = present.length;
  $("missing-count").textContent = missing.length;

  $("results").classList.remove("hidden");
  requestAnimationFrame(() => {
    fill.style.strokeDashoffset = GAUGE_LENGTH * (1 - score / 100);
    countUp($("score-value"), score);
  });
  $("results").scrollIntoView({ behavior: "smooth", block: "nearest" });
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
  items.forEach((name) => {
    const li = document.createElement("li");
    li.className = `chip ${cls}`;
    li.textContent = name;
    list.appendChild(li);
  });
}

function verdictFor(score) {
  if (score >= 80) return { label: "Excellent", color: "#15803d" };
  if (score >= 60) return { label: "Good", color: "#4f46e5" };
  if (score >= 40) return { label: "Needs work", color: "#b45309" };
  return { label: "Weak", color: "#b42318" };
}

function countUp(el, target) {
  const start = performance.now();
  const duration = 1000;
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function reset() {
  fileInput.value = "";
  dropzone.classList.remove("hidden");
  ["file-info", "loading", "results", "error"].forEach((id) => $(id).classList.add("hidden"));
}

function showError(msg) {
  $("error").textContent = msg;
  $("error").classList.remove("hidden");
}

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
