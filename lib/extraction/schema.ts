import { z } from "zod";
import type { CVData } from "@/types/cv";

/**
 * Schema de Zod que valida `CVData` (ver types/cv.ts y context.md). Es el
 * schema real usado por `extractWithClaude.ts` para validar la respuesta de
 * la API de Claude antes de devolverla al frontend. La anotación
 * `z.ZodType<CVData>` obliga a TypeScript a fallar en tiempo de compilación
 * si este schema deja de coincidir con la fuente de verdad del tipo.
 *
 * La lógica de normalización de confianza (qué campos se marcan como
 * "low"/"missing" y por qué) vive en `extractWithClaude.ts`, no aquí.
 */
export const cvDataSchema: z.ZodType<CVData> = z.object({
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
  projects: z.array(
    z.object({
      title: z.string().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      description: z.string().nullable(),
      technologies: z.array(z.string()),
    })
  ),
  skills: z.array(z.string()),
  confidence: z.record(z.string(), z.enum(["high", "low", "missing"])),
});
