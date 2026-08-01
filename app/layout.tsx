import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Analizador de CV — HatchWorks",
  description:
    "Analizador de CV y Visor de Perfil Reimaginado — reto técnico de HatchWorks AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
