# context.md — Domain knowledge

## What this project is

CV Analyzer and Reimagined Profile Viewer, a HatchWorks AI technical challenge for the internship
program. A user uploads a CV (PDF required, DOCX as extra), the app extracts structured information,
and presents it in a new visual design (not a reformat of the original document), with a download
option.

## Data schema (source of truth)

This is the exact schema the extraction pipeline must return. Any change to this schema is an
architecture decision and must be confirmed before implementation.

```typescript
type CVData = {
  name: string | null;
  summary: string | null;
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
    endDate: string | null;   // null or "Presente" if it is the current job
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
  // Confidence metadata — see next section
  confidence: {
    [fieldPath: string]: "high" | "low" | "missing";
  };
};
```

## What "unreliable field" means

The challenge explicitly does NOT evaluate 100% extraction accuracy. A field is marked as `"low"` or
`"missing"` in `confidence` when:

- The model did not find that data in the text extracted from the PDF (`"missing"`).
- The data exists but the format is ambiguous or inconsistent with the rest of the document (`"low"`),
  for example a date that could not be interpreted with certainty.

The UI must visually show these cases (e.g. a warning icon or a distinct style) instead of showing
the field empty without explanation, or instead of inventing a value.

## Glossary

- **CV / résumé**: the document the user uploads.
- **Parsing**: extracting plain text from a PDF/DOCX file, without interpreting its meaning yet.
- **Structured extraction**: taking the plain text and converting it into the `CVData` schema above,
  using the Claude API with JSON output.
- **Confidence indicator**: visual signal in the UI that tells the user how reliable an extracted
  datum is (see `confidence` above). It is one of the extra points of the challenge.
- **Redesign**: the results view, which must look and feel like an intentional design distinct from
  the original CV (e.g. dashboard, timeline, portfolio card), not a reformat.

## Out of scope (explicitly, per the challenge PDF)

- Pixel-perfect design is not evaluated.
- 100% extraction accuracy across all possible CV formats is not evaluated.
- User authentication is not needed.
- Database persistence is not needed for the main flow (see `architecture.md`).
