import Anthropic from "@anthropic-ai/sdk";
import { cvDataSchema } from "@/lib/extraction/schema";
import type { CVData } from "@/types/cv";

export type ExtractWithClaudeResult =
  | { success: true; data: CVData }
  | { success: false; errorType: string; message: string };

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;

// Cost guard: a normal CV is well below this. Truncating avoids spending extra
// tokens on a huge PDF that still passed the 4 MB validation.
const MAX_INPUT_CHARS = 60000;

const CONFIDENCE_LEVELS = ["high", "low", "missing"] as const;

const CONFIDENCE_FIELD_PATHS = [
  "name",
  "summary",
  "contact.email",
  "contact.phone",
  "contact.location",
  "contact.linkedin",
  "experience",
  "education",
  "projects",
  "skills",
] as const;

// Do NOT use { type: ["string", "null"] } here: Anthropic imposes a hard limit
// of 16 parameters with union types (anyOf/type arrays) per request, because
// each one duplicates the compilation grammar state (exponential cost). With
// 19 nullable text fields in this schema, that pattern makes the call fail with
// "too many parameters with union types". Instead, the model returns "" (empty
// string) as a sentinel for "missing data", and `normalizeEmptyStringsToNull`
// converts it to `null` before validating with `cvDataSchema` — the `CVData`
// contract is unaware of the change.
const nullableText = { type: "string" };

/**
 * JSON schema sent to the API to force structured output. Written by hand
 * instead of deriving from `cvDataSchema` because structured outputs require
 * `additionalProperties: false` on each object: a record of dynamic keys would
 * become a closed object with no properties and the model could not return any
 * `confidence` key. `cvDataSchema` remains the sole validation gate for the
 * response.
 */
const CV_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "summary", "contact", "experience", "education", "projects", "skills", "confidence"],
  properties: {
    name: nullableText,
    summary: nullableText,
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
5. Responde exclusivamente con el JSON que cumple el schema. Sin explicaciones, sin comentarios, sin bloques de código.
6. Idiomas en skills (obligatorio y consistente): si el CV incluye una sección de idiomas (por ejemplo "Idiomas", "Languages", "Language skills" o equivalentes), debes incluir siempre cada idioma listado en el arreglo "skills", además de las demás habilidades técnicas o blandas que extraigas. Formato obligatorio:
   - Si el CV especifica un nivel para el idioma, usa exactamente "Idioma (Nivel)" — por ejemplo "Español (Nativo)", "Inglés (C1)", "Francés (Intermedio)". Conserva el idioma original del CV.
   - Si el CV no especifica nivel, incluye solo el nombre del idioma — por ejemplo "Español", "English".
   - No omitas idiomas de "skills" aunque también aparezcan en otra sección del CV. Esta regla aplica a todos los CVs que tengan sección de idiomas, sin excepción.
7. Resumen profesional: si el CV tiene una sección de presentación al inicio (por ejemplo "Perfil Profesional", "Summary", "Sobre mí", "Professional Summary", "Objetivo" o equivalentes), extrae ese párrafo tal cual aparece en "summary", sin resumir, parafrasear ni combinarlo con otras secciones. Si el CV no tiene una sección de este tipo, devuelve "" en "summary" (nunca inventes un resumen combinando otras secciones del CV).`;

const STRICT_RETRY_INSTRUCTIONS = `AVISO: tu respuesta anterior no cumplió el schema requerido y fue rechazada.

Este es el último intento. Verifica antes de responder que:
- Están presentes todas las claves de nivel superior: name, summary, contact, experience, education, skills, confidence.
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
 * Converts the "" sentinel (used in the prompt to avoid Anthropic's limit of
 * 16 union-type parameters, see `nullableText` in `CV_JSON_SCHEMA`) to `null`,
 * before validating with `cvDataSchema`. Only touches known nullable text
 * fields; does not affect `skills`, `technologies`, or `confidence`, which are
 * not nullable.
 */
function normalizeEmptyStringsToNull(json: unknown): unknown {
  if (typeof json !== "object" || json === null) return json;
  const data = json as Record<string, unknown>;

  data.name = emptyToNull(data.name);
  data.summary = emptyToNull(data.summary);
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
 * Parses the response JSON and validates it with `cvDataSchema`. Returns the
 * paths of fields that failed so the reason can be logged without exposing CV
 * content or the model's raw response.
 */
function parseAndValidate(responseText: string): ValidationOutcome {
  let json: unknown;
  try {
    json = JSON.parse(responseText);
  } catch {
    // JSON.parse errors include a fragment of the received text, which may
    // contain personal CV data: log the step, not the error (agents.md).
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
 * Sends the CV plain text to the Claude API (Haiku model, because it is a
 * structured extraction task, not complex reasoning) with forced JSON output,
 * and validates the response with `cvDataSchema` (see schema.ts). If validation
 * fails, retries once with a stricter prompt before returning a controlled error.
 *
 * Must run only on the server: never expose `ANTHROPIC_API_KEY` to the client
 * (see agents.md).
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
      message: "The extraction service is not configured correctly.",
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
        message: "Could not reach the extraction service. Try again.",
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
      "Could not structure the CV information. Try with another file.",
  };
}
