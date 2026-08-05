// Must be imported before "pdf-parse": registers the real pdf.js worker on
// globalThis so pdf.js's internal fallback does not try to resolve
// "./pdf.worker.mjs" with a broken relative path after Next.js bundling
// (see pdf-parse troubleshooting.md, sections 3 and 4).
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export type ParsePdfResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

// Heuristic: a real CV has much more text than this. A value below the
// threshold suggests a scanned PDF with no text layer (see testing.md, case 5).
const MIN_EXTRACTABLE_TEXT_LENGTH = 40;

/**
 * Extracts raw text from a PDF using `pdf-parse` (v2 API, based on the
 * `PDFParse` class). If the extracted text is empty or suspiciously short,
 * returns an explicit "no_extractable_text" error instead of a silent empty
 * string (see testing.md, edge case 5: scanned PDF).
 */
export async function parsePdf(file: Buffer): Promise<ParsePdfResult> {
  let parser: PDFParse | undefined;
  try {
    parser = new PDFParse({ data: file });
    const result = await parser.getText();
    const text = result.text.trim();

    if (text.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
      return {
        success: false,
        errorType: "no_extractable_text",
        message:
          "Could not extract readable text from the PDF. It may be a scanned document without a text layer.",
      };
    }

    return { success: true, text };
  } catch (error) {
    console.error("[parsePdf] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "pdf_parse_error",
      message: "Could not process the PDF file.",
    };
  } finally {
    await parser?.destroy();
  }
}
