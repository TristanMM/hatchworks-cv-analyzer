import { z } from "zod";
import type { CVData } from "@/types/cv";

/**
 * Zod schema that validates `CVData` (see types/cv.ts and context.md). It is
 * the actual schema used by `extractWithClaude.ts` to validate the Claude API
 * response before returning it to the frontend. The `z.ZodType<CVData>`
 * annotation forces TypeScript to fail at compile time if this schema stops
 * matching the type's source of truth.
 *
 * Confidence normalization logic (which fields are marked as "low"/"missing"
 * and why) lives in `extractWithClaude.ts`, not here.
 */
export const cvDataSchema: z.ZodType<CVData> = z.object({
  name: z.string().nullable(),
  summary: z.string().nullable(),
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
