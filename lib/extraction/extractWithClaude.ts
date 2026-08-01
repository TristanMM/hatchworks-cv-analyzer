import type { CVData } from "@/types/cv";

export type ExtractWithClaudeResult =
  | { success: true; data: CVData }
  | { success: false; errorType: string; message: string };

/**
 * Envía el texto plano del CV a la API de Claude y estructura la respuesta
 * según `CVData` (ver context.md y architecture.md).
 *
 * TODO: implementar la llamada al SDK de Anthropic (modelo Haiku), el prompt
 * con el schema fijo, y la validación de la respuesta con `cvDataSchema`
 * (ver schema.ts). Debe ejecutarse únicamente desde el servidor: nunca
 * exponer `ANTHROPIC_API_KEY` al cliente (ver agents.md).
 */
export async function extractWithClaude(
  _rawText: string
): Promise<ExtractWithClaudeResult> {
  try {
    throw new Error(
      "extractWithClaude: pipeline de extracción todavía no implementado"
    );
  } catch (error) {
    console.error("[extractWithClaude] fallo en llamada a la API de Claude:", error);
    return {
      success: false,
      errorType: "not_implemented",
      message: "La extracción estructurada todavía no está implementada.",
    };
  }
}
