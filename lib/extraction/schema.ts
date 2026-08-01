import { z } from "zod";

/**
 * Schema de Zod que espeja el tipo `CVData` (ver types/cv.ts y context.md).
 * Es un mapeo mecánico del schema ya fijado como fuente de verdad; la lógica
 * de extracción/normalización de confianza todavía no está implementada.
 */
export const cvDataSchema = z.object({
  name: z.string().nullable(),
  contact: z.object({
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    linkedin: z.string().nullable(),
  }),
  experience: z.array(
    z.object({
      company: z.string().nullable(),
      role: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      description: z.string().nullable(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string().nullable(),
      degree: z.string().nullable(),
      field: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    })
  ),
  skills: z.array(z.string()),
  confidence: z.record(z.string(), z.enum(["high", "low", "missing"])),
});
