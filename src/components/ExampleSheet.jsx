// Static example of a marked-up resume shown beside the upload box.
export default function ExampleSheet() {
  return (
    <figure className="preview" aria-label="Example of a marked-up resume">
      <div className="sheet preview-sheet" aria-hidden="true">
        <div className="pv-grade">
          <svg viewBox="0 0 120 80">
            <path d="M14 44C10 22 40 8 66 10c26 2 44 16 40 34-4 18-30 28-56 25C26 66 10 56 14 38" />
          </svg>
          <span>72</span>
        </div>
        <p className="pv-name">Priya Raman</p>
        <p className="pv-role">Frontend developer</p>
        <p className="pv-h">Experience</p>
        <p className="pv-line">
          Built the checkout flow in <mark>React</mark> and <mark>TypeScript</mark> for an online grocery store.
        </p>
        <p className="pv-line">
          Worked with design and backend teams to ship features weekly.
          <span className="pv-note">how many? add a number</span>
        </p>
        <p className="pv-h">Skills</p>
        <p className="pv-line">
          <mark>JavaScript</mark>, <mark>CSS</mark>, <mark>Git</mark>, Figma
          <span className="pv-caret">^ Docker, Testing</span>
        </p>
        <span className="pv-bar"></span>
        <span className="pv-bar short"></span>
      </div>
      <figcaption>Example result</figcaption>
    </figure>
  );
}
