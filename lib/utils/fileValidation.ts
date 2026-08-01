export type FileValidationResult =
  | { success: true }
  | { success: false; errorType: string; message: string };

/**
 * Valida tipo MIME, extensión y tamaño máximo del archivo subido, antes de
 * procesarlo (ver agents.md: nunca confiar solo en la extensión del nombre).
 *
 * TODO: implementar validación real (tipo MIME/contenido, tamaño máximo en
 * MB — ver testing.md).
 */
export function validateFile(_file: File): FileValidationResult {
  try {
    throw new Error("validateFile: validación todavía no implementada");
  } catch (error) {
    console.error("[validateFile] fallo en validación de archivo:", error);
    return {
      success: false,
      errorType: "not_implemented",
      message: "La validación de archivos todavía no está implementada.",
    };
  }
}
