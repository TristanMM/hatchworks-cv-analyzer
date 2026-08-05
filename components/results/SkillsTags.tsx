import type { CVData } from "@/types/cv";

export type SkillsTagsProps = {
  skills: CVData["skills"];
};

/**
 * Skills chip cloud (see context.md).
 */
export function SkillsTags({ skills }: SkillsTagsProps) {
  const visibleSkills = getVisibleSkills(skills);

  if (visibleSkills.length === 0) return null;

  return (
    <section className="w-full rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
        <ZapIcon className="h-5 w-5 text-primary" />
        Skills
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="rounded-sm bg-primary-subtle px-2 py-0.5 text-xs text-primary"
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}

function getVisibleSkills(skills: CVData["skills"]): string[] {
  return skills.map((skill) => skill.trim()).filter((skill) => skill.length > 0);
}

function ZapIcon({ className }: { className?: string }) {
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
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z" />
    </svg>
  );
}
