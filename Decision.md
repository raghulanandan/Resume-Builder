I want to build an HTML, CSS, JS landing page for my resume parser, where I should be able to upload an PDF and get the score out of it. Here I just want to see the score, what skills are present, and what skills are missing. And I'm gonna call this as Resume Builder. This is gonna be a mock design, so just build html css is fine, no back-end server is needed.

---

## Decision log

### 1. First version: plain HTML, CSS and JS
- Landing page with a PDF upload, a score out of 100, skills found and skills missing.
- The PDF is read in the browser with pdf.js. There is no back end.
- The score is made of skills (60), sections (20), contact details (10), and length and numbers in results (10).
- If no text can be read from the PDF (for example a scanned image), sample results are shown and labelled as samples.

### 2. Dark "AI app" redesign (replaced)
- Tried a dark theme with glowing gradients, glass cards and a typing effect so the app would feel AI-based.
- Rejected because it looked like a generic AI-generated site.
- Kept from this round: step-by-step loading, a score breakdown, and suggested fixes based on what the resume is missing.

### 3. Marked-up resume design (current)
- Followed Anthropic's `frontend-design` skill, found through `find-skills` on skills.sh. It says to take the look from the subject and avoid the usual tells of generated pages.
- The idea is a printed resume that a recruiter has marked up: a white sheet on a grey desk, a red-pen score circled by hand, yellow highlighter on the skills found, and red ^ marks for missing skills.
- Fonts: IBM Plex Sans for text, Caveat for the handwritten red-pen notes.
- Only one animation: when results appear, the pen circles the score and the highlighter sweeps across the skills. Nothing else moves on its own.
- Results page: summary, "Fix these first" and skills in the main column; score and breakdown in the margin.

### 4. Moved to React
- Rebuilt as a React 19 app with Vite. Same design and the same scoring.
- pdf.js now comes from npm (`pdfjs-dist`) instead of a CDN, and loads only when a file is picked, which keeps the first page load small.
- Structure:
  - `src/App.jsx`: upload state, the loading steps, and showing results.
  - `src/components/`: Header, Uploader, ExampleSheet, Results, HowItWorks.
  - `src/lib/analyze.js`: skill list, scoring, tips and wording.
  - `src/lib/pdf.js`: reads text from the PDF.
  - `src/styles.css`: all styles.
- Run with `npm install`, then `npm run dev`. Build with `npm run build`.
- Still a mock: no back end, and the resume never leaves the browser.
