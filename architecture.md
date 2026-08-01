# architecture.md — Arquitectura del sistema

## Resumen

Next.js (TypeScript, App Router) full-stack desplegado en Vercel. Extracción híbrida: parsing de
texto del PDF/DOCX + API de Claude (modelo Haiku) para estructurar los campos en JSON, validado con
Zod. Sin base de datos para el flujo principal. Descarga vía impresión nativa del navegador (PDF) y
`html2canvas` (PNG).

## Diagrama de flujo

```mermaid
flowchart TD
    A[Usuario: sube CV PDF/DOCX] --> B[Frontend Next.js<br/>Componente de upload]
    B --> C[API Route: /api/extract]
    C --> D{Validación<br/>tipo/tamaño archivo}
    D -->|Inválido| E[Error 400<br/>mensaje claro al usuario]
    D -->|Válido| F[Parser de texto<br/>pdf-parse / mammoth para DOCX]
    F --> G{¿Se extrajo texto?}
    G -->|No / vacío<br/>posible escaneo| H[Error controlado<br/>estado alternativo en UI]
    G -->|Sí| I[Prompt a Claude API<br/>salida JSON estructurada]
    I --> J{Validación del JSON<br/>con Zod}
    J -->|Campos faltantes| K[Marcar campo como<br/>no confiable, no fallar]
    J -->|OK| L[Respuesta estructurada<br/>al frontend]
    K --> L
    L --> M[Vista de resultados<br/>nuevo diseño React]
    M --> N[Botón Descargar]
    N --> O[window.print + CSS<br/>para PDF]
    N --> P[html2canvas<br/>para PNG - extra]

    style E fill:#fee2e2
    style H fill:#fee2e2
    style K fill:#fef3c7
```

## Componentes por capa

- **Frontend**: Next.js App Router + TypeScript + Tailwind. Componente de upload con drag & drop,
  estados de carga, vista de resultados, estados de error por campo.
- **Backend**: API Routes de Next.js (funciones serverless en Vercel), no un servicio separado.
- **Extracción**: pipeline en `/lib/extraction` — parsing de texto → prompt a Claude con schema fijo
  → validación con Zod → normalización de confianza por campo.
- **Base de datos**: ninguna para el MVP. Flujo completamente stateless.
- **Autenticación**: ninguna (fuera de alcance del reto).
- **Descarga**: `window.print()` con hoja de estilos `@media print` dedicada (PDF, nativo, sin
  dependencias pesadas); `html2canvas` en cliente para PNG (extra).
- **Manejo de errores**: try/catch en cada paso del pipeline, con `errorType` específico devuelto al
  frontend (ver `conventions.md`).
- **Logging**: `console.error` con contexto de paso; Vercel captura logs de función automáticamente.
  Sin herramienta de observabilidad externa (fuera de alcance para este proyecto).
- **Variables de entorno**: `ANTHROPIC_API_KEY` en Vercel dashboard + `.env.local` en desarrollo +
  `.env.example` versionado (nunca con valores reales).
- **Seguridad**: validación de tipo MIME y tamaño de archivo antes de procesar; API key nunca
  expuesta al cliente; sanitización de texto extraído antes de insertarlo en el DOM.

## Por qué estas decisiones (para el README)

- **Next.js full-stack en vez de frontend/backend separados**: un solo repo, un solo deploy, elimina
  CORS y reduce el riesgo de "funciona en mi máquina pero no en producción".
- **Extracción híbrida (parser + LLM) en vez de solo regex o solo LLM**: el parser da el texto de
  forma barata y determinística; el LLM resuelve el problema real — estructurar texto libre y
  variable en formatos de CV distintos — sin escribir cientos de reglas regex frágiles.
- **Sin Puppeteer para la descarga**: es pesado y lento en funciones serverless gratuitas, y es la
  pieza con mayor probabilidad de romperse en producción. `window.print()` + CSS es nativo y
  confiable.
