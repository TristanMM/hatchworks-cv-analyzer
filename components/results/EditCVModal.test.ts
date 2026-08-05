import { describe, expect, it } from "vitest";
import { promoteConfidence } from "@/components/results/EditCVModal";
import type { CVData } from "@/types/cv";

function makeCVData(overrides: Partial<CVData> = {}): CVData {
  return {
    name: "Ada Lovelace",
    summary: null,
    contact: {
      email: "ada@example.com",
      phone: null,
      location: null,
      linkedin: null,
    },
    experience: [],
    education: [],
    projects: [],
    skills: ["TypeScript"],
    confidence: {
      name: "low",
      "contact.email": "missing",
      experience: "low",
      skills: "missing",
    },
    ...overrides,
  };
}

describe("promoteConfidence", () => {
  it("promueve un campo escalar de low a high cuando cambió", () => {
    const original = makeCVData();
    const edited = makeCVData({ name: "Ada L." });

    expect(promoteConfidence(original, edited).name).toBe("high");
  });

  it("promueve un campo escalar de missing a high cuando cambió", () => {
    const original = makeCVData();
    const edited = makeCVData({
      contact: { ...original.contact, email: "new@example.com" },
    });

    expect(promoteConfidence(original, edited)["contact.email"]).toBe("high");
  });

  it("conserva low cuando el campo escalar no cambió", () => {
    const original = makeCVData();
    const edited = makeCVData({ summary: "Nuevo resumen" });

    expect(promoteConfidence(original, edited).name).toBe("low");
  });

  it("no degrada un campo que ya estaba en high aunque cambie", () => {
    const original = makeCVData({
      confidence: { name: "high", "contact.email": "high" },
    });
    const edited = makeCVData({ name: "Otro nombre" });

    expect(promoteConfidence(original, edited).name).toBe("high");
  });

  it("promueve experience de low a high cuando la sección cambió", () => {
    const original = makeCVData();
    const edited = makeCVData({
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

    expect(promoteConfidence(original, edited).experience).toBe("high");
  });

  it("promueve skills de missing a high cuando la sección cambió", () => {
    const original = makeCVData();
    const edited = makeCVData({ skills: ["TypeScript", "React"] });

    expect(promoteConfidence(original, edited).skills).toBe("high");
  });

  it("no degrada una sección que ya estaba en high aunque cambie", () => {
    const original = makeCVData({
      confidence: { experience: "high", skills: "high" },
    });
    const edited = makeCVData({
      experience: [
        {
          company: "New Co",
          role: "Lead",
          startDate: "2022",
          endDate: null,
          description: null,
        },
      ],
      skills: ["Go"],
    });

    const confidence = promoteConfidence(original, edited);
    expect(confidence.experience).toBe("high");
    expect(confidence.skills).toBe("high");
  });

  it("no modifica confidence de campos no editados", () => {
    const confidenceBase = {
      name: "low" as const,
      "contact.email": "missing" as const,
      "contact.phone": "low" as const,
    };
    const original = makeCVData({ confidence: confidenceBase });
    const edited = makeCVData({
      name: "Nuevo nombre",
      confidence: { ...confidenceBase },
    });

    const confidence = promoteConfidence(original, edited);
    expect(confidence.name).toBe("high");
    expect(confidence["contact.email"]).toBe("missing");
    expect(confidence["contact.phone"]).toBe("low");
  });
});
