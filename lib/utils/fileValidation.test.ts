import { describe, expect, it } from "vitest";
import {
  MAX_FILE_SIZE_BYTES,
  detectFileFormat,
  validateFile,
  validateFileBuffer,
} from "@/lib/utils/fileValidation";

const PDF_MAGIC = Buffer.from("%PDF-1.4\n");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

describe("validateFile", () => {
  it("acepta un PDF válido", () => {
    const file = new File([PDF_MAGIC], "cv.pdf", { type: "application/pdf" });
    expect(validateFile(file)).toEqual({ success: true });
  });

  it("acepta un DOCX válido con el MIME type oficial de Word", () => {
    const file = new File([ZIP_MAGIC], "cv.docx", { type: DOCX_MIME_TYPE });
    expect(validateFile(file)).toEqual({ success: true });
  });

  it("acepta un DOCX válido con el MIME type application/zip", () => {
    const file = new File([ZIP_MAGIC], "cv.docx", { type: "application/zip" });
    expect(validateFile(file)).toEqual({ success: true });
  });

  it("rechaza una extensión/MIME no aceptados", () => {
    const file = new File(["contenido"], "cv.txt", { type: "text/plain" });
    const result = validateFile(file);
    expect(result).toMatchObject({ success: false, errorType: "invalid_file_type" });
  });

  it("rechaza un archivo demasiado grande", () => {
    const oversized = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
    const file = new File([oversized], "cv.pdf", { type: "application/pdf" });
    const result = validateFile(file);
    expect(result).toMatchObject({ success: false, errorType: "file_too_large" });
  });

  it("acepta un archivo cuyo tamaño es exactamente el límite máximo", () => {
    const atLimit = new Uint8Array(MAX_FILE_SIZE_BYTES);
    const file = new File([atLimit], "cv.pdf", { type: "application/pdf" });
    expect(validateFile(file)).toEqual({ success: true });
  });
});

describe("validateFileBuffer", () => {
  it("acepta un buffer con firma de PDF (%PDF)", () => {
    expect(validateFileBuffer(PDF_MAGIC)).toEqual({ success: true });
  });

  it("acepta un buffer con firma de ZIP (PK\\x03\\x04)", () => {
    expect(validateFileBuffer(ZIP_MAGIC)).toEqual({ success: true });
  });

  it("rechaza un buffer sin ninguna firma válida", () => {
    const result = validateFileBuffer(Buffer.from("no soy un pdf ni un zip"));
    expect(result).toMatchObject({ success: false, errorType: "invalid_file_signature" });
  });

  it("rechaza un buffer que supera el tamaño máximo, incluso con firma válida", () => {
    const oversized = Buffer.concat([PDF_MAGIC, Buffer.alloc(MAX_FILE_SIZE_BYTES)]);
    const result = validateFileBuffer(oversized);
    expect(result).toMatchObject({ success: false, errorType: "file_too_large" });
  });
});

describe("detectFileFormat", () => {
  it("detecta 'pdf' por firma %PDF sin importar el nombre del archivo", () => {
    expect(detectFileFormat(PDF_MAGIC, "cv.docx")).toBe("pdf");
  });

  it("detecta 'docx' por firma ZIP sin importar el nombre del archivo", () => {
    expect(detectFileFormat(ZIP_MAGIC, "cv.pdf")).toBe("docx");
  });

  it("cae al nombre de archivo cuando no hay firma reconocible (.docx)", () => {
    const noSignature = Buffer.from("contenido sin firma reconocible");
    expect(detectFileFormat(noSignature, "cv.docx")).toBe("docx");
  });

  it("por defecto asume 'pdf' cuando no hay firma ni extensión .docx", () => {
    const noSignature = Buffer.from("contenido sin firma reconocible");
    expect(detectFileFormat(noSignature, "cv.pdf")).toBe("pdf");
  });
});
