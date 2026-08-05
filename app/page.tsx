"use client";

import { useRef, useState } from "react";
import { FileUploader } from "@/components/upload/FileUploader";
import { ProfileView } from "@/components/results/ProfileView";
import { StatsCards } from "@/components/results/StatsCards";
import { ExperienceTimeline } from "@/components/results/ExperienceTimeline";
import { ProjectsGrid } from "@/components/results/ProjectsGrid";
import { SkillsTags } from "@/components/results/SkillsTags";
import { EditCVModal } from "@/components/results/EditCVModal";
import { Button } from "@/components/ui/Button";
import type { ApiResult, CVData } from "@/types/cv";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResult<CVData> | null>(null);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadImageError, setDownloadImageError] = useState<string | null>(
    null
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
      const body = await parseExtractResponse(response);
      setResult(body);
    } catch (error) {
      console.error("[HomePage] fallo en la petición a /api/extract:", error);
      setResult({
        success: false,
        error: {
          type: "network_error",
          message:
            "Could not connect to the server. Check your connection and try again.",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdits = (updatedData: CVData) => {
    setResult({ success: true, data: updatedData });
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
      setDownloadImageError("Could not generate the image. Try again.");
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8 print:min-h-0 print:justify-start print:gap-4 print:p-0">
      <div className="flex flex-col items-center gap-2 text-center print:hidden">
        <h1 className="text-3xl font-bold">CV Analyzer</h1>
        <p className="text-sm text-gray-500">
          Upload your CV and get a redesigned profile
        </p>
      </div>

      <div className="print:hidden">
        <FileUploader onFileSelected={handleFileSelected} />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Processing...</p>}

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
                Download as PDF
              </Button>
              <Button
                type="button"
                onClick={handleDownloadImage}
                disabled={isDownloadingImage}
                className="bg-primary text-primary-foreground hover:bg-primary-hover print:hidden disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloadingImage ? "Generating image..." : "Download as image"}
              </Button>
              <Button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="bg-primary text-primary-foreground hover:bg-primary-hover print:hidden"
              >
                Edit information
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
          {isEditModalOpen && (
            <EditCVModal
              data={result.data}
              onSave={handleSaveEdits}
              onClose={() => setIsEditModalOpen(false)}
            />
          )}
        </div>
      )}
    </main>
  );
}

/**
 * Interprets the /api/extract response. Vercel may reject the request at the
 * platform level (e.g. 413 for payload > 4.5 MB) before our API route runs,
 * returning a body that is not JSON — in that case `response.json()` throws and
 * the error must be mapped by HTTP status instead of letting that failure fall
 * into the generic network_error.
 */
async function parseExtractResponse(
  response: Response
): Promise<ApiResult<CVData>> {
  try {
    return await response.json();
  } catch (error) {
    console.error(
      "[HomePage] la respuesta de /api/extract no es JSON válido:",
      error
    );

    if (response.status === 413) {
      return {
        success: false,
        error: {
          type: "file_too_large",
          message: "The file exceeds the maximum allowed size of 4 MB.",
        },
      };
    }

    return {
      success: false,
      error: {
        type: "server_error",
        message: `The server responded with an unexpected error (${response.status}). Try again.`,
      },
    };
  }
}

function buildImageFilename(name: string | null | undefined): string {
  const slug = name
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `${slug}-cv.png` : "profile-cv.png";
}
