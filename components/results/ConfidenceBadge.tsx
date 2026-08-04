export type ConfidenceLevel = "high" | "low" | "missing";

export type ConfidenceBadgeProps = {
  level?: ConfidenceLevel;
  fieldLabel?: string;
};

/**
 * Indicador visual sutil de confianza por campo extraído (ver context.md,
 * "campo no confiable"). "high" no muestra nada; "low"/"missing" muestran un
 * punto de color pequeño con tooltip nativo explicando el estado.
 */
export function ConfidenceBadge({ level, fieldLabel }: ConfidenceBadgeProps) {
  if (!level || level === "high") return null;

  const isLow = level === "low";
  const dotColorClass = isLow ? "bg-warning" : "bg-neutral-confidence";
  const message = isLow
    ? "dato con confianza baja"
    : "no se pudo extraer este dato con confianza";
  const tooltip = fieldLabel ? `${fieldLabel}: ${message}` : capitalize(message);

  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotColorClass}`}
      role="img"
      aria-label={tooltip}
      title={tooltip}
    />
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
