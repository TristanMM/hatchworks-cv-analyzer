export type ParsePdfResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

/**
 * Extrae el texto crudo de un PDF.
 *
 * TODO: implementar con `pdf-parse` (ver architecture.md). Debe manejar el
 * caso de PDF escaneado sin capa de texto (ver testing.md, caso límite 5).
 */
export async function parsePdf(_file: Buffer): Promise<ParsePdfResult> {
  try {
    throw new Error("parsePdf: pipeline de extracción todavía no implementado");
  } catch (error) {
    console.error("[parsePdf] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "not_implemented",
      message: "El parsing de PDF todavía no está implementado.",
    };
  }
}
