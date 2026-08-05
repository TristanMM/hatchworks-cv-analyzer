import mammoth from "mammoth";

export type ParseDocxResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

// Heuristic: a real CV has much more text than this. A value below the
// threshold suggests a DOCX with no readable content (see testing.md, case 5).
const MIN_EXTRACTABLE_TEXT_LENGTH = 40;

/**
 * Extracts raw text from a DOCX using `mammoth.extractRawText`. If the
 * extracted text is empty or suspiciously short, returns an explicit
 * "no_extractable_text" error instead of a silent empty string (see
 * testing.md, edge case analogous to scanned PDF).
 */
export async function parseDocx(file: Buffer): Promise<ParseDocxResult> {
  try {
    const result = await mammoth.extractRawText({ buffer: file });
    const text = result.value.trim();

    if (text.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
      return {
        success: false,
        errorType: "no_extractable_text",
        message: "Could not extract readable text from the DOCX.",
      };
    }

    return { success: true, text };
  } catch (error) {
    console.error("[parseDocx] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "docx_parse_error",
      message: "Could not process the DOCX file.",
    };
  }
}
