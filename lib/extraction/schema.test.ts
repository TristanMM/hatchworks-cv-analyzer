import { describe, expect, it } from "vitest";
import { cvDataSchema } from "@/lib/extraction/schema";
import type { CVData } from "@/types/cv";

const validCV: CVData = {
  name: "Ada Lovelace",
  summary: null,
  contact: {
    email: "ada@example.com",
    phone: null,
    location: "Londres",
    linkedin: null,
  },
  experience: [
    {
      company: "Analytical Engines Inc.",
      role: "Programadora",
      startDate: "Ene 2022",
      endDate: "Presente",
      description: null,
    },
  ],
  education: [],
  projects: [
    {
      title: "Motor analítico",
      startDate: null,
      endDate: null,
      description: "Primer algoritmo publicado",
      technologies: ["Matemáticas"],
    },
  ],
  skills: ["TypeScript", "Zod"],
  confidence: { name: "high", "contact.email": "high", summary: "missing" },
};

describe("cvDataSchema", () => {
  it("acepta un CVData completo y válido", () => {
    const result = cvDataSchema.safeParse(validCV);
    expect(result.success).toBe(true);
  });

  it("rechaza cuando falta una clave requerida en un nivel anidado (contact sin email)", () => {
    const { email, ...contactWithoutEmail } = validCV.contact;
    void email;
    const invalid = { ...validCV, contact: contactWithoutEmail };
    expect(cvDataSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza un tipo incorrecto en un campo (name como número)", () => {
    const invalid = { ...validCV, name: 123 };
    expect(cvDataSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza un valor de confidence fuera del enum permitido", () => {
    const invalid = { ...validCV, confidence: { name: "medium" } };
    expect(cvDataSchema.safeParse(invalid).success).toBe(false);
  });

  it("rechaza cuando falta un campo top-level completo (sin skills)", () => {
    const { skills, ...withoutSkills } = validCV;
    void skills;
    expect(cvDataSchema.safeParse(withoutSkills).success).toBe(false);
  });
});
