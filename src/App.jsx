import { useRef, useState } from "react";
import Header from "./components/Header.jsx";
import Uploader from "./components/Uploader.jsx";
import ExampleSheet from "./components/ExampleSheet.jsx";
import Results from "./components/Results.jsx";
import HowItWorks from "./components/HowItWorks.jsx";
import { STAGES, analyze, sampleResult } from "./lib/analyze.js";

const MAX_SIZE = 5 * 1024 * 1024;
const STAGE_MS = 450;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(-1); // -1 = not analyzing
  const [result, setResult] = useState(null);
  const runId = useRef(0);

  function reset() {
    runId.current++;
    setFile(null);
    setError("");
    setStage(-1);
    setResult(null);
  }

  async function handleFile(next) {
    reset();
    const id = runId.current;
    const isPdf = next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return setError("Please upload a PDF file.");
    if (next.size > MAX_SIZE) return setError("That file is larger than 5 MB. Please upload a smaller PDF.");

    setFile(next);
    // pdf.js is large, so it is only loaded once a file is picked.
    const textPromise = import("./lib/pdf.js")
      .then(({ extractText }) => extractText(next))
      .catch((err) => {
        console.warn("Could not read PDF text, using sample results.", err);
        return "";
      });

    // Step through the stages so the loading state is visible in the mock.
    for (let i = 0; i < STAGES.length; i++) {
      if (id !== runId.current) return;
      setStage(i);
      await wait(STAGE_MS);
    }
    const text = await textPromise;
    if (id !== runId.current) return; // the file was removed or replaced mid-analysis

    setStage(-1);
    setResult(text.trim().length > 50 ? analyze(text) : sampleResult());
  }

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <h1>Check your resume the way a recruiter would</h1>
              <p className="lead">
                Upload a PDF. You'll get a score out of 100, the skills it mentions,
                the ones it's missing, and what to fix first.
              </p>
              <Uploader file={file} error={error} stage={stage} onFile={handleFile} onReset={reset} />
            </div>
            <ExampleSheet />
          </div>
        </section>

        {result && <Results key={runId.current} result={result} fileName={file.name} />}

        <HowItWorks />
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2026 Resume Builder. Your resume is never uploaded or stored.</p>
        </div>
      </footer>
    </>
  );
}
