import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

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
