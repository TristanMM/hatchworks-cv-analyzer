# context.md — Conocimiento de dominio

## Qué es este proyecto

Analizador de CV y Visor de Perfil Reimaginado, reto técnico de HatchWorks AI para el programa de
pasantías. Un usuario sube un CV (PDF obligatorio, DOCX como extra), la app extrae información
estructurada, y la presenta en un diseño visual nuevo (no un reformateo del documento original), con
opción de descarga.

## Schema de datos (fuente de verdad)

Este es el schema exacto que debe devolver el pipeline de extracción. Cualquier cambio a este schema
es una decisión de arquitectura y debe confirmarse antes de implementarse.

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
    startDate: string | null; // formato libre tal como aparece en el CV, ej. "Ene 2022"
    endDate: string | null;   // null o "Presente" si es el trabajo actual
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
  // Metadatos de confianza — ver sección siguiente
  confidence: {
    [fieldPath: string]: "high" | "low" | "missing";
  };
};
```

## Qué significa "campo no confiable"

El reto explícitamente NO evalúa 100% de precisión en extracción. Un campo se marca como `"low"` o
`"missing"` en `confidence` cuando:

- El modelo no encontró ese dato en el texto extraído del PDF (`"missing"`).
- El dato existe pero el formato es ambiguo o inconsistente con el resto del documento (`"low"`),
  por ejemplo una fecha que no se pudo interpretar con certeza.

La UI debe mostrar visualmente estos casos (ej. un ícono de advertencia o un estilo distinto) en vez
de mostrar el campo vacío sin explicación, o en vez de inventar un valor.

## Glosario

- **CV / currículum**: el documento que sube el usuario.
- **Parsing**: extraer el texto plano de un archivo PDF/DOCX, sin interpretar su significado todavía.
- **Extracción estructurada**: tomar el texto plano y convertirlo en el schema `CVData` de arriba,
  usando la API de Claude con salida en JSON.
- **Indicador de confianza**: señal visual en la UI que le dice al usuario qué tan confiable es un
  dato extraído (ver `confidence` arriba). Es uno de los puntos extra del reto.
- **Rediseño**: la vista de resultados, que debe verse y sentirse como un diseño intencional distinto
  al CV original (ej. dashboard, timeline, tarjeta de portafolio), no un reformateo.

## Fuera de alcance (explícitamente, según el PDF del reto)

- No se evalúa diseño perfecto al píxel.
- No se evalúa 100% de precisión en extracción en todos los formatos de CV posibles.
- No se necesita autenticación de usuarios.
- No se necesita persistencia en base de datos para el flujo principal (ver `architecture.md`).
