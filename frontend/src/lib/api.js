// Sends a resume PDF and a job description to the backend and returns the saved comparison.
export async function compareResume(file, jobDescription) {
  const body = new FormData();
  body.append("resume", file);
  body.append("jobDescription", jobDescription);

  let res;
  try {
    res = await fetch("/api/analyses", { method: "POST", body });
  } catch {
    throw new Error("Couldn't reach the server. Check that the backend is running and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "The server couldn't compare your resume. Try again in a moment.");
  }
  return data;
}
