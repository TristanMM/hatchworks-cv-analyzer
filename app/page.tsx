import { FileUploader } from "@/components/upload/FileUploader";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold">Analizador de CV</h1>
        <p className="text-sm text-gray-500">
          Sube tu CV y obtén un perfil rediseñado
        </p>
      </div>
      <FileUploader />
    </main>
  );
}
