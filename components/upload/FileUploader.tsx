"use client";

export type FileUploaderProps = {
  onFileSelected?: (file: File) => void;
};

/**
 * Componente de upload con drag & drop (ver architecture.md).
 * TODO: implementar drag & drop, estados de carga y validación de archivo.
 */
export function FileUploader({ onFileSelected: _onFileSelected }: FileUploaderProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
      Subir CV (próximamente)
    </div>
  );
}
