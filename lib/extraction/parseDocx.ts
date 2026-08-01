export type ParseDocxResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

/**
 * Extrae el texto crudo de un DOCX (extra, ver context.md).
 *
 * TODO: implementar con `mammoth` (ver architecture.md).
 */
export async function parseDocx(_file: Buffer): Promise<ParseDocxResult> {
  try {
    throw new Error("parseDocx: pipeline de extracción todavía no implementado");
  } catch (error) {
    console.error("[parseDocx] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "not_implemented",
      message: "El parsing de DOCX todavía no está implementado.",
    };
  }
}
