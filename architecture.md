# architecture.md — System architecture

## Summary

Next.js (TypeScript, App Router) full-stack deployed on Vercel. Hybrid extraction: PDF/DOCX text
parsing + Claude API (Haiku model) to structure fields into JSON, validated with Zod. No database for
the main flow. Download via native browser print (PDF) and `html2canvas` (PNG).

## Flow diagram

```mermaid
flowchart TD
    A[User: uploads CV PDF/DOCX] --> B[Next.js Frontend<br/>Upload component]
    B --> C[API Route: /api/extract]
    C --> D{Validation<br/>file type/size}
    D -->|Invalid| E[Error 400<br/>clear message to user]
    D -->|Valid| F[Text parser<br/>pdf-parse / mammoth for DOCX]
    F --> G{Was text extracted?}
    G -->|No / empty<br/>possible scan| H[Controlled error<br/>alternate UI state]
    G -->|Yes| I[Prompt to Claude API<br/>structured JSON output]
    I --> J{JSON validation<br/>with Zod}
    J -->|Missing fields| K[Mark field as<br/>unreliable, do not fail]
    J -->|OK| L[Structured response<br/>to frontend]
    K --> L
    L --> M[Results view<br/>new React design]
    M --> N[Download button]
    N --> O[window.print + CSS<br/>for PDF]
    N --> P[html2canvas<br/>for PNG - extra]

    style E fill:#fee2e2
    style H fill:#fee2e2
    style K fill:#fef3c7
```

## Components by layer

- **Frontend**: Next.js App Router + TypeScript + Tailwind. Upload component with drag & drop, loading
  states, results view, per-field error states.
- **Backend**: Next.js API Routes (serverless functions on Vercel), not a separate service.
- **Extraction**: pipeline in `/lib/extraction` — text parsing → prompt to Claude with fixed schema
  → validation with Zod → per-field confidence normalization.
- **Database**: none for the MVP. Fully stateless flow.
- **Authentication**: none (out of scope for the challenge).
- **Download**: `window.print()` with dedicated `@media print` stylesheet (PDF, native, no heavy
  dependencies); client-side `html2canvas` for PNG (extra).
- **Error handling**: try/catch at each pipeline step, with a specific `errorType` returned to the
  frontend (see `conventions.md`).
- **Logging**: `console.error` with step context; Vercel captures function logs automatically. No
  external observability tool (out of scope for this project).
- **Environment variables**: `ANTHROPIC_API_KEY` in Vercel dashboard + `.env.local` in development +
  versioned `.env.example` (never with real values).
- **Security**: MIME type and file size validation before processing; API key never exposed to the
  client; sanitization of extracted text before inserting it into the DOM.

## Why these decisions (for the README)

- **Next.js full-stack instead of separate frontend/backend**: single repo, single deploy, eliminates
  CORS and reduces the risk of "works on my machine but not in production".
- **Hybrid extraction (parser + LLM) instead of regex-only or LLM-only**: the parser gives text
  cheaply and deterministically; the LLM solves the real problem — structuring free-form, variable
  text across different CV formats — without writing hundreds of fragile regex rules.
- **No Puppeteer for download**: it is heavy and slow on free serverless functions, and is the piece
  most likely to break in production. `window.print()` + CSS is native and reliable.
