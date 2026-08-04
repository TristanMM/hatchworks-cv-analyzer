import type { CVData } from "@/types/cv";

export type StatsCardsProps = {
  data: CVData;
};

type StatCardProps = {
  value: string;
  label: string;
  caption?: string;
};

/**
 * Fila de tarjetas métricas del dashboard (experiencia/proyectos, habilidades,
 * educación reciente, confianza de extracción).
 */
export function StatsCards({ data }: StatsCardsProps) {
  const skillCount = data.skills.length;
  const educationStat = getMostRecentEducationStat(data.education);
  const completeness = calculateCompleteness(data.confidence);

  const stats: StatCardProps[] = [
    ...getExperienceProjectStats(data),
    { value: String(skillCount), label: "Habilidades" },
    {
      value: educationStat.value,
      label: "Educación reciente",
      caption: educationStat.caption,
    },
    {
      value: `${completeness}%`,
      label: "Confianza de extracción",
      caption: "Qué tan claro se pudo leer cada dato",
    },
  ];

  return (
    <div
      className={`grid w-full grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 ${
        stats.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      }`}
    >
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

function StatCard({ value, label, caption }: StatCardProps) {
  return (
    <div className="rounded-lg border-x border-b border-border border-t-2 border-t-primary bg-surface p-4 shadow-card">
      <p className="break-words text-base font-bold leading-tight tabular-nums text-foreground sm:text-lg">
        {value}
      </p>
      {caption && (
        <p className="mt-1 text-xs font-bold text-muted-foreground">{caption}</p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function getExperienceProjectStats(data: CVData): StatCardProps[] {
  const hasExperience = data.experience.length > 0;
  const hasProjects = data.projects.length > 0;

  if (hasExperience && hasProjects) {
    return [
      {
        value: String(data.experience.length),
        label: "Experiencias Laborales",
      },
      { value: String(data.projects.length), label: "Proyectos" },
    ];
  }

  if (hasExperience) {
    return [
      {
        value: String(data.experience.length),
        label: "Experiencias Laborales",
      },
    ];
  }

  if (hasProjects) {
    return [{ value: String(data.projects.length), label: "Proyectos" }];
  }

  return [{ value: "0", label: "Proyectos" }];
}

function calculateCompleteness(confidence: CVData["confidence"]): number {
  const values = Object.values(confidence);
  if (values.length === 0) return 0;
  const highCount = values.filter((v) => v === "high").length;
  return Math.round((highCount / values.length) * 100);
}

function getMostRecentEducationStat(
  education: CVData["education"]
): { value: string; caption?: string } {
  if (education.length === 0) return { value: "—" };

  let bestIndex = 0;
  let bestYear = extractLatestYear(
    education[0].endDate,
    education[0].startDate
  );

  for (let i = 1; i < education.length; i++) {
    const year = extractLatestYear(
      education[i].endDate,
      education[i].startDate
    );

    if (year === null) continue;
    if (bestYear === null || year > bestYear) {
      bestYear = year;
      bestIndex = i;
    }
  }

  return formatEducationStat(education[bestIndex]);
}

function formatEducationStat(
  entry: CVData["education"][number]
): { value: string; caption?: string } {
  const { degree, field } = entry;
  const value = degree || field || "—";
  const caption = field && field !== value ? field : undefined;
  return { value, caption };
}

function extractLatestYear(...dates: (string | null)[]): number | null {
  const years = dates
    .flatMap((d) => (d ? [...d.matchAll(/\d{4}/g)] : []))
    .map((m) => Number(m[0]));
  return years.length > 0 ? Math.max(...years) : null;
}
