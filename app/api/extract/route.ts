import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, CVData } from "@/types/cv";
import { validatePdfBuffer } from "@/lib/utils/fileValidation";
import { parsePdf } from "@/lib/extraction/parsePdf";
import { extractWithClaude } from "@/lib/extraction/extractWithClaude";

const ERROR_STATUS: Record<string, number> = {
  missing_file: 400,
  invalid_form_data: 400,
  file_too_large: 400,
  invalid_pdf_signature: 400,
  validation_error: 400,
  no_extractable_text: 422,
  pdf_parse_error: 422,
  missing_api_key: 500,
  claude_api_error: 502,
  invalid_claude_response: 502,
};

function errorResponse(
  errorType: string,
  message: string
): NextResponse<ApiResult<CVData>> {
  return NextResponse.json(
    { success: false, error: { type: errorType, message } },
    { status: ERROR_STATUS[errorType] ?? 500 }
  );
}

/**
 * API route: recibe el archivo subido y orquesta el pipeline de extracción
 * (ver architecture.md): validación server-side -> parsing de PDF -> Claude.
 * Cada paso devuelve su propio errorType (ver conventions.md); nada se deja
 * sin capturar (try/catch externo con "unexpected_error" como red final).
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResult<CVData>>> {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error("[api/extract] fallo al leer el form-data:", error);
      return errorResponse("invalid_form_data", "No se pudo leer el archivo enviado.");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("missing_file", "No se recibió ningún archivo.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validatePdfBuffer(buffer);
    if (!validation.success) {
      return errorResponse(validation.errorType, validation.message);
    }

    const parsed = await parsePdf(buffer);
    if (!parsed.success) {
      return errorResponse(parsed.errorType, parsed.message);
    }

    const extracted = await extractWithClaude(parsed.text);
    if (!extracted.success) {
      return errorResponse(extracted.errorType, extracted.message);
    }

    return NextResponse.json({ success: true, data: extracted.data });
  } catch (error) {
    console.error("[api/extract] fallo inesperado en el pipeline:", error);
    return errorResponse(
      "unexpected_error",
      "Ocurrió un error inesperado al procesar el archivo."
    );
  }
}
