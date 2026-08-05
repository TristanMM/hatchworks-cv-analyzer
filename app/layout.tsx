import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CV Analyzer — HatchWorks",
  description:
    "CV Analyzer and Reimagined Profile Viewer — HatchWorks AI technical challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
          {children}
        </div>
      </body>
    </html>
  );
}
