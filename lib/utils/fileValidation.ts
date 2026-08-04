export type FileValidationResult =
  | { success: true }
  | { success: false; errorType: string; message: string };

const ACCEPTED_PDF_EXTENSION = ".pdf";
const ACCEPTED_DOCX_EXTENSION = ".docx";
const ACCEPTED_PDF_MIME_TYPE = "application/pdf";
const ACCEPTED_DOCX_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip", // DOCX es contenedor ZIP; algunos navegadores reportan este MIME
] as const;

// Vercel Functions rechaza cualquier body de request por encima de 4.5 MB a
// nivel de plataforma (antes de que corra nuestro código), devolviendo un 413
// que no es JSON — por eso el margen de seguridad por debajo de ese límite.
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
 * Detecta el formato del archivo tras pasar `validateFileBuffer`. Prioriza
 * magic bytes (%PDF vs PK\x03\x04); la extensión del nombre es solo respaldo.
 */
export function detectFileFormat(buffer: Buffer, fileName: string): DetectedFileFormat {
  if (hasPdfSignature(buffer)) return "pdf";
  if (hasZipSignature(buffer)) return "docx";

  const lower = fileName.toLowerCase();
  if (lower.endsWith(ACCEPTED_DOCX_EXTENSION)) return "docx";
  return "pdf";
}

/**
 * Valida tipo MIME, extensión y tamaño del archivo en el cliente (chequeo
 * básico, para feedback inmediato en el uploader, y para no subir archivos
 * que Vercel rechazaría de todos modos con un 413 antes de llegar a nuestro
 * código). La validación de contenido real (magic bytes) se hace server-side
 * con `validateFileBuffer` (ver agents.md y testing.md).
 */
export function validateFile(file: File): FileValidationResult {
  try {
    if (!isAcceptedPdf(file) && !isAcceptedDocx(file)) {
      return {
        success: false,
        errorType: "invalid_file_type",
        message: "Solo se aceptan archivos PDF (.pdf) o DOCX (.docx).",
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        errorType: "file_too_large",
        message: "El archivo supera el tamaño máximo permitido de 4 MB.",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[validateFile] fallo en validación de archivo:", error);
    return {
      success: false,
      errorType: "validation_error",
      message: "No se pudo validar el archivo.",
    };
  }
}

/**
 * Valida el contenido real del archivo en el servidor: tamaño máximo y firma
 * de PDF (magic `%PDF`) o DOCX (firma ZIP local file header), antes de
 * pasarlo al parser o gastar tokens en la API de Claude (ver agents.md y
 * testing.md). Complementa a `validateFile`, que solo hace un chequeo básico
 * de extensión/MIME en el cliente.
 */
export function validateFileBuffer(buffer: Buffer): FileValidationResult {
  try {
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        errorType: "file_too_large",
        message: "El archivo supera el tamaño máximo permitido de 4 MB.",
      };
    }

    if (hasPdfSignature(buffer) || hasZipSignature(buffer)) {
      return { success: true };
    }

    return {
      success: false,
      errorType: "invalid_file_signature",
      message:
        "El archivo no es un PDF ni un DOCX válido (el contenido no corresponde a un PDF o a un contenedor ZIP/DOCX).",
    };
  } catch (error) {
    console.error("[validateFileBuffer] fallo en validación server-side del archivo:", error);
    return {
      success: false,
      errorType: "validation_error",
      message: "No se pudo validar el archivo.",
    };
  }
}
