const STEPS = [
  { title: "Add your resume and the job", text: "Upload your resume as a PDF and paste the job ad. We read the PDF, then discard it." },
  {
    title: "We compare them",
    text: "We check which skills and key terms from the job appear in your resume, plus sections, contact details and results backed by numbers.",
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
