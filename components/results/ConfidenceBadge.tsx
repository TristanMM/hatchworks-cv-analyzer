export type ConfidenceLevel = "high" | "low" | "missing";

export type ConfidenceBadgeProps = {
  level?: ConfidenceLevel;
  fieldLabel?: string;
};

/**
 * Subtle visual confidence indicator per extracted field (see context.md,
 * "unreliable field"). "high" shows nothing; "low"/"missing" show a small
 * colored dot with a native tooltip explaining the state.
 */
export function ConfidenceBadge({ level, fieldLabel }: ConfidenceBadgeProps) {
  if (!level || level === "high") return null;

  const isLow = level === "low";
  const dotColorClass = isLow ? "bg-warning" : "bg-neutral-confidence";
  const message = isLow
    ? "low-confidence data"
    : "could not extract this data with confidence";
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
