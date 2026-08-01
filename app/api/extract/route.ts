import { NextResponse } from "next/server";
import type { ApiResult } from "@/types/cv";
import type { CVData } from "@/types/cv";

/**
 * API route: recibe el archivo subido y orquesta el pipeline de extracción
 * (ver architecture.md). Todavía no implementada: valida, parsea texto y
 * llama a Claude vía /lib/extraction.
 */
export async function POST(): Promise<NextResponse<ApiResult<CVData>>> {
  try {
    throw new Error("/api/extract: pipeline todavía no implementado");
  } catch (error) {
    console.error("[api/extract] fallo en paso X:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          type: "not_implemented",
          message: "El endpoint de extracción todavía no está implementado.",
        },
      },
      { status: 501 }
    );
  }
}
