export type FileValidationResult =
  | { success: true }
  | { success: false; errorType: string; message: string };

const ACCEPTED_PDF_EXTENSION = ".pdf";
const ACCEPTED_DOCX_EXTENSION = ".docx";
const ACCEPTED_PDF_MIME_TYPE = "application/pdf";
const ACCEPTED_DOCX_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip", // DOCX is a ZIP container; some browsers report this MIME
] as const;

// Vercel Functions rejects any request body above 4.5 MB at the platform
// level (before our code runs), returning a non-JSON 413 — hence the safety
// margin below that limit.
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
const PDF_MAGIC_BYTES = Buffer.from("%PDF");
const ZIP_MAGIC_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // "PK\x03\x04"

function isAcceptedPdf(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(ACCEPTED_PDF_EXTENSION) &&
    file.type === ACCEPTED_PDF_MIME_TYPE
  );
}

function isAcceptedDocx(file: File): boolean {
  return (
    file.name.toLowerCase().endsWith(ACCEPTED_DOCX_EXTENSION) &&
    ACCEPTED_DOCX_MIME_TYPES.includes(
      file.type as (typeof ACCEPTED_DOCX_MIME_TYPES)[number]
    )
  );
}

function hasPdfSignature(buffer: Buffer): boolean {
  return buffer.subarray(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES);
}

function hasZipSignature(buffer: Buffer): boolean {
  return (
    buffer.length >= ZIP_MAGIC_BYTES.length &&
    buffer.subarray(0, ZIP_MAGIC_BYTES.length).equals(ZIP_MAGIC_BYTES)
  );
}

export type DetectedFileFormat = "pdf" | "docx";

/**
 * Detects the file format after passing `validateFileBuffer`. Prioritizes
 * magic bytes (%PDF vs PK\x03\x04); the name extension is fallback only.
 */
export function detectFileFormat(buffer: Buffer, fileName: string): DetectedFileFormat {
  if (hasPdfSignature(buffer)) return "pdf";
  if (hasZipSignature(buffer)) return "docx";

  const lower = fileName.toLowerCase();
  if (lower.endsWith(ACCEPTED_DOCX_EXTENSION)) return "docx";
  return "pdf";
}

/**
 * Validates MIME type, extension, and file size on the client (basic check,
 * for immediate feedback in the uploader, and to avoid uploading files that
 * Vercel would reject with a 413 anyway before reaching our code). Real
 * content validation (magic bytes) is done server-side with `validateFileBuffer`
 * (see agents.md and testing.md).
 */
export function validateFile(file: File): FileValidationResult {
  try {
    if (!isAcceptedPdf(file) && !isAcceptedDocx(file)) {
      return {
        success: false,
        errorType: "invalid_file_type",
        message: "Only PDF (.pdf) or DOCX (.docx) files are accepted.",
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        errorType: "file_too_large",
        message: "The file exceeds the maximum allowed size of 4 MB.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[validateFile] fallo en validación de archivo:", error);
    return {
      success: false,
      errorType: "validation_error",
      message: "Could not validate the file.",
    };
  }
}

/**
 * Validates the real file content on the server: maximum size and PDF signature
 * (magic `%PDF`) or DOCX (ZIP local file header signature), before passing it
 * to the parser or spending tokens on the Claude API (see agents.md and
 * testing.md). Complements `validateFile`, which only does a basic
 * extension/MIME check on the client.
 */
export function validateFileBuffer(buffer: Buffer): FileValidationResult {
  try {
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        errorType: "file_too_large",
        message: "The file exceeds the maximum allowed size of 4 MB.",
      };
    }

    if (hasPdfSignature(buffer) || hasZipSignature(buffer)) {
      return { success: true };
    }

    return {
      success: false,
      errorType: "invalid_file_signature",
      message:
        "The file is not a valid PDF or DOCX (the content does not match a PDF or ZIP/DOCX container).",
    };
  } catch (error) {
    console.error("[validateFileBuffer] fallo en validación server-side del archivo:", error);
    return {
      success: false,
      errorType: "validation_error",
      message: "Could not validate the file.",
    };
  }
}
