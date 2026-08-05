# agents.md — Rules and limits for AI

This file defines what Cursor (or any AI agent) CAN and CANNOT do when working in this repository.
It is the first file the AI should read before generating any code.

## Security (non-negotiable)

- **Never** expose `ANTHROPIC_API_KEY` (or any other credential) in code that runs on the client
  (components with `"use client"`, code in `/app` that is not an API Route). All calls to the
  Anthropic API must go through a server API Route that acts as a proxy.
- **Never** commit `.env.local` or any file with real secrets. Only `.env.example` with empty keys or
  placeholders (`ANTHROPIC_API_KEY=your_key_here`).
- **Always** validate and sanitize the file uploaded by the user (MIME type, extension, maximum size)
  before processing it. Never trust the file name extension alone.
- **Never** log the full content of a CV or the model's raw response in production (it may contain
  sensitive personal data). Log only metadata (file size, pipeline step, error type).

## Forbidden patterns

- Do not use `any` in TypeScript without a `// any because: <reason>` comment justifying why it
  could not be typed.
- Do not leave debug `console.log` in code pushed to `main`.
- Do not use empty or silent `catch (e) {}`. Every catch must log the error with context and return a
  manageable state to the user.
- Do not use inline styles when an equivalent Tailwind class already exists.
- Do not create components longer than ~200 lines; if a component grows beyond that, it is a sign it
  should be split.

## How the AI should behave (GenDD Execution Loop)

- Before generating code for a new or non-trivial task, the AI must **propose a short plan** (which
  files it will touch or create, which approach it will follow) and wait for explicit confirmation
  before executing.
- For decisions that affect architecture (changing library, changing the data schema, changing the
  extraction approach), the AI must explicitly flag that it is an architecture decision and ask for
  confirmation, not decide on its own.
- Prefer small, single-responsibility functions over long functions that do several things.
- Prefer explicit types over implicit inference in public interfaces (component props, exported
  function return types).

## Project scope (to avoid scope creep)

- This is a one-week project for a technical challenge. Do not add authentication, database, admin
  panels, or any functionality not in `context.md` or the agreed roadmap without confirming first.
