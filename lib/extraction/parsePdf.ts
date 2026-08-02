// Debe importarse antes de "pdf-parse": registra el worker real de pdf.js en
// globalThis para que el fallback interno de pdf.js no intente resolver
// "./pdf.worker.mjs" con una ruta relativa rota tras el bundling de Next.js
// (ver troubleshooting.md de pdf-parse, secciones 3 y 4).
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

export type ParsePdfResult =
  | { success: true; text: string }
  | { success: false; errorType: string; message: string };

// Heurística: un CV real tiene mucho más texto que esto. Un valor por debajo
// del umbral sugiere un PDF escaneado sin capa de texto (ver testing.md, caso 5).
const MIN_EXTRACTABLE_TEXT_LENGTH = 40;

/**
 * Extrae el texto crudo de un PDF usando `pdf-parse` (API v2, basada en la
 * clase `PDFParse`). Si el texto extraído está vacío o es sospechosamente
 * corto, devuelve un error explícito "no_extractable_text" en vez de un
 * string vacío silencioso (ver testing.md, caso límite 5: PDF escaneado).
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
          "No se pudo extraer texto legible del PDF. Es posible que sea un documento escaneado sin capa de texto.",
      };
    }

    return { success: true, text };
  } catch (error) {
    console.error("[parsePdf] fallo en paso de parsing:", error);
    return {
      success: false,
      errorType: "pdf_parse_error",
      message: "No se pudo procesar el archivo PDF.",
    };
  } finally {
    await parser?.destroy();
  }
}
