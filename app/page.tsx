"use client";

import { useRef, useState } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProfileView } from "@/components/results/ProfileView";
import { StatsCards } from "@/components/results/StatsCards";
import { ExperienceTimeline } from "@/components/results/ExperienceTimeline";
import { ProjectsGrid } from "@/components/results/ProjectsGrid";
import { SkillsTags } from "@/components/results/SkillsTags";
import { Button } from "@/components/ui/Button";
import type { ApiResult, CVData } from "@/types/cv";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<CVData> | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadImageError, setDownloadImageError] = useState<string | null>(
    null
  );
  const captureRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadImage = async () => {
    if (!captureRef.current) return;

    setIsDownloadingImage(true);
    setDownloadImageError(null);

    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        onclone: (_document, clonedElement) => {
          clonedElement
            .querySelectorAll<HTMLElement>("[data-capture-clamp]")
            .forEach((el) => {
              el.style.setProperty("overflow", "visible");
              el.style.setProperty("display", "block");
              el.style.setProperty("-webkit-box-orient", "horizontal");
              el.style.setProperty("-webkit-line-clamp", "none");
            });
          clonedElement
            .querySelectorAll<HTMLElement>("[data-capture-hide]")
            .forEach((el) => {
              el.style.setProperty("display", "none");
            });
          clonedElement.style.setProperty("padding", "2rem");
        },
      });
      const dataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = buildImageFilename(
        result?.success ? result.data.name : null
      );
      link.click();
    } catch (error) {
      console.error("[HomePage] fallo al generar la imagen del perfil:", error);
      setDownloadImageError("No se pudo generar la imagen. Intenta de nuevo.");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 print:min-h-0 print:justify-start print:gap-4 print:p-0">
      <div className="flex flex-col items-center gap-2 text-center print:hidden">
        <h1 className="text-3xl font-bold">Analizador de CV</h1>
        <p className="text-sm text-gray-500">
          Sube tu CV y obtén un perfil rediseñado
        </p>
      </div>

      <div className="print:hidden">
        <FileUploader onFileSelected={handleFileSelected} />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Procesando...</p>}

      {!isLoading && result && !result.success && (
        <p className="text-sm font-medium text-red-600">{result.error.message}</p>
      )}

      {!isLoading && result && result.success && (
        <div className="flex w-full flex-col gap-6">
          <div className="flex w-full flex-col items-end gap-1 print:hidden">
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                onClick={() => window.print()}
                className="bg-primary text-primary-foreground hover:bg-primary-hover print:hidden"
              >
                Descargar como PDF
              </Button>
              <Button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className="bg-primary text-primary-foreground hover:bg-primary-hover print:hidden disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloadingImage ? "Generando imagen..." : "Descargar como imagen"}
              </Button>
            </div>
            {downloadImageError && (
              <p className="max-w-sm text-right text-xs font-medium text-destructive print:hidden">
                {downloadImageError}
              </p>
            )}
          </div>
          <div ref={captureRef} className="flex w-full flex-col gap-6">
            <ProfileView data={result.data} />
            <StatsCards data={result.data} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start print:flex print:flex-wrap print:gap-6">
              <div className="print:w-[calc(50%-0.75rem)]">
                <ExperienceTimeline
                  experience={result.data.experience}
                  education={result.data.education}
                  confidence={result.data.confidence}
                />
              </div>
              <div className="print:w-[calc(50%-0.75rem)]">
                <SkillsTags skills={result.data.skills} />
              </div>
            </div>
            <ProjectsGrid projects={result.data.projects} />
          </div>
        </div>
      )}
    </main>
  );
}

function buildImageFilename(name: string | null | undefined): string {
  const slug = name
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `${slug}-cv.png` : "perfil-cv.png";
}
