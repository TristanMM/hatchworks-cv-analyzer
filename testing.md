# testing.md — Testing requirements and standards

## Tools

- **Vitest** for unit tests of pure functions (parsing, validation, data transformation).
- **Playwright** for end-to-end tests of the main flow (upload, extraction, download, and editing).
  See `e2e/cv-analyzer.spec.ts`.

## Mandatory edge cases (define "done" for the extraction pipeline)

Extraction logic is not considered finished until it handles the following correctly, without
breaking the UI:

1. Single-page PDF CV, simple format (happy path).
2. Multi-page PDF CV (3+).
3. CV with a two-column layout.
4. CV missing one or more sections (e.g. no education section).
5. CV scanned as an image, with no extractable text layer (must show a clear error, not crash).
6. File that is not a CV or not a valid PDF (must be rejected with a clear message before reaching
   the Claude API, to avoid wasting tokens unnecessarily).
7. CV in Spanish and CV in English (if the bilingual extra is implemented).
8. Claude API response that does not match the expected schema (must be handled with Zod, without
   breaking render).

## Mandatory negative tests

- Upload a file larger than 4 MB (limit aligned with Vercel Functions maximum payload, 4.5 MB) → must
  be rejected before processing.
- Upload a file with a fake `.pdf` extension (content that is not really a PDF) → must be rejected by
  content validation, not extension alone.
- Simulate Claude API failure (timeout or 5xx error) → the UI must show a specific error state, not a
  blank screen or a generic "something went wrong" message.

## Recommended minimum coverage

100% coverage is not the goal (not the focus of the challenge). Prioritize:

- 100% of the edge cases in the list above covered with at least one test.
- Reasonable (not strictly numeric) coverage of `/lib/extraction/*`, which is the core of the 25%
  "data extraction approach" in the evaluation.
- Purely visual components do not need unit test coverage; for those, Playwright end-to-end tests are
  sufficient.
