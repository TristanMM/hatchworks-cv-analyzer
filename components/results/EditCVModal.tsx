"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ConfidenceBadge, type ConfidenceLevel } from "@/components/results/ConfidenceBadge";
import { Button } from "@/components/ui/Button";
import type { CVData } from "@/types/cv";

export type EditCVModalProps = {
  data: CVData;
  onSave: (data: CVData) => void;
  onClose: () => void;
};

const SCALAR_CONFIDENCE_FIELDS: Array<{
  path: string;
  get: (data: CVData) => string | null;
}> = [
  { path: "name", get: (d) => d.name },
  { path: "summary", get: (d) => d.summary },
  { path: "contact.email", get: (d) => d.contact.email },
  { path: "contact.phone", get: (d) => d.contact.phone },
  { path: "contact.location", get: (d) => d.contact.location },
  { path: "contact.linkedin", get: (d) => d.contact.linkedin },
];

function isLowOrMissing(level: string | undefined): boolean {
  return level === "low" || level === "missing";
}

function hasArrayChanged<T>(original: T[], edited: T[]): boolean {
  return JSON.stringify(original) !== JSON.stringify(edited);
}

/**
 * Compara los valores originales y editados y promueve a "high" los campos
 * (o secciones completas, para experience/education/projects) que tenían
 * confidence "low"/"missing" y fueron modificados por el usuario. Los campos
 * sin cambios conservan su nivel original; nunca se degrada un valor "high"
 * (ver plan "Editar información del CV").
 */
function promoteConfidence(original: CVData, edited: CVData): CVData["confidence"] {
  const confidence = { ...edited.confidence };

  for (const field of SCALAR_CONFIDENCE_FIELDS) {
    const changed = field.get(original) !== field.get(edited);
    if (changed && isLowOrMissing(confidence[field.path])) {
      confidence[field.path] = "high";
    }
  }

  if (
    hasArrayChanged(original.experience, edited.experience) &&
    isLowOrMissing(confidence.experience)
  ) {
    confidence.experience = "high";
  }
  if (
    hasArrayChanged(original.education, edited.education) &&
    isLowOrMissing(confidence.education)
  ) {
    confidence.education = "high";
  }
  if (
    hasArrayChanged(original.projects, edited.projects) &&
    isLowOrMissing(confidence.projects)
  ) {
    confidence.projects = "high";
  }
  if (
    hasArrayChanged(original.skills, edited.skills) &&
    isLowOrMissing(confidence.skills)
  ) {
    confidence.skills = "high";
  }

  return confidence;
}

function parseCommaSeparatedList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const INPUT_CLASS =
  "w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none";
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[80px] resize-y`;
const LABEL_CLASS = "flex flex-col gap-1 text-xs font-medium text-muted-foreground";

/**
 * Modal de edición en memoria de los campos principales de CVData (ver plan
 * "Editar información del CV"). No persiste nada en backend: al guardar,
 * `onSave` devuelve el CVData editado (con confidence promovida en los
 * campos/secciones modificados que eran "low"/"missing") para que el llamador
 * actualice su estado local.
 */
export function EditCVModal({ data, onSave, onClose }: EditCVModalProps) {
  const [editedData, setEditedData] = useState<CVData>(() => structuredClone(data));
  const [techDrafts, setTechDrafts] = useState<string[]>(() =>
    data.projects.map((project) => project.technologies.join(", "))
  );
  const [skillsDraft, setSkillsDraft] = useState<string>(() => data.skills.join(", "));

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function updateName(value: string) {
    setEditedData((prev) => ({ ...prev, name: value === "" ? null : value }));
  }

  function updateSummary(value: string) {
    setEditedData((prev) => ({ ...prev, summary: value === "" ? null : value }));
  }

  function updateContactField(field: keyof CVData["contact"], value: string) {
    setEditedData((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value === "" ? null : value },
    }));
  }

  function updateExperienceField(
    index: number,
    field: keyof CVData["experience"][number],
    value: string
  ) {
    setEditedData((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) =>
        i === index ? { ...item, [field]: value === "" ? null : value } : item
      ),
    }));
  }

  function updateEducationField(
    index: number,
    field: keyof CVData["education"][number],
    value: string
  ) {
    setEditedData((prev) => ({
      ...prev,
      education: prev.education.map((item, i) =>
        i === index ? { ...item, [field]: value === "" ? null : value } : item
      ),
    }));
  }

  function updateProjectField(
    index: number,
    field: "title" | "startDate" | "endDate" | "description",
    value: string
  ) {
    setEditedData((prev) => ({
      ...prev,
      projects: prev.projects.map((item, i) =>
        i === index ? { ...item, [field]: value === "" ? null : value } : item
      ),
    }));
  }

  function updateProjectTechnologies(index: number, value: string) {
    setTechDrafts((prev) => prev.map((draft, i) => (i === index ? value : draft)));
  }

  function handleSave() {
    const finalData: CVData = {
      ...editedData,
      skills: parseCommaSeparatedList(skillsDraft),
      projects: editedData.projects.map((project, index) => ({
        ...project,
        technologies: parseCommaSeparatedList(techDrafts[index] ?? ""),
      })),
    };

    onSave({ ...finalData, confidence: promoteConfidence(data, finalData) });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-cv-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-surface shadow-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 id="edit-cv-modal-title" className="text-lg font-semibold text-foreground">
            Editar información
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Información básica</h3>
              <FieldGroup
                label="Nombre"
                fieldLabel="Nombre"
                confidenceLevel={editedData.confidence["name"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editedData.name ?? ""}
                  onChange={(event) => updateName(event.target.value)}
                />
              </FieldGroup>
              <FieldGroup
                label="Resumen"
                fieldLabel="Resumen"
                confidenceLevel={editedData.confidence["summary"]}
              >
                <textarea
                  className={TEXTAREA_CLASS}
                  value={editedData.summary ?? ""}
                  onChange={(event) => updateSummary(event.target.value)}
                />
              </FieldGroup>
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
              <FieldGroup
                label="Email"
                fieldLabel="Email"
                confidenceLevel={editedData.confidence["contact.email"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editedData.contact.email ?? ""}
                  onChange={(event) => updateContactField("email", event.target.value)}
                />
              </FieldGroup>
              <FieldGroup
                label="Teléfono"
                fieldLabel="Teléfono"
                confidenceLevel={editedData.confidence["contact.phone"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editedData.contact.phone ?? ""}
                  onChange={(event) => updateContactField("phone", event.target.value)}
                />
              </FieldGroup>
              <FieldGroup
                label="Ubicación"
                fieldLabel="Ubicación"
                confidenceLevel={editedData.confidence["contact.location"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editedData.contact.location ?? ""}
                  onChange={(event) => updateContactField("location", event.target.value)}
                />
              </FieldGroup>
              <FieldGroup
                label="LinkedIn"
                fieldLabel="LinkedIn"
                confidenceLevel={editedData.confidence["contact.linkedin"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editedData.contact.linkedin ?? ""}
                  onChange={(event) => updateContactField("linkedin", event.target.value)}
                />
              </FieldGroup>
            </section>

            {editedData.experience.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">Experiencia</h3>
                {editedData.experience.map((item, index) => (
                  <EntryCard
                    key={`experience-${index}`}
                    label="Experiencia"
                    index={index}
                    confidenceLevel={editedData.confidence["experience"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={LABEL_CLASS}>
                        Empresa
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.company ?? ""}
                          onChange={(event) =>
                            updateExperienceField(index, "company", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Puesto
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.role ?? ""}
                          onChange={(event) =>
                            updateExperienceField(index, "role", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de inicio
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.startDate ?? ""}
                          onChange={(event) =>
                            updateExperienceField(index, "startDate", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de fin
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.endDate ?? ""}
                          onChange={(event) =>
                            updateExperienceField(index, "endDate", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <label className={LABEL_CLASS}>
                      Descripción
                      <textarea
                        className={TEXTAREA_CLASS}
                        value={item.description ?? ""}
                        onChange={(event) =>
                          updateExperienceField(index, "description", event.target.value)
                        }
                      />
                    </label>
                  </EntryCard>
                ))}
              </section>
            )}

            {editedData.education.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">Educación</h3>
                {editedData.education.map((item, index) => (
                  <EntryCard
                    key={`education-${index}`}
                    label="Educación"
                    index={index}
                    confidenceLevel={editedData.confidence["education"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={LABEL_CLASS}>
                        Institución
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.institution ?? ""}
                          onChange={(event) =>
                            updateEducationField(index, "institution", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Título
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.degree ?? ""}
                          onChange={(event) =>
                            updateEducationField(index, "degree", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Campo de estudio
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.field ?? ""}
                          onChange={(event) =>
                            updateEducationField(index, "field", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de inicio
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.startDate ?? ""}
                          onChange={(event) =>
                            updateEducationField(index, "startDate", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de fin
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.endDate ?? ""}
                          onChange={(event) =>
                            updateEducationField(index, "endDate", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </EntryCard>
                ))}
              </section>
            )}

            {editedData.projects.length > 0 && (
              <section className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground">Proyectos</h3>
                {editedData.projects.map((item, index) => (
                  <EntryCard
                    key={`project-${index}`}
                    label="Proyecto"
                    index={index}
                    confidenceLevel={editedData.confidence["projects"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={`${LABEL_CLASS} sm:col-span-2`}>
                        Título
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.title ?? ""}
                          onChange={(event) =>
                            updateProjectField(index, "title", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de inicio
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.startDate ?? ""}
                          onChange={(event) =>
                            updateProjectField(index, "startDate", event.target.value)
                          }
                        />
                      </label>
                      <label className={LABEL_CLASS}>
                        Fecha de fin
                        <input
                          type="text"
                          className={INPUT_CLASS}
                          value={item.endDate ?? ""}
                          onChange={(event) =>
                            updateProjectField(index, "endDate", event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <label className={LABEL_CLASS}>
                      Descripción
                      <textarea
                        className={TEXTAREA_CLASS}
                        value={item.description ?? ""}
                        onChange={(event) =>
                          updateProjectField(index, "description", event.target.value)
                        }
                      />
                    </label>
                    <label className={LABEL_CLASS}>
                      Tecnologías (separadas por coma)
                      <input
                        type="text"
                        className={INPUT_CLASS}
                        value={techDrafts[index] ?? ""}
                        onChange={(event) =>
                          updateProjectTechnologies(index, event.target.value)
                        }
                      />
                    </label>
                  </EntryCard>
                ))}
              </section>
            )}

            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Habilidades</h3>
              <FieldGroup
                label="Habilidades (separadas por coma)"
                fieldLabel="Habilidades"
                confidenceLevel={editedData.confidence["skills"]}
              >
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={skillsDraft}
                  onChange={(event) => setSkillsDraft(event.target.value)}
                />
              </FieldGroup>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  fieldLabel,
  confidenceLevel,
  children,
}: {
  label: string;
  fieldLabel: string;
  confidenceLevel?: ConfidenceLevel;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${getFieldHighlightClassName(confidenceLevel)}`}>
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {label}
        <ConfidenceBadge level={confidenceLevel} fieldLabel={fieldLabel} />
      </span>
      {children}
    </div>
  );
}

function EntryCard({
  label,
  index,
  confidenceLevel,
  children,
}: {
  label: string;
  index: number;
  confidenceLevel?: ConfidenceLevel;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-3 rounded-md border p-4 ${getEntryHighlightClassName(confidenceLevel)}`}>
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-semibold text-muted-foreground">
          {label} {index + 1}
        </p>
        <ConfidenceBadge level={confidenceLevel} fieldLabel={label} />
      </div>
      {children}
    </div>
  );
}

function getFieldHighlightClassName(level?: ConfidenceLevel): string {
  if (level === "low") return "rounded-md border border-warning bg-warning-subtle p-2";
  if (level === "missing")
    return "rounded-md border border-neutral-confidence bg-neutral-confidence-subtle p-2";
  return "";
}

function getEntryHighlightClassName(level?: ConfidenceLevel): string {
  if (level === "low") return "border-warning bg-warning-subtle";
  if (level === "missing") return "border-neutral-confidence bg-neutral-confidence-subtle";
  return "border-border";
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
