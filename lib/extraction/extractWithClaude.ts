import Anthropic from "@anthropic-ai/sdk";
import { cvDataSchema } from "@/lib/extraction/schema";
import type { CVData } from "@/types/cv";

export type ExtractWithClaudeResult =
  | { success: true; data: CVData }
  | { success: false; errorType: string; message: string };

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;

// Guarda de costo: un CV normal está muy por debajo de esto. Truncar evita
// gastar tokens de más con un PDF gigante que igual pasó la validación de 10 MB.
const MAX_INPUT_CHARS = 60000;

const CONFIDENCE_LEVELS = ["high", "low", "missing"] as const;

const CONFIDENCE_FIELD_PATHS = [
  "name",
  "contact.email",
  "contact.phone",
  "contact.location",
  "contact.linkedin",
  "experience",
  "education",
  "projects",
  "skills",
] as const;

// NO usar { type: ["string", "null"] } aquí: Anthropic impone un límite duro
// de 16 parámetros con tipos unión (anyOf/arrays de tipo) por request, porque
// cada uno duplica el estado de la grammar de compilación (costo
// exponencial). Con 19 campos de texto nullable en este schema, ese patrón
// hace fallar la llamada con "too many parameters with union types". En vez
// de eso, el modelo devuelve "" (string vacío) como centinela de "dato
// ausente", y `normalizeEmptyStringsToNull` lo convierte a `null` antes de
// validar con `cvDataSchema` — el contrato `CVData` no se entera del cambio.
const nullableText = { type: "string" };

/**
 * Schema JSON que se manda a la API para forzar la salida estructurada.
 * Se escribe a mano en vez de derivarlo de `cvDataSchema` porque structured
 * outputs exige `additionalProperties: false` en cada objeto: un record de
 * claves dinámicas se convertiría en un objeto cerrado sin properties y el
 * modelo no podría devolver ninguna clave de `confidence`. `cvDataSchema`
 * sigue siendo la única compuerta de validación de la respuesta.
 */
const CV_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "contact", "experience", "education", "projects", "skills", "confidence"],
  properties: {
    name: nullableText,
    contact: {
      type: "object",
      additionalProperties: false,
      required: ["email", "phone", "location", "linkedin"],
      properties: {
        email: nullableText,
        phone: nullableText,
        location: nullableText,
        linkedin: nullableText,
      },
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["company", "role", "startDate", "endDate", "description"],
        properties: {
          company: nullableText,
          role: nullableText,
          startDate: nullableText,
          endDate: nullableText,
          description: nullableText,
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["institution", "degree", "field", "startDate", "endDate"],
        properties: {
          institution: nullableText,
          degree: nullableText,
          field: nullableText,
          startDate: nullableText,
          endDate: nullableText,
        },
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "startDate", "endDate", "description", "technologies"],
        properties: {
          title: nullableText,
          startDate: nullableText,
          endDate: nullableText,
          description: nullableText,
          technologies: { type: "array", items: { type: "string" } },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: [...CONFIDENCE_FIELD_PATHS],
      properties: Object.fromEntries(
        CONFIDENCE_FIELD_PATHS.map((fieldPath) => [
          fieldPath,
          { type: "string", enum: [...CONFIDENCE_LEVELS] },
        ])
      ),
    },
  },
};

const BASE_SYSTEM_PROMPT = `Eres un extractor de datos de currículums (CV). Recibes el texto plano de un CV y devuelves su información estructurada.

Reglas obligatorias:

1. Extrae únicamente lo que aparece explícitamente en el texto. Nunca inventes, completes ni infieras datos que no estén escritos. Si un dato de texto no aparece, devuelve un string vacío (""); si una sección completa no aparece (experiencia, educación, proyectos, habilidades), devuelve un arreglo vacío.
2. Extrae también los proyectos académicos o personales (secciones como "Proyectos", "Projects" o "Portfolio") siempre que el CV incluya esa sección, sin importar si también existe una sección de experiencia laboral formal: son secciones independientes, nunca una alternativa de la otra. Aplican las mismas reglas de la regla 1 (no inventar datos) y de la regla 4 (confianza) a cada campo de "projects", incluyendo "technologies" (si el CV no lista tecnologías para un proyecto, devuelve un arreglo vacío en vez de inventarlas).
3. No traduzcas ni reescribas el contenido. Conserva el idioma original del CV (español o inglés, tal como venga) y copia las fechas en el mismo formato libre en que aparecen (por ejemplo "Ene 2022", "2019-2021", "Presente").
4. El objeto "confidence" debe incluir siempre estas ${CONFIDENCE_FIELD_PATHS.length} claves: ${CONFIDENCE_FIELD_PATHS.join(", ")}. Para cada una usa:
   - "missing": el dato no se encontró en el texto.
   - "low": el dato existe pero es ambiguo, incompleto o de formato inconsistente (por ejemplo una fecha que no se puede interpretar con certeza, o un bloque de texto donde no queda claro qué es el puesto y qué es la empresa).
   - "high": el dato aparece de forma clara e inequívoca.
5. Responde exclusivamente con el JSON que cumple el schema. Sin explicaciones, sin comentarios, sin bloques de código.`;

const STRICT_RETRY_INSTRUCTIONS = `AVISO: tu respuesta anterior no cumplió el schema requerido y fue rechazada.

Este es el último intento. Verifica antes de responder que:
- Están presentes todas las claves de nivel superior: name, contact, experience, education, skills, confidence.
- "contact" incluye email, phone, location y linkedin (usa "" si no aparecen).
- Cada elemento de "experience" incluye company, role, startDate, endDate y description.
- Cada elemento de "education" incluye institution, degree, field, startDate y endDate.
- Cada elemento de "projects" incluye title, startDate, endDate, description y technologies (technologies es un arreglo de strings, vacío si no se listan tecnologías).
- "skills" es un arreglo de strings.
- "confidence" incluye exactamente las ${CONFIDENCE_FIELD_PATHS.length} claves indicadas, cada una con el valor "high", "low" o "missing".
- La respuesta es JSON válido y nada más que JSON.`;

type ValidationOutcome =
  | { success: true; data: CVData }
  | { success: false; invalidFields: string[] };

const CONTACT_TEXT_FIELDS = ["email", "phone", "location", "linkedin"] as const;
const EXPERIENCE_TEXT_FIELDS = ["company", "role", "startDate", "endDate", "description"] as const;
const EDUCATION_TEXT_FIELDS = ["institution", "degree", "field", "startDate", "endDate"] as const;
const PROJECT_TEXT_FIELDS = ["title", "startDate", "endDate", "description"] as const;

function emptyToNull(value: unknown): unknown {
  return typeof value === "string" && value === "" ? null : value;
}

function normalizeFields(item: unknown, fields: readonly string[]): void {
  if (typeof item !== "object" || item === null) return;
  const record = item as Record<string, unknown>;
  for (const field of fields) {
    if (field in record) record[field] = emptyToNull(record[field]);
  }
}

/**
 * Convierte el centinela "" (usado en el prompt para evitar el límite de
 * Anthropic de 16 parámetros con tipos unión, ver `nullableText` en
 * `CV_JSON_SCHEMA`) a `null`, antes de validar con `cvDataSchema`. Solo toca
 * los campos de texto nullable conocidos; no afecta `skills`, `technologies`
 * ni `confidence`, que no son nullable.
 */
function normalizeEmptyStringsToNull(json: unknown): unknown {
  if (typeof json !== "object" || json === null) return json;
  const data = json as Record<string, unknown>;

  data.name = emptyToNull(data.name);
  normalizeFields(data.contact, CONTACT_TEXT_FIELDS);
  if (Array.isArray(data.experience)) {
    for (const item of data.experience) normalizeFields(item, EXPERIENCE_TEXT_FIELDS);
  }
  if (Array.isArray(data.education)) {
    for (const item of data.education) normalizeFields(item, EDUCATION_TEXT_FIELDS);
  }
  if (Array.isArray(data.projects)) {
    for (const item of data.projects) normalizeFields(item, PROJECT_TEXT_FIELDS);
  }
  return data;
}

/**
 * Parsea el JSON de la respuesta y lo valida con `cvDataSchema`.
 * Devuelve las rutas de los campos que fallaron para poder loguear el motivo
 * sin exponer el contenido del CV ni la respuesta cruda del modelo.
 */
function parseAndValidate(responseText: string): ValidationOutcome {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch {
    // El error de JSON.parse incluye un fragmento del texto recibido, que puede
    // contener datos personales del CV: se loguea el paso, no el error (agents.md).
    console.error(
      "[extractWithClaude] la respuesta del modelo no es JSON válido:",
      { responseChars: responseText.length }
    );
    return { success: false, invalidFields: ["<respuesta no es JSON válido>"] };
  }

  const result = cvDataSchema.safeParse(normalizeEmptyStringsToNull(json));
  if (!result.success) {
    return {
      success: false,
      invalidFields: result.error.issues.map((issue) => issue.path.join(".")),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Envía el texto plano del CV a la API de Claude (modelo Haiku, porque es una
 * tarea de extracción estructurada y no de razonamiento complejo) con salida
 * forzada en JSON, y valida la respuesta con `cvDataSchema` (ver schema.ts).
 * Si la validación falla, reintenta una vez con un prompt más estricto antes
 * de devolver un error controlado.
 *
 * Debe ejecutarse únicamente desde el servidor: nunca exponer
 * `ANTHROPIC_API_KEY` al cliente (ver agents.md).
 */
export async function extractWithClaude(
  rawText: string
): Promise<ExtractWithClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      "[extractWithClaude] falta la variable de entorno ANTHROPIC_API_KEY"
    );
    return {
      success: false,
      errorType: "missing_api_key",
      message: "El servicio de extracción no está configurado correctamente.",
    };
  }

  const client = new Anthropic({ apiKey });
  const cvText = rawText.slice(0, MAX_INPUT_CHARS);

  for (const attempt of [1, 2]) {
    const isRetry = attempt === 2;

    let responseText: string;
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0,
        system: isRetry
          ? `${BASE_SYSTEM_PROMPT}\n\n${STRICT_RETRY_INSTRUCTIONS}`
          : BASE_SYSTEM_PROMPT,
        output_config: {
          format: { type: "json_schema", schema: CV_JSON_SCHEMA },
        },
        messages: [
          {
            role: "user",
            content: `Extrae la información estructurada del siguiente CV.\n\n<cv>\n${cvText}\n</cv>`,
          },
        ],
      });

      responseText = message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");
    } catch (error) {
      console.error(
        "[extractWithClaude] fallo en llamada a la API de Claude:",
        error
      );
      return {
        success: false,
        errorType: "claude_api_error",
        message: "No se pudo contactar el servicio de extracción. Intenta de nuevo.",
      };
    }

    const outcome = parseAndValidate(responseText);
    if (outcome.success) {
      return { success: true, data: outcome.data };
    }

    console.error("[extractWithClaude] respuesta inválida en validación con Zod:", {
      attempt,
      inputChars: cvText.length,
      invalidFields: outcome.invalidFields,
    });
  }

  return {
    success: false,
    errorType: "invalid_claude_response",
    message:
      "No se pudo estructurar la información del CV. Intenta con otro archivo.",
  };
}
