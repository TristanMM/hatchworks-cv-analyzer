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
 * Compares original and edited values and promotes to "high" the fields
 * (or full sections, for experience/education/projects) that had confidence
 * "low"/"missing" and were modified by the user. Unchanged fields keep their
 * original level; a "high" value is never degraded (see plan "Edit CV
 * information").
 */
export function promoteConfidence(original: CVData, edited: CVData): CVData["confidence"] {
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
 * In-memory edit modal for the main CVData fields (see plan "Edit CV
 * information"). Does not persist anything to the backend: on save, `onSave`
 * returns the edited CVData (with confidence promoted on modified fields/sections
 * that were "low"/"missing") so the caller can update its local state.
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
            Edit information
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Basic information</h3>
              <FieldGroup
                label="Name"
                fieldLabel="Name"
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
                label="Summary"
                fieldLabel="Summary"
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
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
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
                label="Phone"
                fieldLabel="Phone"
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
                label="Location"
                fieldLabel="Location"
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
                <h3 className="text-sm font-semibold text-foreground">Experience</h3>
                {editedData.experience.map((item, index) => (
                  <EntryCard
                    key={`experience-${index}`}
                    label="Experience"
                    index={index}
                    confidenceLevel={editedData.confidence["experience"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={LABEL_CLASS}>
                        Company
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
                        Role
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
                        Start date
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
                        End date
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
                      Description
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
                <h3 className="text-sm font-semibold text-foreground">Education</h3>
                {editedData.education.map((item, index) => (
                  <EntryCard
                    key={`education-${index}`}
                    label="Education"
                    index={index}
                    confidenceLevel={editedData.confidence["education"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={LABEL_CLASS}>
                        Institution
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
                        Degree
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
                        Field of study
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
                        Start date
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
                        End date
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
                <h3 className="text-sm font-semibold text-foreground">Projects</h3>
                {editedData.projects.map((item, index) => (
                  <EntryCard
                    key={`project-${index}`}
                    label="Project"
                    index={index}
                    confidenceLevel={editedData.confidence["projects"]}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className={`${LABEL_CLASS} sm:col-span-2`}>
                        Title
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
                        Start date
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
                        End date
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
                      Description
                      <textarea
                        className={TEXTAREA_CLASS}
                        value={item.description ?? ""}
                        onChange={(event) =>
                          updateProjectField(index, "description", event.target.value)
                        }
                      />
                    </label>
                    <label className={LABEL_CLASS}>
                      Technologies (comma-separated)
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
              <h3 className="text-sm font-semibold text-foreground">Skills</h3>
              <FieldGroup
                label="Skills (comma-separated)"
                fieldLabel="Skills"
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            Save changes
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
