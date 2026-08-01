import type { CVData } from "@/types/cv";

export type ExperienceTimelineProps = {
  experience?: CVData["experience"];
};

/**
 * Timeline visual de experiencia laboral, ver context.md.
 * TODO: implementar el renderizado de la línea de tiempo.
 */
export function ExperienceTimeline({ experience: _experience }: ExperienceTimelineProps) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
      Experiencia (próximamente)
    </div>
  );
}
