import { useEffect, useRef, useState } from "react";
import { insightFor, summaryFor, verdictFor } from "../lib/text.js";

export default function Results({ result }) {
  const { fileName, score, skills, keywords, breakdown, tips } = result;
  const ref = useRef(null);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    // Start the pen and highlighter once the sheet is on screen.
    const t = setTimeout(() => setMarked(true), 350);
    return () => clearTimeout(t);
  }, []);

  const skillsAsked = skills.matched.length + skills.missing.length;
  const keywordCount = keywords.matched.length + keywords.missing.length;

  return (
    <section ref={ref} id="results" className={`results${marked ? " marked" : ""}`} aria-live="polite">
      <div className="container">
        <article className="sheet result-sheet">
          <header className="sheet-head">
            <h2>{fileName}</h2>
            <p className="summary">{summaryFor(result)}</p>
            {result.engine === "keywords" && (
              <p className="engine-note">The AI review wasn't available, so this was scored with keyword matching.</p>
            )}
          </header>

          <div className="sheet-body">
            <div className="sheet-main">
              <p className="insight-text">{insightFor(result)}</p>

              <h3>Fix these first</h3>
              <ul className="tips">
                {tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>

              {skillsAsked > 0 && (
                <>
                  <h3>
                    Skills the job asks for <span className="count">{skills.matched.length} of {skillsAsked}</span>
                  </h3>
                  <p className="hint">Highlighted ones are on your resume. Ones marked ^ are missing.</p>
                  <MatchList matched={skills.matched} missing={skills.missing} />
                </>
              )}

              {keywordCount > 0 && (
                <>
                  <h3>
                    Keywords from the job ad <span className="count">{keywords.matched.length} of {keywordCount}</span>
                  </h3>
                  <MatchList matched={keywords.matched} missing={keywords.missing} />
                </>
              )}

              {skills.extra.length > 0 && (
                <>
                  <h3>Also on your resume</h3>
                  <p className="hint">This job doesn't mention these. Keep them if they're relevant.</p>
                  <ul className="chips">
                    {skills.extra.map((name) => (
                      <li key={name} className="chip chip-plain">
                        {name}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <aside className="sheet-margin">
              <div className="grade">
                <svg className="grade-ring" viewBox="0 0 160 110" aria-hidden="true">
                  <path pathLength="1" d="M20 60C14 30 52 10 88 12c36 2 60 22 54 46-6 26-42 40-78 36C34 90 14 76 20 50" />
                </svg>
                <span className="grade-num">
                  <span className="grade-score">{score}</span>
                  <small>/100</small>
                </span>
              </div>
              <p className="verdict">{verdictFor(score)}</p>

              <div className="breakdown">
                {breakdown.map(({ label, value, max }) => (
                  <div key={label}>
                    <div className="bar-meta">
                      <span>{label}</span>
                      <span className="bar-num">
                        {Math.round(value)} / {max}
                      </span>
                    </div>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </article>
      </div>
    </section>
  );
}

// Matched items get the highlighter (one after another); missing ones get a red caret.
function MatchList({ matched, missing }) {
  return (
    <ul className="chips">
      {matched.map((name, i) => (
        <li key={name} className="chip chip-good" style={{ animationDelay: `${0.9 + i * 0.08}s` }}>
          {name}
        </li>
      ))}
      {missing.map((name) => (
        <li key={name} className="chip chip-bad">
          {name}
        </li>
      ))}
    </ul>
  );
}
