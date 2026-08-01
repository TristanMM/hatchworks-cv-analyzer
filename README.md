# HatchWorks CV Analyzer

Analizador de CV y Visor de Perfil Reimaginado — reto técnico de HatchWorks AI.

Ver [`context.md`](./context.md), [`architecture.md`](./architecture.md),
[`conventions.md`](./conventions.md), [`testing.md`](./testing.md) y [`agents.md`](./agents.md)
para el detalle de dominio, arquitectura, convenciones de código, requisitos de testing y reglas
para la IA respectivamente.

## Requisitos

- Node.js 20.9+
- npm

## Setup

```bash
npm install
cp .env.example .env.local
# completar ANTHROPIC_API_KEY en .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor de desarrollo (Turbopack).
- `npm run build` — build de producción.
- `npm run start` — servidor de producción (requiere `build` previo).
- `npm run lint` — ESLint.

## Estado actual

Esqueleto inicial del proyecto (Next.js 16, App Router, TypeScript, Tailwind CSS v4). La lógica de
extracción de CVs (`/lib/extraction`) todavía no está implementada.
