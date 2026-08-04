export type FileValidationResult =
  | { success: true }
  | { success: false; errorType: string; message: string };

const ACCEPTED_EXTENSION = ".pdf";
const ACCEPTED_MIME_TYPE = "application/pdf";
// Vercel Functions rechaza cualquier body de request por encima de 4.5 MB a
// nivel de plataforma (antes de que corra nuestro código), devolviendo un 413
// que no es JSON — por eso el margen de seguridad por debajo de ese límite.
export const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
const PDF_MAGIC_BYTES = Buffer.from("%PDF");

/**
 * Valida tipo MIME, extensión y tamaño del archivo en el cliente (chequeo
 * básico, para feedback inmediato en el uploader, y para no subir archivos
 * que Vercel rechazaría de todos modos con un 413 antes de llegar a nuestro
 * código). La validación de contenido real (magic bytes) se hace server-side
 * con `validatePdfBuffer` (ver agents.md y testing.md).
 */
export function validateFile(file: File): FileValidationResult {
  try {
    const hasValidExtension = file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION);
    const hasValidMimeType = file.type === ACCEPTED_MIME_TYPE;

    if (!hasValidExtension || !hasValidMimeType) {
      return {
        success: false,
        errorType: "invalid_file_type",
        message: "Solo se aceptan archivos PDF (.pdf).",
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
 * de PDF (magic bytes), antes de pasarlo al parser o gastar tokens en la API
 * de Claude (ver agents.md y testing.md). Complementa a `validateFile`, que
 * solo hace un chequeo básico de extensión/MIME en el cliente.
 */
export function validatePdfBuffer(buffer: Buffer): FileValidationResult {
  try {
    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        errorType: "file_too_large",
        message: "El archivo supera el tamaño máximo permitido de 4 MB.",
      };
    }

    const hasValidSignature = buffer
      .subarray(0, PDF_MAGIC_BYTES.length)
      .equals(PDF_MAGIC_BYTES);

    if (!hasValidSignature) {
      return {
        success: false,
        errorType: "invalid_pdf_signature",
        message: "El archivo no es un PDF válido (el contenido no corresponde a un PDF).",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[validatePdfBuffer] fallo en validación server-side del archivo:", error);
    return {
      success: false,
      errorType: "validation_error",
      message: "No se pudo validar el archivo.",
    };
  }
}
