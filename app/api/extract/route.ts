import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, CVData } from "@/types/cv";
import { validateFileBuffer, detectFileFormat } from "@/lib/utils/fileValidation";
import { parsePdf } from "@/lib/extraction/parsePdf";
import { parseDocx } from "@/lib/extraction/parseDocx";
import { extractWithClaude } from "@/lib/extraction/extractWithClaude";

const ERROR_STATUS: Record<string, number> = {
  missing_file: 400,
  invalid_form_data: 400,
  file_too_large: 400,
  invalid_file_signature: 400,
  validation_error: 400,
  no_extractable_text: 422,
  pdf_parse_error: 422,
  docx_parse_error: 422,
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
 * API route: receives the uploaded file and orchestrates the extraction pipeline
 * (see architecture.md): server-side validation -> PDF/DOCX parsing -> Claude.
 * Each step returns its own errorType (see conventions.md); nothing is left
 * uncaught (outer try/catch with "unexpected_error" as final fallback).
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
      return errorResponse("invalid_form_data", "Could not read the uploaded file.");
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return errorResponse("missing_file", "No file was received.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validation = validateFileBuffer(buffer);
    if (!validation.success) {
      return errorResponse(validation.errorType, validation.message);
    }

    const format = detectFileFormat(buffer, file.name);
    const parsed =
      format === "pdf" ? await parsePdf(buffer) : await parseDocx(buffer);
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
      "An unexpected error occurred while processing the file."
    );
  }
}
