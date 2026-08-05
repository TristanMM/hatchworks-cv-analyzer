/**
 * CVData type — source of truth defined in context.md.
 * Any change to this schema is an architecture decision and must be confirmed
 * before implementation (see agents.md).
 */
export type CVData = {
  name: string | null;
  summary: string | null; // profile/professional summary paragraph, as it appears in the CV
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
  };
  experience: Array<{
    company: string | null;
    role: string | null;
    startDate: string | null; // free-form as it appears in the CV, e.g. "Ene 2022"
    endDate: string | null; // null or "Presente" if it is the current job
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
  // Confidence metadata — see context.md, section "What 'unreliable field' means"
  confidence: {
    [fieldPath: string]: "high" | "low" | "missing";
  };
};

/**
 * Standard API route response shape (see conventions.md).
 */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: { type: string; message: string } };
