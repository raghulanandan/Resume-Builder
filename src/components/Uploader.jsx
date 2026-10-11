import { useRef, useState } from "react";
import { STAGES, formatSize } from "../lib/analyze.js";

export default function Uploader({ file, error, stage, onFile, onReset }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  }

  function handleChange(e) {
    const picked = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (picked) onFile(picked);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current.click();
    }
  }

  return (
    <div id="analyze" className="upload">
      {file ? (
        <div className="file-info">
          <div className="file-meta">
            <span className="file-badge">PDF</span>
            <div>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{formatSize(file.size)}</p>
            </div>
          </div>
          <button className="btn-ghost" type="button" onClick={onReset}>
            Remove
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-input"
          className={`dropzone${dragging ? " dragover" : ""}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
        >
          <svg className="dz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <polyline points="9 15 12 12 15 15" />
          </svg>
          <span>
            <span className="dz-title">
              Drop your resume here, or <span className="link">choose a file</span>
            </span>
            <span className="dz-sub">PDF up to 5 MB. It's read in your browser and never uploaded.</span>
          </span>
          <input ref={inputRef} type="file" id="file-input" accept="application/pdf,.pdf" hidden onChange={handleChange} />
        </label>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {stage >= 0 && (
        <div className="loading" aria-live="polite">
          <ol className="stages">
            {STAGES.map((label, i) => (
              <li key={label} className={i < stage ? "done" : i === stage ? "active" : ""}>
                {label}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
