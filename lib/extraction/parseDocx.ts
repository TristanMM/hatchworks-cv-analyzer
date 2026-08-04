import mammoth from "mammoth";

export type ParseDocxResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

// Heurística: un CV real tiene mucho más texto que esto. Un valor por debajo
// del umbral sugiere un DOCX sin contenido legible (ver testing.md, caso 5).
const MIN_EXTRACTABLE_TEXT_LENGTH = 40;

/**
 * Extrae el texto crudo de un DOCX usando `mammoth.extractRawText`. Si el
 * texto extraído está vacío o es sospechosamente corto, devuelve un error
 * explícito "no_extractable_text" en vez de un string vacío silencioso (ver
 * testing.md, caso límite análogo al PDF escaneado).
 */
export async function parseDocx(file: Buffer): Promise<ParseDocxResult> {
  try {
    const result = await mammoth.extractRawText({ buffer: file });
    const text = result.value.trim();

    if (text.length < MIN_EXTRACTABLE_TEXT_LENGTH) {
      return {
        success: false,
        errorType: "no_extractable_text",
        message: "No se pudo extraer texto legible del DOCX.",
      };
    }

    return { success: true, text };
  } catch (error) {
    console.error("[parseDocx] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "docx_parse_error",
      message: "No se pudo procesar el archivo DOCX.",
    };
  }
}
