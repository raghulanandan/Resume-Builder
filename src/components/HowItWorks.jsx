const STEPS = [
  { title: "Upload your PDF", text: "The file stays on your device. The text is read in your browser." },
  {
    title: "We check it",
    text: "We look for 20 in-demand skills, standard sections, contact details and results backed by numbers.",
  },
  { title: "Fix the gaps", text: "You get a score, how it was worked out, and the changes that will raise it most." },
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
