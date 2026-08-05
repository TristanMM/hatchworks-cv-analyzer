"use client";

import { useEffect, useRef, useState } from "react";
import type { CVData } from "@/types/cv";

export type ProjectsGridProps = {
  projects: CVData["projects"];
};

type VisibleProject = {
  project: CVData["projects"][number];
  index: number;
};

/**
 * Project cards grid (see context.md).
 */
export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const visibleProjects = getVisibleProjects(projects);

  if (visibleProjects.length === 0) return null;

  return (
    <div className="w-full">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground print:mb-4 print:break-after-avoid">
        <FolderIcon className="h-5 w-5 text-primary" />
        Projects
      </h2>
      <section className="rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8 print:break-inside-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:flex print:flex-wrap">
          {visibleProjects.map(({ project, index }) => (
            <ProjectCard key={`project-${index}`} project={project} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectCard({ project }: { project: CVData["projects"][number] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);

  const title = project.title?.trim() || null;
  const dateRange = formatDateRange(project.startDate, project.endDate);
  const description = project.description?.trim() || null;
  const technologies = project.technologies
    .map((tech) => tech.trim())
    .filter((tech) => tech.length > 0);

  useEffect(() => {
    if (!description) return;
    const element = descriptionRef.current;
    if (!element) return;

    const checkOverflow = () => {
      if (isExpanded) return;
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(checkOverflow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [description, isExpanded]);

  return (
    <article className="flex flex-col rounded-lg border border-border bg-surface p-4 shadow-card print:w-1/3 print:break-inside-avoid">
      {title && (
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      )}
      {dateRange && (
        <p className="mt-1 text-xs text-muted-foreground">{dateRange}</p>
      )}
      {description && (
        <>
          <p
            ref={descriptionRef}
            data-capture-clamp
            className={`mt-2 text-sm leading-relaxed text-muted-foreground print:line-clamp-none ${
              isExpanded ? "" : "line-clamp-3"
            }`}
          >
            {description}
          </p>
          {isOverflowing && (
            <button
              type="button"
              data-capture-hide
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="mt-1 self-start text-xs font-medium text-primary transition-colors hover:text-primary-hover print:hidden"
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </>
      )}
      {technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-sm bg-primary-subtle px-2 py-0.5 text-xs text-primary"
            >
              {tech}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function getVisibleProjects(projects: CVData["projects"]): VisibleProject[] {
  return projects
    .map((project, index) => ({ project, index }))
    .filter(({ project }) => !isProjectEmpty(project))
    .sort((a, b) => {
      const scoreA = getRecencyScore(a.project.endDate, a.project.startDate);
      const scoreB = getRecencyScore(b.project.endDate, b.project.startDate);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.index - b.index;
    });
}

function isProjectEmpty(project: CVData["projects"][number]): boolean {
  const hasTechnologies = project.technologies.some((tech) => tech.trim().length > 0);

  return !(
    project.title?.trim() ||
    project.description?.trim() ||
    formatDateRange(project.startDate, project.endDate) ||
    hasTechnologies
  );
}

function formatDateRange(
  startDate: string | null,
  endDate: string | null
): string | null {
  const start = startDate?.trim() || null;
  const end = endDate?.trim() || null;

  if (start && end) return `${start} — ${end}`;
  return start ?? end;
}

function getRecencyScore(
  endDate: string | null,
  startDate: string | null
): number {
  if (endDate?.trim().toLowerCase() === "presente") {
    return Number.MAX_SAFE_INTEGER;
  }

  const endYear = extractLatestYear(endDate);
  const startYear = extractLatestYear(startDate);
  return endYear ?? startYear ?? -1;
}

function extractLatestYear(...dates: (string | null)[]): number | null {
  const years = dates
    .flatMap((d) => (d ? [...d.matchAll(/\d{4}/g)] : []))
    .map((m) => Number(m[0]));
  return years.length > 0 ? Math.max(...years) : null;
}

function FolderIcon({ className }: { className?: string }) {
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
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}
