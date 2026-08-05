import { afterEach, describe, expect, it, vi } from "vitest";

const { getTextMock, destroyMock } = vi.hoisted(() => ({
  getTextMock: vi.fn(),
  destroyMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("pdf-parse/worker", () => ({}));
vi.mock("pdf-parse", () => ({
  PDFParse: vi.fn().mockImplementation(function () {
    return { getText: getTextMock, destroy: destroyMock };
  }),
}));

import { parsePdf } from "@/lib/extraction/parsePdf";

afterEach(() => {
  vi.clearAllMocks();
});

describe("parsePdf", () => {
  it("devuelve el texto extraído cuando supera el umbral mínimo", async () => {
    getTextMock.mockResolvedValue({ text: `  ${"a".repeat(50)}  ` });

    const result = await parsePdf(Buffer.from("irrelevante"));

    expect(result).toEqual({ success: true, text: "a".repeat(50) });
    expect(destroyMock).toHaveBeenCalledOnce();
  });

  it("devuelve no_extractable_text si el texto está vacío", async () => {
    getTextMock.mockResolvedValue({ text: "" });

    const result = await parsePdf(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "no_extractable_text" });
  });

  it("devuelve no_extractable_text si el texto es más corto que el umbral", async () => {
    getTextMock.mockResolvedValue({ text: "muy corto" });

    const result = await parsePdf(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "no_extractable_text" });
  });

  it("devuelve pdf_parse_error si pdf-parse lanza una excepción", async () => {
    getTextMock.mockRejectedValue(new Error("corrupto"));

    const result = await parsePdf(Buffer.from("irrelevante"));

    expect(result).toMatchObject({ success: false, errorType: "pdf_parse_error" });
    expect(destroyMock).toHaveBeenCalledOnce();
  });
});
