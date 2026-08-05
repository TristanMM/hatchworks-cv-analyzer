import { ConfidenceBadge, type ConfidenceLevel } from "@/components/results/ConfidenceBadge";
import type { CVData } from "@/types/cv";

export type ExperienceTimelineProps = {
  experience?: CVData["experience"];
  education?: CVData["education"];
  confidence?: CVData["confidence"];
};

type TimelineEntry = {
  id: string;
  kind: "experience" | "education";
  title: string | null;
  subtitle: string | null;
  dateRange: string | null;
  description: string | null;
  recencyScore: number;
  sortIndex: number;
  confidenceLevel?: ConfidenceLevel;
};

/**
 * Unified visual timeline of work experience and education (see context.md).
 */
export function ExperienceTimeline({
  experience = [],
  education = [],
  confidence,
}: ExperienceTimelineProps) {
  const entries = buildTimelineEntries(experience, education, confidence);

  if (entries.length === 0) return null;

  return (
    <section className="w-full rounded-lg border border-border bg-surface p-6 shadow-card sm:p-8">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
        <ClockIcon className="h-5 w-5 text-primary" />
        Timeline
      </h2>
      <ol className="relative ml-2 space-y-8 border-l border-border">
        {entries.map((entry) => (
          <TimelineItem key={entry.id} entry={entry} />
        ))}
      </ol>
    </section>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const { title, subtitle } = resolveTitleAndSubtitle(entry.title, entry.subtitle);

  return (
    <li className="relative pl-6 print:break-inside-avoid">
      <span
        className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${
          entry.kind === "experience" ? "bg-primary" : "bg-education"
        }`}
        aria-hidden="true"
      />
      <span className="mb-1 inline-flex items-center gap-1.5 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {getEntryLabel(entry.kind)}
        <ConfidenceBadge
          level={entry.confidenceLevel}
          fieldLabel={getEntryLabel(entry.kind)}
        />
      </span>
      {title && (
        <p className="text-base font-semibold text-foreground">{title}</p>
      )}
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
      {entry.dateRange && (
        <p className="mt-0.5 text-xs text-muted-foreground">{entry.dateRange}</p>
      )}
      {entry.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {entry.description}
        </p>
      )}
    </li>
  );
}

function resolveTitleAndSubtitle(
  title: string | null,
  subtitle: string | null
): { title: string | null; subtitle: string | null } {
  const trimmedTitle = title?.trim() || null;
  const trimmedSubtitle = subtitle?.trim() || null;

  if (trimmedTitle) {
    return { title: trimmedTitle, subtitle: trimmedSubtitle };
  }

  return { title: trimmedSubtitle, subtitle: null };
}

function buildTimelineEntries(
  experience: CVData["experience"],
  education: CVData["education"],
  confidence?: CVData["confidence"]
): TimelineEntry[] {
  const experienceEntries = experience.map((item, index) =>
    mapExperienceEntry(item, index, confidence)
  );
  const educationEntries = education.map((item, index) =>
    mapEducationEntry(item, index, confidence)
  );

  return [...experienceEntries, ...educationEntries]
    .filter((entry) => !isTimelineEntryEmpty(entry))
    .sort((a, b) => {
      if (b.recencyScore !== a.recencyScore) {
        return b.recencyScore - a.recencyScore;
      }
      return a.sortIndex - b.sortIndex;
    });
}

function mapExperienceEntry(
  item: CVData["experience"][number],
  index: number,
  confidence?: CVData["confidence"]
): TimelineEntry {
  return {
    id: `experience-${index}`,
    kind: "experience",
    title: item.role,
    subtitle: item.company,
    dateRange: formatDateRange(item.startDate, item.endDate),
    description: item.description?.trim() || null,
    recencyScore: getRecencyScore(item.endDate, item.startDate),
    sortIndex: index,
    confidenceLevel: confidence?.["experience"],
  };
}

function mapEducationEntry(
  item: CVData["education"][number],
  index: number,
  confidence?: CVData["confidence"]
): TimelineEntry {
  const degree = item.degree?.trim() || null;
  const field = item.field?.trim() || null;
  const title = degree ?? field;
  const description = degree && field ? field : null;

  return {
    id: `education-${index}`,
    kind: "education",
    title,
    subtitle: item.institution,
    dateRange: formatDateRange(item.startDate, item.endDate),
    description,
    recencyScore: getRecencyScore(item.endDate, item.startDate),
    sortIndex: index + 1000,
    confidenceLevel: confidence?.["education"],
  };
}

function isTimelineEntryEmpty(entry: TimelineEntry): boolean {
  return !(
    entry.title?.trim() ||
    entry.subtitle?.trim() ||
    entry.dateRange?.trim() ||
    entry.description?.trim()
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

export function getRecencyScore(
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

export function extractLatestYear(...dates: (string | null)[]): number | null {
  const years = dates
    .flatMap((d) => (d ? [...d.matchAll(/\d{4}/g)] : []))
    .map((m) => Number(m[0]));
  return years.length > 0 ? Math.max(...years) : null;
}

function getEntryLabel(kind: TimelineEntry["kind"]): string {
  return kind === "experience" ? "Experience" : "Education";
}

function ClockIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
