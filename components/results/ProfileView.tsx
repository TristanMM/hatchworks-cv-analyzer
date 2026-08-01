import type { CVData } from "@/types/cv";

export type ProfileViewProps = {
  data?: CVData;
};

/**
 * Vista de resultados rediseñada (dashboard/portafolio), ver context.md.
 * TODO: implementar el diseño visual del perfil extraído.
 */
export function ProfileView({ data: _data }: ProfileViewProps) {
  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
      Perfil (próximamente)
    </div>
  );
}
