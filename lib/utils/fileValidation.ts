export type FileValidationResult =
  | { success: true }
  | { success: false; errorType: string; message: string };

const ACCEPTED_EXTENSION = ".pdf";
const ACCEPTED_MIME_TYPE = "application/pdf";

/**
 * Valida tipo MIME y extensión del archivo en el cliente (chequeo básico,
 * para feedback inmediato en el uploader). La validación de contenido real
 * (magic bytes) y el límite de tamaño máximo se hacen server-side en
 * /api/extract (ver agents.md y testing.md) — todavía no implementado.
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
