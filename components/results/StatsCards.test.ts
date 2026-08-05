import { describe, expect, it } from "vitest";
import {
  calculateCompleteness,
  getMostRecentEducationStat,
} from "@/components/results/StatsCards";
import type { CVData } from "@/types/cv";

type EducationEntry = CVData["education"][number];

function makeEducationEntry(
  overrides: Partial<EducationEntry> = {}
): EducationEntry {
  return {
    institution: null,
    degree: null,
    field: null,
    startDate: null,
    endDate: null,
    ...overrides,
  };
}

describe("calculateCompleteness", () => {
  it("devuelve 0 cuando el objeto de confidence está vacío", () => {
    expect(calculateCompleteness({})).toBe(0);
  });

  it("devuelve 100 cuando todos los campos son high", () => {
    expect(
      calculateCompleteness({
        name: "high",
        summary: "high",
        "contact.email": "high",
      })
    ).toBe(100);
  });

  it("calcula el porcentaje redondeado con una mezcla de niveles", () => {
    expect(
      calculateCompleteness({
        name: "high",
        summary: "high",
        "contact.email": "low",
      })
    ).toBe(67);
  });

  it("devuelve 0 cuando ningún campo es high", () => {
    expect(
      calculateCompleteness({
        name: "low",
        summary: "missing",
      })
    ).toBe(0);
  });
});

describe("getMostRecentEducationStat", () => {
  it("devuelve em dash cuando el array está vacío", () => {
    expect(getMostRecentEducationStat([])).toEqual({ value: "—" });
  });

  it("devuelve el degree cuando existe", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({ degree: "Licenciatura en Informática" }),
      ])
    ).toEqual({ value: "Licenciatura en Informática" });
  });

  it("devuelve degree como value y field como caption cuando son distintos", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({
          degree: "Licenciatura",
          field: "Informática",
        }),
      ])
    ).toEqual({ value: "Licenciatura", caption: "Informática" });
  });

  it("devuelve field como value cuando no hay degree", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({ field: "Informática" }),
      ])
    ).toEqual({ value: "Informática" });
  });

  it("elige la entrada con el año más reciente entre varias", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({
          degree: "Antigua",
          endDate: "2015",
        }),
        makeEducationEntry({
          degree: "Reciente",
          endDate: "2022",
        }),
      ])
    ).toEqual({ value: "Reciente" });
  });

  it("usa startDate cuando endDate es Presente sin dígitos", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({
          degree: "En curso",
          endDate: "Presente",
          startDate: "2019",
        }),
        makeEducationEntry({
          degree: "Anterior",
          endDate: "2018",
        }),
      ])
    ).toEqual({ value: "En curso" });
  });

  it("cae al índice 0 cuando ninguna entrada tiene fechas parseables", () => {
    expect(
      getMostRecentEducationStat([
        makeEducationEntry({ degree: "Primera" }),
        makeEducationEntry({ degree: "Segunda" }),
      ])
    ).toEqual({ value: "Primera" });
  });
});
