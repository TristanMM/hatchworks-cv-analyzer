# conventions.md — Estándares de código

## Estructura de carpetas (Next.js App Router)

```
/app
  /api
    /extract
      route.ts          # API route: recibe el archivo, orquesta el pipeline de extracción
  /page.tsx              # Página principal: upload
  /results
    /page.tsx             # Vista de resultados (o manejado con estado si es una sola página)
  /layout.tsx
/components
  /upload
    FileUploader.tsx
  /results
    ProfileView.tsx
    ExperienceTimeline.tsx
    ConfidenceBadge.tsx
  /ui                     # componentes genéricos reutilizables (botón, spinner, etc.)
/lib
  /extraction
    parsePdf.ts           # extraer texto crudo del PDF
    parseDocx.ts           # extra: extraer texto crudo del DOCX
    extractWithClaude.ts   # llamada a la API de Claude + parseo de la respuesta
    schema.ts              # schema de Zod que valida CVData
  /utils
    fileValidation.ts
/types
  cv.ts                    # tipo CVData compartido (debe coincidir con context.md)
.env.example
agents.md
context.md
conventions.md
testing.md
architecture.md
```

## Nomenclatura

- Componentes de React: `PascalCase.tsx` (ej. `FileUploader.tsx`).
- Funciones y variables: `camelCase`.
- Rutas de páginas y archivos que no son componentes: `kebab-case` cuando aplique.
- Tipos e interfaces: `PascalCase`, sin prefijo `I` (ej. `CVData`, no `ICVData`).

## Manejo de errores

Patrón estándar para cualquier función que pueda fallar (parsing, llamada a la API, validación):

```typescript
try {
  // lógica
} catch (error) {
  console.error("[extractWithClaude] fallo en paso X:", error);
  return { success: false, errorType: "claude_api_error", message: "..." };
}
```

- Nunca lanzar un error genérico sin contexto de en qué paso del pipeline ocurrió.
- Las API routes siempre devuelven un objeto con forma consistente:
  `{ success: boolean, data?: CVData, error?: { type: string, message: string } }`.
- El frontend siempre debe tener un estado visual para cada `errorType` posible, nunca un catch-all
  que muestre una pantalla en blanco.

## Componentes

- Un componente por archivo.
- Props tipadas explícitamente con una `type` o `interface` en el mismo archivo o en `/types` si se
  reutiliza en varios lugares.
- Componentes de presentación (solo UI) separados de componentes con lógica de datos cuando el
  componente crece.

## Commits (Conventional Commits)

Usar siempre este formato, porque el criterio de "calidad de código" del reto evalúa explícitamente
el uso del historial de git:

```
feat: agregar componente de timeline de experiencia
fix: corregir validación de tamaño máximo de archivo
docs: actualizar README con instrucciones de setup
refactor: extraer lógica de parsing a función separada
test: agregar casos límite para CV sin sección de educación
```

Commits pequeños y frecuentes (por tarea completada), no un commit gigante al final del día.
