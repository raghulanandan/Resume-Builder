import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

// Run pdf.js's worker code in this process. Importing it here (instead of letting
// pdf.js load it on demand) also makes sure Vercel bundles the file.
globalThis.pdfjsWorker = pdfjsWorker;

// Reads all text from a PDF buffer. Throws if the file can't be parsed as a PDF.
export async function extractText(buffer) {
  const task = getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      pages.push(content.items.map((item) => item.str).join(" "));
    }
    return pages.join("\n");
  } finally {
    await task.destroy();
  }
}
