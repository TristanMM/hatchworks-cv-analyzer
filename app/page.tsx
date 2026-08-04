"use client";

import { useState } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProfileView } from "@/components/results/ProfileView";
import { StatsCards } from "@/components/results/StatsCards";
import { ExperienceTimeline } from "@/components/results/ExperienceTimeline";
import { ProjectsGrid } from "@/components/results/ProjectsGrid";
import { SkillsTags } from "@/components/results/SkillsTags";
import type { ApiResult, CVData } from "@/types/cv";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<CVData> | null>(null);

  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      const body: ApiResult<CVData> = await response.json();
      setResult(body);
    } catch (error) {
      console.error("[HomePage] fallo en la petición a /api/extract:", error);
      setResult({
        success: false,
        error: {
          type: "network_error",
          message:
            "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Analizador de CV</h1>
        <p className="text-sm text-gray-500">
          Sube tu CV y obtén un perfil rediseñado
        </p>
      </div>

      <FileUploader onFileSelected={handleFileSelected} />

      {isLoading && <p className="text-sm text-gray-500">Procesando...</p>}

      {!isLoading && result && !result.success && (
        <div className="flex w-full max-w-2xl flex-col gap-2">
          <p className="text-sm font-medium text-red-600">{result.error.message}</p>
          <pre className="overflow-auto rounded bg-gray-100 p-4 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {!isLoading && result && result.success && (
        <div className="flex w-full flex-col gap-6">
          <ProfileView data={result.data} />
          <StatsCards data={result.data} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <ExperienceTimeline
              experience={result.data.experience}
              education={result.data.education}
              confidence={result.data.confidence}
            />
            <SkillsTags skills={result.data.skills} />
          </div>
          <ProjectsGrid projects={result.data.projects} />
        </div>
      )}
    </main>
  );
}
