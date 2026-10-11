import { useState } from "react";
import Header from "./components/Header.jsx";
import CompareForm from "./components/CompareForm.jsx";
import ExampleSheet from "./components/ExampleSheet.jsx";
import Results from "./components/Results.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import { compareResume } from "./lib/api.js";
import { MAX_FILE_SIZE, STAGES } from "./lib/text.js";

const STAGE_MS = 450;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [stage, setStage] = useState(-1); // -1 = not comparing
  const [result, setResult] = useState(null);

  function handleFile(next) {
    setError("");
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setError("Please upload a PDF file.");
    if (next.size > MAX_FILE_SIZE) return setError("That file is larger than 4 MB. Please upload a smaller PDF.");
    setFile(next);
  }

  async function handleSubmit() {
    setError("");
    setResult(null);
    // Catch here so a fast failure isn't reported as unhandled while the stages run.
    const request = compareResume(file, jobDescription).then(
      (data) => ({ data }),
      (err) => ({ err })
    );

    // Step through the stages while the server works, so progress is visible.
    for (let i = 0; i < STAGES.length; i++) {
      setStage(i);
      await wait(STAGE_MS);
    }
    const { data, err } = await request;
    setStage(-1);
    if (err) return setError(err.message);
    setResult(data);
  }

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1>See how well your resume fits the job</h1>
              <p className="lead">
                Upload your resume and paste the job ad. You'll get a match score, the skills the job
                asks for that your resume is missing, and what to change first.
              </p>
              <CompareForm
                file={file}
                jobDescription={jobDescription}
                error={error}
                stage={stage}
                onFile={handleFile}
                onRemoveFile={() => setFile(null)}
                onJobChange={setJobDescription}
                onSubmit={handleSubmit}
              />
            </div>
            <ExampleSheet />
          </div>
        </section>

        {result && <Results key={result.id} result={result} />}

        <HowItWorks />
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Resume Builder. We keep your results and the job description, never your resume file.</p>
        </div>
      </footer>
    </>
  );
}
