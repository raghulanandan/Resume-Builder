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
- At this stage it was still front end only, and the resume never left the browser. Step 5 changed that.

### 5. Split into frontend and backend, with MongoDB
- The React app moved into `frontend/`. A new `backend/` folder holds an Express server that stores results in MongoDB.
- Reading and scoring the PDF moved to the server. The frontend sends the PDF, and the server reads the text, scores it, saves the result and sends it back.
- Only the results are saved, never the PDF. Uploads are held in memory just long enough to read them. The page text was changed from "never uploaded" to "we save the results, not the file".
- The scoring logic is the same as before. It now lives in `backend/src/lib/analyze.js`, and the frontend keeps only display wording (`frontend/src/lib/text.js`).
- API:
  - `POST /api/analyses`: multipart form with one PDF in the `resume` field. Returns the saved analysis.
  - `GET /api/analyses?limit=20`: most recent analyses.
  - `GET /api/analyses/:id`: one analysis.
  - `GET /api/health`: shows whether the database is connected.
- Checks: PDFs only (checked by the file's first bytes, not just its name), 5 MB maximum, and clear error messages for missing, oversized, fake or unreadable files.
- If a PDF has no readable text (for example a scanned image), sample results are returned and labelled as samples, as before.
- Stack: Express 5, Mongoose 9, Multer for uploads, and pdfjs-dist on the server.
- In development, Vite forwards `/api` requests to the backend on port 5000, so the frontend needs no extra setup.

#### Running it locally
1. Start MongoDB: `docker compose up -d` from the project root, or point `MONGODB_URI` in `backend/.env` at your own MongoDB.
2. Backend: `cd backend`, `npm install`, copy `.env.example` to `.env`, then `npm run dev` (API on http://localhost:5000).
3. Frontend: `cd frontend`, `npm install`, `npm run dev`, then open http://localhost:5173.

### 6. Compare a resume with a job description
- The app now needs two inputs: the resume PDF and the pasted job description (50 to 20,000 characters). The result is a match score for that job instead of a general resume score.
- The comparison still uses keyword matching. AI will be added later.
- What gets compared:
  - **Skills:** which of the known skills the job mentions, and which of those the resume has or is missing. Skills on the resume that the job doesn't mention are listed separately.
  - **Keywords:** the 15 most frequent meaningful words in the job ad, leaving out common words, job-ad filler ("hiring", "strong", "team") and anything already counted as a skill. Each is marked found or missing in the resume.
  - **Basics:** sections, contact details, length and numbers in results, as before.
- New score out of 100: skills match 50, keyword match 20, structure 15, contact 5, length and impact 10. If the job names none of the known skills, the keyword match is used for the skills part too.
- Suggested fixes now start with the missing job skills and job wording, then the general fixes.
- Removed the "sample results" fallback. A sample can't be compared with a real job, so a PDF with no readable text (for example a scanned image) now gets a clear error asking for a text PDF.
- The job description is saved with each result. The resume PDF is still never stored.
- API change: `POST /api/analyses` now requires a `jobDescription` text field next to the `resume` file. Saved results have `skills { matched, missing, extra }` and `keywords { matched, missing }` in place of the old `present` and `missing` lists.
- Frontend: the form has the resume drop zone, a job description box and a "Compare resume to job" button, which stays disabled until both are filled in. Choosing a file no longer starts the check by itself. Results show the skills the job asks for, keywords from the job ad and other skills on the resume, using the same highlighter and red-pen marks.

#### Where the AI will go
- All comparison logic lives in one function, `compare(resumeText, jobText)` in `backend/src/lib/compare.js`.
- The AI version should replace or wrap that function and return the same shape: `score`, `skills`, `keywords`, `breakdown` and `tips`. The route, the database model and the UI can then stay as they are.
