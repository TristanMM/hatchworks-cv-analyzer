# conventions.md — Code standards

## Folder structure (Next.js App Router)

```
/app
  /api
    /extract
      route.ts          # API route: receives the file, orchestrates the extraction pipeline
  /page.tsx              # Main page: upload
  /results
    /page.tsx             # Results view (or handled with state if it is a single page)
  /layout.tsx
/components
  /upload
    FileUploader.tsx
  /results
    ProfileView.tsx
    ExperienceTimeline.tsx
    ConfidenceBadge.tsx
  /ui                     # generic reusable components (button, spinner, etc.)
/lib
  /extraction
    parsePdf.ts           # extract raw text from PDF
    parseDocx.ts           # extra: extract raw text from DOCX
    extractWithClaude.ts   # Claude API call + response parsing
    schema.ts              # Zod schema that validates CVData
  /utils
    fileValidation.ts
/types
  cv.ts                    # shared CVData type (must match context.md)
.env.example
agents.md
context.md
conventions.md
testing.md
architecture.md
```

## Naming

- React components: `PascalCase.tsx` (e.g. `FileUploader.tsx`).
- Functions and variables: `camelCase`.
- Page routes and files that are not components: `kebab-case` when applicable.
- Types and interfaces: `PascalCase`, no `I` prefix (e.g. `CVData`, not `ICVData`).

## Error handling

Standard pattern for any function that may fail (parsing, API call, validation):

```typescript
try {
  // logic
} catch (error) {
  console.error("[extractWithClaude] failed at step X:", error);
  return { success: false, errorType: "claude_api_error", message: "..." };
}
```

- Never throw a generic error without context about which pipeline step failed.
- API routes always return an object with a consistent shape:
  `{ success: boolean, data?: CVData, error?: { type: string, message: string } }`.
- The frontend must always have a visual state for each possible `errorType`, never a catch-all that
  shows a blank screen.

## Components

- One component per file.
- Props explicitly typed with a `type` or `interface` in the same file or in `/types` if reused in
  multiple places.
- Presentation components (UI only) separated from components with data logic when the component
  grows.

## Commits (Conventional Commits)

Always use this format, because the challenge's "code quality" criterion explicitly evaluates git
history usage:

```
feat: add experience timeline component
fix: correct maximum file size validation
docs: update README with setup instructions
refactor: extract parsing logic to separate function
test: add edge cases for CV without education section
```

Small, frequent commits (per completed task), not one giant commit at the end of the day.
