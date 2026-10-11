const STEPS = [
  { title: "Add your resume and the job", text: "Upload your resume as a PDF and paste the job ad. We read the PDF, then discard it." },
  {
    title: "AI compares them",
    text: "An AI reviews your resume against the job: the skills and terms it asks for, how relevant your experience is, and how clear your resume is.",
  },
  { title: "Fix the gaps", text: "You get a match score, how it was worked out, and the changes that will raise it most." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <div className="container">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map(({ title, text }) => (
            <li key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
