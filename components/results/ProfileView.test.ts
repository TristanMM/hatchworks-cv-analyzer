import { describe, expect, it } from "vitest";
import { buildTagline, getInitials } from "@/components/results/ProfileView";
import type { CVData } from "@/types/cv";

function makeCVData(overrides: Partial<CVData> = {}): CVData {
  return {
    name: null,
    summary: null,
    contact: {
      email: null,
      phone: null,
      location: null,
      linkedin: null,
    },
    experience: [],
    education: [],
    projects: [],
    skills: [],
    confidence: {},
    ...overrides,
  };
}

describe("getInitials", () => {
  it("devuelve las dos primeras letras en mayúsculas para un nombre de una palabra", () => {
    expect(getInitials("Ada")).toBe("AD");
  });

  it("devuelve la inicial de las dos primeras palabras para nombres compuestos", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("ignora espacios extra al inicio y al final", () => {
    expect(getInitials("  Ada   Lovelace  ")).toBe("AL");
  });

  it("devuelve cadena vacía para string vacío o solo espacios", () => {
    expect(getInitials("")).toBe("");
    expect(getInitials("   ")).toBe("");
  });

  it("devuelve una sola letra cuando la palabra tiene un carácter", () => {
    expect(getInitials("X")).toBe("X");
  });
});

describe("buildTagline", () => {
  it("prioriza summary trimmed sobre skills y experiencia", () => {
    const data = makeCVData({
      summary: "  Ingeniera de software  ",
      skills: ["TypeScript", "React", "Node.js"],
      experience: [
        {
          company: "Acme",
          role: "Dev",
          startDate: "2020",
          endDate: "Presente",
          description: null,
        },
      ],
    });

    expect(buildTagline(data)).toBe("Ingeniera de software");
  });

  it("une hasta 4 skills cuando hay al menos 3 y no hay summary", () => {
    const data = makeCVData({
      skills: ["TypeScript", "React", "Node.js", "Zod", "Vitest"],
    });

    expect(buildTagline(data)).toBe("TypeScript · React · Node.js · Zod");
  });

  it("combina skills y título reciente cuando hay menos de 3 skills", () => {
    const data = makeCVData({
      skills: ["TypeScript", "React"],
      experience: [
        {
          company: "Acme Corp",
          role: "Senior Dev",
          startDate: "2020",
          endDate: "2022",
          description: null,
        },
      ],
    });

    expect(buildTagline(data)).toBe("TypeScript · React · Senior Dev en Acme Corp");
  });

  it("devuelve solo skills cuando no hay experiencia ni proyectos recientes", () => {
    const data = makeCVData({
      skills: ["TypeScript", "React"],
    });

    expect(buildTagline(data)).toBe("TypeScript · React");
  });

  it("devuelve null cuando no hay summary, skills ni experiencia/proyectos", () => {
    expect(buildTagline(makeCVData())).toBeNull();
  });

  it("elige experiencia con endDate Presente como título reciente", () => {
    const data = makeCVData({
      skills: ["TypeScript"],
      experience: [
        {
          company: "Old Co",
          role: "Junior",
          startDate: "2015",
          endDate: "2018",
          description: null,
        },
        {
          company: "Current Co",
          role: "Lead",
          startDate: "2020",
          endDate: "Presente",
          description: null,
        },
      ],
    });

    expect(buildTagline(data)).toBe("TypeScript · Lead en Current Co");
  });
});
