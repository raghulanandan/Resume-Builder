import { useEffect, useRef, useState } from "react";
import { SKILLS, insightFor, verdictFor } from "../lib/analyze.js";

export default function Results({ result, fileName }) {
  const { score, present, missing, sample, breakdown, tips } = result;
  const ref = useRef(null);
  const [marked, setMarked] = useState(false);

  useEffect(() => {
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    // Start the pen and highlighter once the sheet is on screen.
    const t = setTimeout(() => setMarked(true), 350);
    return () => clearTimeout(t);
  }, []);

  return (
    <section ref={ref} id="results" className={`results${marked ? " marked" : ""}`} aria-live="polite">
      <div className="container">
        <article className="sheet result-sheet">
          <header className="sheet-head">
            <h2>{fileName}</h2>
            <p className="summary">
              {sample
                ? "Sample results. We couldn't read the text in this PDF."
                : `${present.length} of ${SKILLS.length} key skills found`}
            </p>
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

              <h3>
                Skills found <span className="count">{present.length}</span>
              </h3>
              <SkillList
                items={present}
                className="chip-good"
                emptyText="None of the skills we check for were found."
                staggered
              />

              <h3>
                Skills missing <span className="count">{missing.length}</span>
              </h3>
              <p className="hint">Add these if they match your experience.</p>
              <SkillList items={missing} className="chip-bad" emptyText="Nothing missing. Every skill we check for is there." />
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

function SkillList({ items, className, emptyText, staggered = false }) {
  return (
    <ul className="chips">
      {items.length ? (
        items.map((name, i) => (
          <li
            key={name}
            className={`chip ${className}`}
            style={staggered ? { animationDelay: `${0.9 + i * 0.08}s` } : undefined}
          >
            {name}
          </li>
        ))
      ) : (
        <li className="chip-empty">{emptyText}</li>
      )}
    </ul>
  );
}
