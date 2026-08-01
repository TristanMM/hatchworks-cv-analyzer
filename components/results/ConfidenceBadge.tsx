export type ConfidenceBadgeProps = {
  level?: "high" | "low" | "missing";
};

/**
 * Indicador visual de confianza por campo extraído (ver context.md, "campo
 * no confiable").
 * TODO: implementar estilos distintos por nivel de confianza.
 */
export function ConfidenceBadge({ level: _level }: ConfidenceBadgeProps) {
  return (
    <span className="inline-block rounded px-2 py-0.5 text-xs text-gray-500">
      Confianza (próximamente)
    </span>
  );
}
