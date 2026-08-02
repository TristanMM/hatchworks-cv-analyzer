/**
 * Tipo CVData — fuente de verdad definida en context.md.
 * Cualquier cambio a este schema es una decisión de arquitectura y debe
 * confirmarse antes de implementarse (ver agents.md).
 */
export type CVData = {
  name: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
  };
  experience: Array<{
    company: string | null;
    role: string | null;
    startDate: string | null; // formato libre tal como aparece en el CV, ej. "Ene 2022"
    endDate: string | null; // null o "Presente" si es el trabajo actual
    description: string | null;
  }>;
  education: Array<{
    institution: string | null;
    degree: string | null;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
  projects: Array<{
    title: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    technologies: string[];
  }>;
  skills: string[];
  // Metadatos de confianza — ver context.md, sección "Qué significa 'campo no confiable'"
  confidence: {
    [fieldPath: string]: "high" | "low" | "missing";
  };
};

/**
 * Forma estándar de respuesta de las API routes (ver conventions.md).
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };
