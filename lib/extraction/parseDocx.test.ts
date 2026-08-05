import { afterEach, describe, expect, it, vi } from "vitest";

const { extractRawTextMock } = vi.hoisted(() => ({
  extractRawTextMock: vi.fn(),
}));

vi.mock("mammoth", () => ({
  default: { extractRawText: extractRawTextMock },
}));

import { parseDocx } from "@/lib/extraction/parseDocx";

afterEach(() => {
  vi.clearAllMocks();
});

describe("parseDocx", () => {
  it("devuelve el texto extraído cuando supera el umbral mínimo", async () => {
    extractRawTextMock.mockResolvedValue({ value: `  ${"b".repeat(50)}  ` });

    const result = await parseDocx(Buffer.from("irrelevante"));

    expect(result).toEqual({ success: true, text: "b".repeat(50) });
  });

  it("devuelve no_extractable_text si el texto está vacío", async () => {
    extractRawTextMock.mockResolvedValue({ value: "" });

    const result = await parseDocx(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "no_extractable_text" });
  });

  it("devuelve no_extractable_text si el texto es más corto que el umbral", async () => {
    extractRawTextMock.mockResolvedValue({ value: "corto" });

    const result = await parseDocx(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "no_extractable_text" });
  });

  it("devuelve docx_parse_error si mammoth lanza una excepción", async () => {
    extractRawTextMock.mockRejectedValue(new Error("zip corrupto"));

    const result = await parseDocx(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "docx_parse_error" });
  });
});
