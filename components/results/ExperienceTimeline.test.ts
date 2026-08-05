import { describe, expect, it } from "vitest";
import {
  extractLatestYear,
  getRecencyScore,
} from "@/components/results/ExperienceTimeline";

describe("extractLatestYear", () => {
  it("devuelve null cuando todos los argumentos son null", () => {
    expect(extractLatestYear(null, null)).toBeNull();
  });

  it("extrae un año de un string con formato libre", () => {
    expect(extractLatestYear("Ene 2022")).toBe(2022);
  });

  it("devuelve el año más alto de un rango en un solo string", () => {
    expect(extractLatestYear("2018 — 2022")).toBe(2022);
  });

  it("devuelve el máximo entre varios argumentos", () => {
    expect(extractLatestYear("2015", "2020 — 2023")).toBe(2023);
  });

  it("devuelve null para Presente sin dígitos", () => {
    expect(extractLatestYear("Presente")).toBeNull();
  });
});

describe("getRecencyScore", () => {
  it("devuelve MAX_SAFE_INTEGER cuando endDate es Presente (case-insensitive)", () => {
    expect(getRecencyScore("  PRESENTE  ", "2015")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("prioriza el año de endDate sobre startDate", () => {
    expect(getRecencyScore("2022", "2019")).toBe(2022);
  });

  it("usa startDate cuando endDate es null", () => {
    expect(getRecencyScore(null, "2020")).toBe(2020);
  });

  it("devuelve -1 cuando ambas fechas son null", () => {
    expect(getRecencyScore(null, null)).toBe(-1);
  });

  it("Presente gana sobre un año numérico en startDate", () => {
    expect(getRecencyScore("Presente", "2010")).toBe(Number.MAX_SAFE_INTEGER);
  });
});
