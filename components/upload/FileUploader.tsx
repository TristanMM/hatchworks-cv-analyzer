"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import { validateFile } from "@/lib/utils/fileValidation";

export type FileUploaderProps = {
  onFileSelected?: (file: File) => void;
};

/**
 * Upload component with drag & drop (see architecture.md).
 * Stores the selected file in local state and validates that it is PDF or DOCX.
 * TODO: send the file to /api/extract (not yet implemented).
 */
export function FileUploader({ onFileSelected }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const result = validateFile(file);
      if (!result.success) {
        setSelectedFile(null);
        setError(result.message);
        return;
      }

      setSelectedFile(file);
      setError(null);
      onFileSelected?.(file);
    },
    [onFileSelected]
  );

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    event.target.value = "";
  };

  return (
    <label
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center text-sm transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-50 text-blue-600"
          : "border-gray-300 text-gray-500 hover:border-gray-400"
      }`}
    >
      <input
        type="file"
        accept=".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={handleInputChange}
      />
      {selectedFile ? (
        <span className="font-medium text-gray-700">{selectedFile.name}</span>
      ) : (
        <span>Drag your PDF or DOCX CV here, or click to select it</span>
      )}
      {error && <span className="mt-2 text-xs text-red-600">{error}</span>}
    </label>
  );
}
